export const categoryTranslations: Record<string, string> = {
  home: 'Hogar',
  'jewelry-boxes': 'Joyeros',
  accessories: 'Accesorios',
  frames: 'Portarretratos',
  '3d-print': 'Impresión 3D',
  print: 'Impresión',
  drawing: 'Dibujo',
  'digital-art': 'Arte Digital',
  'mixed-media': 'Técnica Mixta',
};

export const translateCategory = (category: string) => {
  return categoryTranslations[category] || category;
};
