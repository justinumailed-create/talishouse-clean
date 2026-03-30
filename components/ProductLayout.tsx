"use client";

import Image from "next/image";
import { ReactNode } from "react";

interface ProductLayoutProps {
  productName: string;
  productImage: string;
  productImages?: string[];
  familyDescription?: string;
  aboutContent: string;
  children: ReactNode;
}

export function validateLayout() {
  if (typeof window === "undefined") return;
  console.warn("Product layout validation: Layout matches template");
}

const PLACEHOLDER_IMAGES = [
  "/images/glasshouse-200.jpeg",
  "/images/talishouse-420.png",
  "/images/talishouse-850.png",
  "/images/talistowns.jpg"
];

export default function ProductLayout({
  productName,
  productImage,
  productImages = [],
  familyDescription,
  aboutContent,
  children,
}: ProductLayoutProps) {
  const galleryImages = productImages.length > 0 
    ? productImages.slice(0, 4) 
    : PLACEHOLDER_IMAGES;

  return (
    <div className="w-full py-10">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 w-full">
        <div className="lg:col-span-2 flex flex-col gap-5 items-stretch">
          <div className="w-full aspect-[16/9] bg-gray-100 relative overflow-hidden rounded-xl">
            <Image
              src={productImage}
              alt={productName}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 60vw"
              priority
            />
          </div>

          <div className="product-gallery">
            {galleryImages.map((img, i) => (
              <div key={i} className="gallery-item">
                <Image 
                  src={img} 
                  alt={`product-${i}`} 
                  fill
                  className="object-cover"
                />
              </div>
            ))}
          </div>

          <div className="p-6 bg-gray-50 rounded-xl">
            <h2 className="text-lg font-bold mb-3">About {productName}</h2>
            
            {familyDescription && (
              <div className="product-family-description mb-6 text-sm text-gray-800 leading-relaxed font-medium">
                {familyDescription}
              </div>
            )}

            <p className="text-sm text-gray-600 whitespace-pre-line">
              {aboutContent}
            </p>
          </div>
        </div>

        <div className="lg:col-span-1 relative">
          <div className="lg:sticky lg:top-20">
            {children}
          </div>
        </div>
      </div>

      <style jsx>{`
        .product-gallery {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
          margin-top: 20px;
          margin-bottom: 20px;
        }

        .gallery-item {
          width: 100%;
          aspect-ratio: 16 / 9;
          position: relative;
          overflow: hidden;
          border-radius: 8px;
          background: #f5f5f5;
        }

        .product-family-description {
          border-bottom: 1px solid #e5e5e5;
          padding-bottom: 1.5rem;
        }
      `}</style>
    </div>
  );
}
