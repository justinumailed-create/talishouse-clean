"use client";

import Link from "next/link";
import Image from "next/image";
import { getProductImage } from "@/lib/productImages";
import { useEffect, useState } from "react";

interface ProductImages {
  [key: string]: string;
}

const productCategories = [
  {
    id: "glasshouse",
    name: "Glasshouse™",
    subtitle: "Our quintessential view-models",
    description: "Be where you want to be. Short-term rentals on a budget.",
    image: getProductImage("glasshouse-200"),
    price: "From $19,995",
    href: "/glasshouse",
  },
  {
    id: "cottages",
    name: "Talishouse™ Cottages / Offices",
    subtitle: "Flexible modular home system",
    description: "21' x 20' steel structures assembled in one day. Two bedrooms, one bath.",
    image: getProductImage("talishouse-420"),
    price: "From $49,995",
    href: "/talishouse?product=420",
  },
  {
    id: "residential",
    name: "Talishouse™ Residential",
    subtitle: "Scalable living solutions",
    description: "Multi-unit residential developments. From single units to complete communities.",
    image: getProductImage("talishouse-residential"),
    price: "From $109,995",
    href: "/talishouse?product=residential",
  },
  {
    id: "talistowns",
    name: "TalisTowns™",
    subtitle: "Moonlighting made easy",
    description: "Community development system. High ROI potential for investors.",
    image: getProductImage("talistowns"),
    price: "From $189,900",
    href: "/talistowns",
  },
];

const purchasingOptions = [
  { id: "fast5", name: "FAST5", desc: "5% down payment program" },
  { id: "pac", name: "PAC+", desc: "Pre-approved credit financing" },
  { id: "splits", name: "SPLITS", desc: "ECommerce revenue sharing" },
  { id: "lto", name: "Lease-to-Own", desc: "Flexible ownership plans" },
];

export default function CatalogPage() {
  const [productImages, setProductImages] = useState<ProductImages>({});

  useEffect(() => {
    fetch("/api/product-images", { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => setProductImages(data || {}))
      .catch((err) => console.error("Error fetching product images:", err));
  }, []);

  const getImage = (size: string) => {
    return productImages[size] || getProductImage(size);
  };

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

      {/* SECTION 2: DESTINATION CHARGE */}
      <section className="py-10 px-4">
        <div className="max-w-4xl mx-auto bg-white rounded-2xl p-8 shadow-sm border border-[rgba(0,0,0,0.05)]">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Destination Charge</h2>
              <p className="text-gray-500 text-sm mt-1">
                When paid it reserves spots in production and shipping queues.
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-semibold text-gray-900">$1,995</p>
              <span className="inline-block mt-1 px-3 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                Required to start
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: PRODUCT CATEGORIES */}
      <section className="py-10 px-4">
        <div className="max-w-4xl mx-auto">
          {productCategories.map((category) => (
            <Link
              key={category.id}
              href={category.href}
              className="block bg-white rounded-2xl overflow-hidden border border-[rgba(0,0,0,0.06)] hover:shadow-md transition-all duration-300 hover:-translate-y-[2px] mb-8 last:mb-0"
            >
              <div className="flex flex-col md:flex-row">
                <div className="md:w-1/2 aspect-[16/10] relative bg-gray-100">
                  {getImage(category.id) ? (
                    <Image
                      src={getImage(category.id)}
                      alt={category.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
                      Image coming soon
                    </div>
                  )}
                </div>
                <div className="md:w-1/2 p-6 flex flex-col justify-center">
                  <div className="text-center md:text-left">
                    <h3 className="text-xl font-semibold text-gray-900">
                      {category.name}
                    </h3>
                    <p className="text-sm text-[#0070ba] font-medium mt-1">
                      {category.subtitle}
                    </p>
                    <p className="text-sm text-gray-500 mt-3">
                      {category.description}
                    </p>
                    <p className="text-xl font-bold text-gray-900 mt-4">
                      {category.price}
                    </p>
                  </div>
                  <div className="mt-6">
                    <span className="inline-block w-full py-2.5 rounded-xl text-sm font-medium text-center bg-[linear-gradient(135deg,#0070ba,#1546a0)] text-white transition">
                      View Models
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* SECTION 4: SITE REQUIREMENTS */}
      <section className="py-10 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-lg font-medium text-gray-900 mb-3">Site Requirements</h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            Typically site preparation includes a driveway, building site, power hook up, water and disposal systems. Optionally, off grid and office systems are available.
          </p>
          <p className="text-sm text-gray-600 leading-relaxed mt-3">
            Mobile installations may negate the need for Building Permits in many jurisdictions.
          </p>
          <p className="text-sm text-gray-600 leading-relaxed mt-3">
            Professional installation is available through our partner network.
          </p>
        </div>
      </section>

      {/* SECTION 5: PURCHASING OPTIONS */}
      <section className="py-10 px-4 pb-20">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-lg font-medium text-gray-900 mb-6">Purchasing Options</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {purchasingOptions.map((option) => (
              <Link
                key={option.id}
                href={option.id === "lto" ? "/lease-to-own" : "/business-office"}
                className="bg-white rounded-xl p-4 border border-gray-200 hover:border-[#0070ba] transition-colors"
              >
                <p className="font-semibold text-gray-900">{option.name}</p>
                <p className="text-xs text-gray-500 mt-1">{option.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 6: FOOTER */}
      <section className="py-10 px-4 pb-24">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-gray-400 text-xs mt-3 text-center">Just add ambition…!</p>
          <p className="text-gray-400 text-xs text-center">Moonlighting is lucrative…!</p>
        </div>
      </section>
    </div>
  );
}