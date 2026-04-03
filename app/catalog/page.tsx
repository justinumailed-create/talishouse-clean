"use client";
import Link from "next/link";

const categories = [
  { name: "Glasshouse™", href: "/glasshouse", image: "/images/glasshouse/hero.png" },
  { name: "Talishouse™ Recreational", href: "/talishouse-recreational", image: "/images/talishouse-400.png" },
  { name: "Talishouse™ Residential", href: "/talishouse-residential", image: "/images/talishouse/residential/hero.png" },
  { name: "TalisTowns™", href: "/talistowns", image: "/images/talistowns.jpg" },
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
      <div className="container-main">
        <section className="py-12">
          <div className="text-center">
            <h1 className="text-2xl font-semibold text-gray-900">Product Catalog</h1>
            <p className="text-gray-500 text-sm mt-2">Modular living. Built to scale.</p>
          </div>
        </section>

        <section className="pb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-[rgba(0,0,0,0.05)]">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Destination Charge</h2>
                <p className="text-gray-500 text-sm mt-1">Reserves spots in production and shipping queues.</p>
              </div>
              <div className="text-right">
                <p className="text-xl font-semibold text-gray-900">$1,995</p>
                <span className="inline-block mt-1 px-3 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">Required to start</span>
              </div>
            </div>
          </div>
        </section>

        <section className="pb-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {categories.map((cat) => (
              <Link key={cat.name} href={cat.href}>
                <div className="group bg-white border rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300">
                  <div className="relative w-full aspect-[4/3] overflow-hidden rounded-t-xl">
                    <img
                      src={cat.image}
                      alt={cat.name}
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="text-base font-semibold tracking-tight">
                      {cat.name}
                    </h3>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="pb-8">
          <div className="text-center">
            <h2 className="text-base font-medium text-gray-900 mb-3">Site Requirements</h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              Site preparation includes driveway, building site, power hook up, water and disposal systems. Mobile installations may negate the need for Building Permits.
            </p>
          </div>
        </section>

        <section className="pb-20">
          <h2 className="text-base font-medium text-gray-900 mb-4">Purchasing Options</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {purchasingOptions.map((option) => (
              <Link
                key={option.id}
                href={option.id === "lto" ? "/lease-to-own" : "/business-office"}
                className="bg-white rounded-xl p-4 border border-gray-100 hover:border-black transition-colors"
              >
                <p className="font-semibold text-gray-900">{option.name}</p>
                <p className="text-xs text-gray-500 mt-1">{option.desc}</p>
              </Link>
            ))}
          </div>
        </section>
      </div>

      <section className="py-8 pb-24">
        <div className="container-main text-center">
          <p className="text-gray-400 text-xs">Just add ambition…!</p>
          <p className="text-gray-400 text-xs mt-1">Moonlighting is lucrative…!</p>
        </div>
      </section>
    </div>
  );
}
