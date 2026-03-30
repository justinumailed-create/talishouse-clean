import Link from "next/link";
import Image from "next/image";

const PRODUCT_ROUTES: Record<string, { href: string; slug: string }> = {
  "glasshouse-200": { href: "/glasshouse", slug: "glasshouse-200" },
  "talishouse-420": { href: "/talishouse?product=420", slug: "talishouse-420" },
  "talishouse-residential": { href: "/talishouse?product=residential", slug: "talishouse-residential" },
  talistowns: { href: "/talistowns", slug: "talistowns" },
};

const products = [
  {
    id: "glasshouse-200",
    name: "Glasshouse™ 200",
    image: "/images/glasshouse-200.jpeg",
    description: "Compact modern glass living solution.",
    price: "From $19,950",
    specs: "8' x 20' • 1-3 sides glass • Short-term rental",
    href: PRODUCT_ROUTES["glasshouse-200"].href,
  },
  {
    id: "talishouse-420",
    name: "Talishouse™ 420",
    image: "/images/talishouse-420.png",
    description: "Flexible modular home system.",
    price: "From $39,950",
    specs: "21' x 20' • 2 bed • 1 bath • Assembled in 1 day",
    href: PRODUCT_ROUTES["talishouse-420"].href,
  },
  {
    id: "talishouse-residential",
    name: "Talishouse™ Residential",
    image: "/images/talishouse-850.png",
    description: "Expanded residential modular living solutions.",
    price: "From $39,975",
    specs: "21' x 20' • 2 bed • 1 bath • Extra space",
    href: PRODUCT_ROUTES["talishouse-residential"].href,
  },
  {
    id: "talistowns",
    name: "TalisTowns™",
    image: "/images/talistowns.jpg",
    description: "Scalable community developments using modular Talishouse systems.",
    price: "From $39,950/unit",
    specs: "Multi-unit • Community • Scalable",
    href: PRODUCT_ROUTES.talistowns.href,
  },
];



const purchasingOptions = [
  { id: "fast5", name: "FAST5", desc: "5% down payment program" },
  { id: "pac", name: "PAC+", desc: "Pre-approved credit financing" },
  { id: "splits", name: "SPLITS", desc: "ECommerce revenue sharing" },
  { id: "lto", name: "Lease-to-Own", desc: "Flexible ownership plans" },
];

export default function CatalogPage() {
  return (
    <div className="bg-[#f5f5f7] min-h-screen">
      {/* SECTION 1: HERO */}
      <section className="bg-[#f5f5f7] py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl font-semibold tracking-tight text-gray-900">
            Talishouse™ Product Catalog
          </h1>
          <p className="text-gray-500 text-sm mt-2">
            Modular living. Built to scale.
          </p>
        </div>
      </section>

      {/* SECTION 2: BASE PACKAGE */}
      <section className="py-10 px-4">
        <div className="max-w-4xl mx-auto bg-white rounded-2xl p-8 shadow-sm border border-[rgba(0,0,0,0.05)]">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Base Package</h2>
              <p className="text-gray-500 text-sm mt-1">
                Steel structure, standard windows, basic interior finishes
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-semibold text-gray-900">$8,500</p>
              <span className="inline-block mt-1 px-3 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                Included in every build
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: MODEL SELECTION */}
      <section className="py-10 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-lg font-medium text-gray-900 mb-6">Select Your Model</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {products.map((product) => (
              <Link
                key={product.id}
                href={product.href}
                className="
                  bg-white
                  rounded-2xl
                  overflow-hidden
                  border border-[rgba(0,0,0,0.06)]
                  hover:shadow-md
                  transition-all duration-300
                  hover:-translate-y-[2px]
                  block group
                "
              >
                <div className="aspect-[16/10] relative bg-gray-100">
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-lg font-medium text-gray-900">
                    {product.name}
                  </h3>
                  <p className="text-xl font-semibold text-gray-900 mt-1">
                    {product.price}
                  </p>
                  <p className="text-sm text-gray-500 mt-2 line-clamp-2">
                    {product.description}
                  </p>
                  <p className="text-xs text-gray-400 mt-3">
                    {product.specs}
                  </p>
                  <div className="mt-5">
                    <span className="inline-block w-full py-2.5 rounded-xl text-sm font-medium text-center bg-[linear-gradient(135deg,#0070ba,#1546a0)] text-white transition group-hover:opacity-90">
                      Select Model
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 7: SITE REQUIREMENTS */}
      <section className="py-10 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-lg font-medium text-gray-900 mb-3">Site Requirements</h2>
          <p className="text-sm text-gray-500 leading-relaxed">
            All units require a level foundation, electrical connection (200A service recommended), 
            and access to municipal water/sewage. Professional installation available through our partner network.
          </p>
        </div>
      </section>

      {/* SECTION 8: PURCHASING OPTIONS */}
      <section className="py-10 px-4 pb-20">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-lg font-medium text-gray-900 mb-6">Purchasing Options</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {purchasingOptions.map((option) => (
              <Link
                key={option.id}
                href={option.id === "lto" ? "/lease-to-own" : "/business-office"}
                className="
                  bg-white
                  rounded-xl
                  border border-[rgba(0,0,0,0.06)]
                  p-5
                  text-center
                  hover:shadow-md hover:-translate-y-[2px] transition duration-300
                  block
                "
              >
                <h3 className="text-sm font-semibold text-gray-900">
                  {option.name}
                </h3>
                <p className="text-xs text-gray-500 mt-2">
                  {option.desc}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
