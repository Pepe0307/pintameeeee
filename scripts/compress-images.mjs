// One-off: shrink product images in Supabase Storage to cut egress.
// Dry run:  node --env-file=.env scripts/compress-images.mjs
// Apply:    node --env-file=.env scripts/compress-images.mjs --apply
// Originals are kept (in the bucket and in ./image-backup/), only the DB URLs change.
import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';
import { mkdir, writeFile } from 'node:fs/promises';

const APPLY = process.argv.includes('--apply');
const BUCKET = 'products';
const MAX_SIDE = 1200;
const SKIP_UNDER = 300_000; // already small enough, re-encoding only loses quality

const supabase = createClient(process.env.PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const prefix = `${process.env.PUBLIC_SUPABASE_URL}/storage/v1/object/public/${BUCKET}/`;

const { data: products, error } = await supabase.from('products').select('id, title, image_url, gallery_images');
if (error) throw error;
await mkdir('image-backup', { recursive: true });

let before = 0, after = 0;

async function optimize(url) {
  if (!url?.startsWith(prefix) || url.endsWith('-opt.webp')) return url;
  const path = decodeURIComponent(url.slice(prefix.length));
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} downloading ${path}`);
  const original = Buffer.from(await res.arrayBuffer());
  if (original.length < SKIP_UNDER) return url;

  const small = await sharp(original)
    .rotate() // apply EXIF orientation from phone photos before it's stripped
    .resize(MAX_SIDE, MAX_SIDE, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 75 })
    .toBuffer();
  before += original.length; after += small.length;
  console.log(`${(original.length / 1e6).toFixed(2)} MB -> ${(small.length / 1e6).toFixed(2)} MB  ${path}`);
  if (!APPLY) return url;

  await writeFile(`image-backup/${path.replaceAll('/', '_')}`, original);
  const newPath = path.replace(/\.[^./]+$/, '') + '-opt.webp';
  const { error: upErr } = await supabase.storage.from(BUCKET)
    .upload(newPath, small, { contentType: 'image/webp', cacheControl: '31536000', upsert: true });
  if (upErr) throw upErr;
  return supabase.storage.from(BUCKET).getPublicUrl(newPath).data.publicUrl;
}

for (const p of products) {
  try {
    const image_url = await optimize(p.image_url);
    const gallery_images = p.gallery_images && await Promise.all(p.gallery_images.map(optimize));
    if (APPLY && (image_url !== p.image_url || JSON.stringify(gallery_images) !== JSON.stringify(p.gallery_images))) {
      const { error: updErr } = await supabase.from('products').update({ image_url, gallery_images }).eq('id', p.id);
      if (updErr) throw updErr;
    }
  } catch (e) {
    console.error(`FAILED ${p.title} (${p.id}): ${e.message}`);
  }
}

console.log(`\nTotal: ${(before / 1e6).toFixed(1)} MB -> ${(after / 1e6).toFixed(1)} MB${APPLY ? '' : '  (dry run, nothing changed)'}`);
