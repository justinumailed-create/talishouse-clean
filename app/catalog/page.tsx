"use client";

import Link from "next/link";
import Image from "next/image";
import { getProductImage } from "@/lib/productImages";
import { useEffect, useState } from "react";

interface ProductImages {
  [key: string]: string;
}

const glasshouseProducts = [
  {
    id: "glasshouse-160",
    name: "Glasshouse 160",
    size: "glasshouse-160",
    price: "$19,995",
    sizeLabel: "8' x 20'",
    spec: "one side glass",
    href: "/glasshouse",
  },
  {
    id: "glasshouse-200",
    name: "Glasshouse 200",
    size: "glasshouse-200",
    price: "$24,995",
    sizeLabel: "10' x 20'",
    spec: "one side glass",
    href: "/glasshouse",
  },
];

const cottageProducts = [
  {
    id: "talishouse-400",
    name: "Talishouse 400",
    size: "400",
    sizeLabel: "20' x 20'",
    price: "$49,995",
    href: "/talishouse?product=420",
  },
  {
    id: "talishouse-800",
    name: "Talishouse 800",
    size: "800",
    sizeLabel: "40' x 20'",
    price: "$79,995",
    href: "/talishouse?product=420",
  },
];

const residentialProducts = [
  {
    id: "talishouse-1600",
    name: "Talishouse 1,600",
    size: "1600",
    sizeLabel: "40' x 20' (2 units)",
    price: "$109,995",
    href: "/talishouse?product=residential",
  },
  {
    id: "talishouse-2400",
    name: "Talishouse 2,400",
    size: "2400",
    sizeLabel: "60' x 20' (3 units)",
    price: "$139,995",
    href: "/talishouse?product=residential",
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

      {/* SECTION 3: GLASSHOUSE */}
      <section className="py-10 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-xl font-semibold text-gray-900">Glasshouse</h2>
            <p className="text-gray-500 text-sm mt-1">Our quintessential view-models.</p>
            <p className="text-gray-400 text-xs mt-2">Be where you want to be</p>
            <p className="text-gray-400 text-xs">Short-term rentals on a budget</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {glasshouseProducts.map((product) => (
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
                  {getImage(product.size) ? (
                    <Image
                      src={getImage(product.size)}
                      alt={product.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
                      Image coming soon
                    </div>
                  )}
                </div>
                <div className="p-6">
                  <h3 className="text-lg font-medium text-gray-900">
                    {product.name}
                  </h3>
                  <p className="text-xl font-semibold text-gray-900 mt-1">
                    {product.price}
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    Size: {product.sizeLabel}
                  </p>
                  {product.spec && (
                    <p className="text-xs text-gray-400 mt-1">
                      Spec: {product.spec}
                    </p>
                  )}
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

      {/* SECTION 4: TALISHOUSE COTTAGES / OFFICES */}
      <section className="py-10 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-xl font-semibold text-gray-900">Talishouse — Cottages / Offices</h2>
            <p className="text-gray-500 text-sm mt-1">Ideal for long and short-term rentals.</p>
            <p className="text-gray-400 text-xs mt-2">Up to 50 year life expectancy for long term rentals with normal levels of maintenance and care.</p>
            <p className="text-gray-400 text-xs mt-1">An annual rental season at $200 per night and 70% occupancy makes $51,100 per year, gross.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {cottageProducts.map((product) => (
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
                  {getImage(product.size) ? (
                    <Image
                      src={getImage(product.size)}
                      alt={product.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
                      Image coming soon
                    </div>
                  )}
                </div>
                <div className="p-6">
                  <h3 className="text-lg font-medium text-gray-900">
                    {product.name}
                  </h3>
                  <p className="text-xl font-semibold text-gray-900 mt-1">
                    {product.price}
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    Size: {product.sizeLabel}
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

      {/* SECTION 5: TALISHOUSE RESIDENTIAL */}
      <section className="py-10 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-xl font-semibold text-gray-900">Talishouse — Residential</h2>
            <p className="text-gray-500 text-sm mt-1">Ideal for residential purposes.</p>
            <p className="text-gray-400 text-xs mt-2">From $58.50 per sq.ft.</p>
            <p className="text-gray-400 text-xs">Up in a day, move in in a week*</p>
            <p className="text-gray-400 text-xs">Lease-To-Own available **</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {residentialProducts.map((product) => (
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
                  {getImage(product.size) ? (
                    <Image
                      src={getImage(product.size)}
                      alt={product.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
                      Image coming soon
                    </div>
                  )}
                </div>
                <div className="p-6">
                  <h3 className="text-lg font-medium text-gray-900">
                    {product.name}
                  </h3>
                  <p className="text-xl font-semibold text-gray-900 mt-1">
                    {product.price}
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

      {/* SECTION 6: TALISTOWNS */}
      <section className="py-10 px-4">
        <div className="max-w-4xl mx-auto">
          <Link
            href="/talistowns"
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
                src={getProductImage("talistowns")}
                alt="TalisTowns"
                fill
                className="object-cover"
              />
            </div>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 text-center">
                TalisTowns™
              </h3>
              <p className="text-sm text-gray-500 mt-2 text-center">
                A 20 unit in 10 structures neighbourhood as seen can make over one million dollars annually, gross, for over 50 years.
              </p>
              <p className="text-gray-400 text-xs mt-3 text-center">Just add ambition…!</p>
              <p className="text-gray-400 text-xs text-center">Moonlighting is lucrative…!</p>
              <div className="mt-5">
                <span className="inline-block w-full py-2.5 rounded-xl text-sm font-medium text-center bg-[linear-gradient(135deg,#0070ba,#1546a0)] text-white transition group-hover:opacity-90">
                  Learn More
                </span>
              </div>
            </div>
          </Link>
        </div>
      </section>

      {/* SECTION 7: SITE REQUIREMENTS */}
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
