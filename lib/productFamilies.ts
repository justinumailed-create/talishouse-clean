export const productFamilies = {
  talishouse: {
    id: "talishouse",
    name: "Talishouse™",
    slug: "talishouse",
    image: "/images/talishouse-400.png",
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
    name: "Talistowns™",
    slug: "talistowns",
    image: "/images/talistowns.jpg",
    gridDescription: `Talistowns™ consist of Talishouse™ 400 modules, two units under one roof. Permanent or mobile installation. Gable roofs are an extra charge option.
- A 12 months short-term rental season at $200 per night and 70% occupancy generates $51,100 in revenue per unit per year.
- A 12 months long-term rental season at $2,000 per month and 100% occupancy generates $24,000 in revenue per unit per year.
Conclusion: Talistowns™ are a great way to "moonlight" towards lifestyle goals and financial independence…!`,
  },
};

export function getProductFamily(id: string) {
  return productFamilies[id as keyof typeof productFamilies] || null;
}
