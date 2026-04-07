"use client";
import Link from "next/link";
import { formatCAD } from "@/utils/currency";

const categories = [
  { name: "Glasshouse™", href: "/glasshouse", image: "/images/glasshouse/hero.png" },
  { name: "Talishouse™ Recreational", href: "/talishouse-recreational", image: "/images/talishouse-400.png" },
  { name: "Talishouse™ Residential", href: "/talishouse-residential", image: "/images/talishouse/residential/hero.png" },
  { name: "TalisTowns™", href: "/talistowns", image: "/images/talistowns.jpg" },
];

export default function CatalogPage() {
  return (
    <div className="bg-[#f5f5f7] min-h-screen">
      <div className="w-full px-6 lg:px-[75px]">
        <section className="py-12">
          <div className="text-center">
            <h1 className="text-2xl font-semibold text-gray-900">Catalog</h1>
          </div>
        </section>

        <section className="pb-12">
          <div className="bg-white rounded-[2.5rem] p-8 md:p-14 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 relative overflow-hidden group hover:shadow-[0_30px_60px_rgba(0,0,0,0.06)] transition-all duration-700">
            <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-gray-50/40 to-transparent pointer-events-none" />
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-gray-50/50 rounded-full blur-3xl pointer-events-none" />
            
            <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-10 md:gap-0">
              <div className="md:flex-[0_0_80%] min-w-0 md:pr-16 space-y-5 text-left">
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-900 flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight break-words">Destination Charge</h2>
                  </div>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-600 text-[10px] font-bold uppercase tracking-widest rounded-full border border-blue-100/50">
                    <span className="w-1 h-1 rounded-full bg-blue-600 animate-pulse" />
                    Mandatory
                  </span>
                </div>
                <p className="text-gray-500 text-[16px] md:text-[17px] leading-[1.7] font-normal break-words max-w-5xl">
                  Standardised shipping charge &amp; reserves a spot in production and shipping queues.
                </p>
                <p className="text-gray-400 text-sm italic">
                  A mandatory, non-negotiable fee added to the price of each sea-can container to cover the cost of transporting it from the manufacturer&apos;s assembly plant to the port of entry in Canada. This amount assumes one unit. Taxes or tariffs extra.
                </p>
              </div>

              <div className="md:flex-[0_0_20%] min-w-0 flex-shrink-0">
                <div className="flex flex-col items-start md:items-end justify-center w-full border-t md:border-t-0 md:border-l border-gray-100 pt-8 md:pt-0 md:pl-12">
                  <div className="space-y-1 text-left md:text-right w-full">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em] whitespace-nowrap">CAD</p>
                    <p className="text-4xl md:text-5xl font-black text-gray-900 tracking-tighter whitespace-nowrap">
                      8,995
                    </p>
                    <div className="pt-4">
                      <span className="inline-flex items-center px-5 py-2 bg-gray-900 text-white text-[11px] font-bold uppercase tracking-widest rounded-full shadow-xl shadow-gray-200 whitespace-nowrap hover:scale-105 transition-transform cursor-default">
                        Required to start
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="pb-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {categories.map((cat) => (
              <Link key={cat.name} href={cat.href}>
                <div className="group bg-white border rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300">
                  <div className="relative w-full aspect-video overflow-hidden rounded-t-xl">
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

        <section className="py-8 pb-24">
          <div className="w-full text-center">
            <p className="text-gray-400 text-xs">Just add ambition…!</p>
            <p className="text-gray-400 text-xs mt-1">Moonlighting is lucrative…!</p>
          </div>
        </section>
      </div>
    </div>
  );
}
