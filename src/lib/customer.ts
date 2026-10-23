/**
 * Buyer and delivery details collected before an online payment.
 *
 * Shared by the payment form (BoldPayButton.astro) and the server
 * (/api/bold-signature), which validates them and saves them on the order.
 * We ask for these on our own page because the person paying (card or Nequi
 * owner) is often not the person receiving the piece.
 */

export const COLOMBIA_DEPARTMENTS = [
  'Amazonas', 'Antioquia', 'Arauca', 'Atlántico', 'Bogotá D.C.', 'Bolívar',
  'Boyacá', 'Caldas', 'Caquetá', 'Casanare', 'Cauca', 'Cesar', 'Chocó',
  'Córdoba', 'Cundinamarca', 'Guainía', 'Guaviare', 'Huila', 'La Guajira',
  'Magdalena', 'Meta', 'Nariño', 'Norte de Santander', 'Putumayo', 'Quindío',
  'Risaralda', 'San Andrés y Providencia', 'Santander', 'Sucre', 'Tolima',
  'Valle del Cauca', 'Vaupés', 'Vichada',
] as const;

export interface CustomerDetails {
  fullName: string;
  email: string;
  phone: string;       // digits only, e.g. "3001234567"
  address: string;
  city: string;
  department: string;
  notes: string | null;
}

export const CUSTOMER_LIMITS = {
  fullName: 100,
  email: 120,
  address: 200,
  city: 80,
  notes: 300,
} as const;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function clean(value: unknown, max: number): string | null {
  if (typeof value !== 'string') return null;
  // Collapse whitespace and drop control characters
  const text = value.replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim();
  return text.length > 0 && text.length <= max ? text : null;
}

/**
 * Validates details sent by the browser. Returns the cleaned details, or the
 * list of invalid field names.
 */
export function parseCustomerDetails(
  raw: unknown,
): { ok: true; customer: CustomerDetails } | { ok: false; fields: string[] } {
  const input = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const invalid: string[] = [];

  const fullName = clean(input.fullName, CUSTOMER_LIMITS.fullName);
  if (!fullName || fullName.length < 3) invalid.push('fullName');

  const email = clean(input.email, CUSTOMER_LIMITS.email)?.toLowerCase() ?? null;
  if (!email || !EMAIL_RE.test(email)) invalid.push('email');

  // Accept "300 123 4567", "+57 300-123-4567"…; store digits only
  let phone = typeof input.phone === 'string' ? input.phone.replace(/\D/g, '') : '';
  if (phone.length === 12 && phone.startsWith('57')) phone = phone.slice(2);
  if (!/^\d{7,10}$/.test(phone)) invalid.push('phone');

  const address = clean(input.address, CUSTOMER_LIMITS.address);
  if (!address || address.length < 5) invalid.push('address');

  const city = clean(input.city, CUSTOMER_LIMITS.city);
  if (!city || city.length < 2) invalid.push('city');

  const department = typeof input.department === 'string' ? input.department : '';
  if (!(COLOMBIA_DEPARTMENTS as readonly string[]).includes(department)) invalid.push('department');

  // Optional
  let notes: string | null = null;
  if (typeof input.notes === 'string' && input.notes.trim() !== '') {
    notes = clean(input.notes, CUSTOMER_LIMITS.notes);
    if (!notes) invalid.push('notes');
  }

  if (invalid.length > 0) return { ok: false, fields: invalid };
  return {
    ok: true,
    customer: { fullName: fullName!, email: email!, phone, address: address!, city: city!, department, notes },
  };
}
