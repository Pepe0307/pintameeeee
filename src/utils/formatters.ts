export const formatPrice = (price: number | null | undefined, currency: string = 'COP') => {
  if (price === null || price === undefined) {
    return 'Precio por definir';
  }
  
  const formatted = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: currency,
    currencyDisplay: 'narrowSymbol',
    maximumFractionDigits: currency === 'COP' ? 0 : 2,
  }).format(price);
  
  // Remove whitespace (e.g., "$ 1.280.000" -> "$1.280.000")
  const cleanFormatted = formatted.replace(/\s/g, '');
  
  return `${currency} ${cleanFormatted}`;
};
