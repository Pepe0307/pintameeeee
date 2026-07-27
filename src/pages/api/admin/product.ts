import type { APIRoute } from 'astro';
import { createSupabaseServerClient } from '../../../lib/supabase-ssr';

export const POST: APIRoute = async ({ request, cookies }) => {
  const supabase = createSupabaseServerClient(cookies) as any;
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });
  }

  try {
    const formData = await request.formData();
    
    const title = formData.get('title')?.toString();
    const artist = formData.get('artist')?.toString();
    const priceStr = formData.get('price')?.toString();
    const category = formData.get('category')?.toString();
    const description = formData.get('description')?.toString();
    const dimensions = formData.get('dimensions')?.toString();
    const available = formData.get('available') === 'on';
    const featured = formData.get('featured') === 'on';
    
    let imageUrl = '';
    const image = formData.get('image');
    
    // Subir imagen al storage de Supabase (bucket: 'products')
    if (image instanceof File && image.size > 0) {
      const fileExt = image.name.split('.').pop() || 'jpg';
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
          .from('products')
          .upload(fileName, image);
          
      if (uploadError) {
        throw new Error(`Error subiendo imagen. Asegúrate de tener un bucket público llamado 'products'. Detalle: ${uploadError.message}`);
      }
      
      const { data: { publicUrl } } = supabase.storage.from('products').getPublicUrl(fileName);
      imageUrl = publicUrl;
    }

    const { error: insertError } = await supabase.from('products').insert({
      title,
      artist,
      price: priceStr ? parseFloat(priceStr) : null,
      currency: 'COP',
      category,
      description,
      dimensions,
      available,
      featured,
      ...(imageUrl ? { image_url: imageUrl } : {})
    });
    
    if (insertError) throw new Error(insertError.message);

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
};
