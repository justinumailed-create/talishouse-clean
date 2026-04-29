export const PRODUCT_IMAGE_MAP: Record<string, string> = {
  // Glasshouse
  'glasshouse': '/images/glasshouse/hero.png',
  'glasshouse-160': '/images/glasshouse/hero.png',
  'glasshouse-200': '/images/glasshouse/models/200.png',
  
  // Talishouse Recreational
  'recreational': '/images/talishouse/recreational/hero.png',
  'talishouse-400': '/images/talishouse/recreational/hero.png',
  'talishouse-800': '/images/talishouse/recreational/models/800.png',
  
  // Talishouse Residential
  'residential': '/images/talishouse/residential/hero.jpg',
  'talishouse-residential': '/images/talishouse/residential/hero.jpg',
  'talishouse-1600': '/images/talishouse/residential/models/1600.png',
  'talishouse-2400': '/images/talishouse/residential/models/1600.png',
  
  // TalisTowns
  'talistowns': '/images/talistowns.jpg',
  
  // Legacy size codes
  '160': '/images/glasshouse/hero.png',
  '200': '/images/glasshouse/models/200.png',
  '400': '/images/talishouse/recreational/hero.png',
  '800': '/images/talishouse/recreational/models/800.png',
  '1600': '/images/talishouse/residential/models/1600.png',
  '2400': '/images/talishouse/residential/models/1600.png',
};

export function getProductImage(size?: string, type?: string) {
  // Log the lookup for debugging
  console.log(`[ImageLookup] size: ${size}, type: ${type}`);
  
  if (type === 'glasshouse' || size === 'glasshouse') {
    const path = PRODUCT_IMAGE_MAP['glasshouse'];
    console.log(`[ImageLookup] Glasshouse -> ${path}`);
    return path;
  }
  
  if (type === 'recreational' || (size && size.includes('400'))) {
    const path = PRODUCT_IMAGE_MAP['recreational'];
    console.log(`[ImageLookup] Recreational -> ${path}`);
    return path;
  }
  
  if (type === 'residential' || (size && (size.includes('1600') || size.includes('2400')))) {
    const path = PRODUCT_IMAGE_MAP['residential'];
    console.log(`[ImageLookup] Residential -> ${path}`);
    return path;
  }
  
  // TalisTowns - Strictly restricted to explicit 'talistowns' key
  if (size === 'talistowns') {
    const path = PRODUCT_IMAGE_MAP['talistowns'];
    console.log(`[ImageLookup] TalisTowns -> ${path}`);
    return path;
  }
  
  if (size && PRODUCT_IMAGE_MAP[size]) {
    const path = PRODUCT_IMAGE_MAP[size];
    console.log(`[ImageLookup] Direct match -> ${path}`);
    return path;
  }
  
  console.warn(`[ImageLookup] Missing product image for:`, { size, type });
  return ''; // Return empty for neutral fallback
}