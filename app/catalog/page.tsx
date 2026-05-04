"use client";
import Link from "next/link";
import Image from "next/image";

const categories = [
  { name: "Glasshouse™ 160 and 200", href: "/glasshouse", image: "/images/glasshouse/hero.png" },
  { name: "Talishouse™ 400 and 800", href: "/talishouse-recreational", image: "/images/talishouse-400.png" },
  { name: "Talishouse™ 1,600 plus", href: "/talishouse-residential", image: "/images/talishouse/residential/hero.jpg" },
  { name: "Talistowns™", href: "/talistowns", image: "/images/talistowns.jpg" },
];

export default function CatalogPage() {
  return (
    <div className="bg-white">
      <div className="w-full md:px-5 py-6">
        <div className="catalog-grid px-4 md:px-0">
          {categories.map((cat) => (
            <Link key={cat.name} href={cat.href} className="block">
               <div className="catalog-card rounded-xl border border-gray-200 overflow-hidden bg-white transition-all duration-300 active:scale-[0.98] md:active:scale-100 md:hover:shadow-md">
                 <div className="catalog-image">
                   <Image
                     src={cat.image}
                     alt={cat.name}
                     fill
                     style={{ objectFit: "cover" }}
                     className="transition-transform duration-500 md:group-hover:scale-105"
                   />
                 </div>
                <div className="p-3">
                  <p className="text-sm font-medium text-gray-600 line-clamp-2">
                    {cat.name}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}