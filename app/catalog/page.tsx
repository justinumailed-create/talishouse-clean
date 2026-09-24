import Link from "next/link";
import Image from "next/image";

/**
 * Talishouse e-commerce product line (storefront).
 * Public Product / `/catalogue` remains the Keynote flipbook.
 */
const products = [
  {
    name: "Glasshouse™ 160",
    href: "/glasshouse",
    image: "/images/glasshouse/hero.png",
    price: "From $58.50 per sq. ft.",
  },
  {
    name: "Talishouse™ 400",
    href: "/talishouse-recreational",
    image: "/images/talishouse-400.png",
    price: "From $58.50 per sq. ft.",
  },
  {
    name: "Talishouse™ 1,600",
    href: "/talishouse-residential",
    image: "/images/talishouse/residential/hero.jpg",
    price: "From $58.50 per sq. ft.",
  },
  {
    name: "Talistowns™",
    href: "/talistowns",
    image: "/images/talistowns.jpg",
    price: "From $58.50 per sq. ft.",
  },
];

export default function CatalogStorefrontPage() {
  return (
    <div className="min-h-screen bg-white">
      <section className="pt-32 pb-20 md:pt-40 md:pb-28">
        <div className="w-full px-5">
          <div className="max-w-3xl">
            <p className="text-sm font-medium tracking-[0.2em] uppercase text-gray-400 mb-4">
              Collection
            </p>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-light text-gray-900 mb-6 tracking-tight">
              Product Catalogue
            </h1>
            <p className="text-lg md:text-xl text-gray-500 font-light leading-relaxed">
              Modular homes and cottages crafted for modern living.
              Built in a day, move-in ready in a week.
            </p>
          </div>
        </div>
      </section>

      <section className="pb-32 md:pb-40">
        <div className="w-full px-5">
          <div className="catalog-grid">
            {products.map((product) => (
              <Link
                key={product.name}
                href={product.href}
                className="group block"
              >
                <div className="catalog-card rounded-2xl border border-gray-100 overflow-hidden bg-white transition-all duration-500 hover:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] hover:border-gray-200">
                  <div className="catalog-image">
                    <Image
                      src={product.image}
                      alt={product.name}
                      fill
                      style={{ objectFit: "cover" }}
                      className="transition-transform duration-700 group-hover:scale-105"
                    />
                  </div>
                  <div className="p-6 md:p-7">
                    <h3 className="text-lg md:text-xl font-medium text-gray-900 mb-2 tracking-tight">
                      {product.name}
                    </h3>
                    <p className="text-sm text-gray-500 font-light">
                      {product.price}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
