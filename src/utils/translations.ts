export const categoryTranslations: Record<string, string> = {
  painting: 'Pintura',
  sculpture: 'Escultura',
  photography: 'Fotografía',
  digital: 'Digital',
  print: 'Impresión',
  drawing: 'Dibujo',
  'digital-art': 'Arte Digital',
  'mixed-media': 'Técnica Mixta',
};

export const translateCategory = (category: string) => {
  return categoryTranslations[category] || category;
};
