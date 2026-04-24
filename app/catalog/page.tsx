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
      <div className="max-w-[1400px] mx-auto px-5 py-6">
        <div className="grid grid-cols-2 gap-6">
          {categories.map((cat) => (
            <Link key={cat.name} href={cat.href}>
              <div className="group bg-white border rounded-xl overflow-hidden hover:shadow-md transition-all duration-300">
                <div className="relative w-full aspect-video overflow-hidden">
                  <Image
                    src={cat.image}
                    alt={cat.name}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="p-3">
                  <p className="text-sm text-gray-600 font-medium">
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