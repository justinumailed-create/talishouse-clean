export const productFamilies = {
  talishouse: {
    id: "talishouse",
    name: "Talishouse™",
    slug: "talishouse",
    image: "/images/talishouse-420.png",
    gridDescription: "Flexible modular housing solutions designed for modern living. 21' x 20' steel structures assembled in one day.",
  },
  glasshouse: {
    id: "glasshouse",
    name: "Glasshouse™",
    slug: "glasshouse",
    image: "/images/glasshouse-200.jpeg",
    gridDescription: "Modern glass living spaces with natural light and minimal design. Up to five units shipped together.",
  },
  talistowns: {
    id: "talistowns",
    name: "TalisTowns™",
    slug: "talistowns",
    image: "/images/talistowns.jpg",
    gridDescription: "Community development system using multiple Talishouse™ units. Scalable from single structures to complete communities.",
  },
};

export function getProductFamily(id: string) {
  return productFamilies[id as keyof typeof productFamilies] || null;
}
