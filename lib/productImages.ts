export const PRODUCT_IMAGE_MAP: Record<string, string> = {
  '160': '/images/glasshouse-200.jpeg',
  '200': '/images/glasshouse-200.jpeg',
  '400': '/images/talishouse-420.png',
  '800': '/images/talishouse-420.png',
  '1600': '/images/talishouse-850.png',
  '2400': '/images/talishouse-850.png',
  'glasshouse': '/images/glasshouse-200.jpeg',
  'glasshouse-200': '/images/glasshouse-200.jpeg',
  'talishouse-420': '/images/talishouse-420.png',
  'talishouse-residential': '/images/talishouse-850.png',
  'talistowns': '/images/talistowns.jpg',
};

export function getProductImage(size?: string, type?: string) {
  if (type === 'glasshouse') return PRODUCT_IMAGE_MAP['glasshouse'];
  if (!size) return '/images/talishouse-420.png';
  
  if (PRODUCT_IMAGE_MAP[size]) {
    return PRODUCT_IMAGE_MAP[size];
  }
  
  if (size.includes('glasshouse')) {
    return PRODUCT_IMAGE_MAP['glasshouse'];
  }
  if (size.includes('talishouse') && size.includes('residential')) {
    return PRODUCT_IMAGE_MAP['talishouse-residential'];
  }
  if (size.includes('talishouse')) {
    return PRODUCT_IMAGE_MAP['talishouse-420'];
  }
  if (size === 'talistowns') {
    return PRODUCT_IMAGE_MAP['talistowns'];
  }
  
  console.warn('Missing product image mapping for:', { size, type });
  return '/images/talishouse-420.png';
}