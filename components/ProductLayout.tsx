"use client";

import Image from "next/image";
import { ReactNode, useEffect, useState } from "react";
import { getProductImage } from "@/lib/productImages";

interface ProductLayoutProps {
  productName: string;
  productImage: string;
  productSize?: string;
  familyDescription?: string;
  aboutContent: string;
  children: ReactNode;
}

export function isValidProductImage(product: { size?: string } | null): boolean {
  if (!product) return false;
  if (!product.size) return false;
  const validSizes = ['160', '200', '400', '800', '1600', '2400', 'glasshouse-200', 'talishouse-400', 'talishouse-residential', 'talistowns'];
  return validSizes.includes(product.size);
}

export default function ProductLayout({
  productName,
  productImage,
  productSize,
  familyDescription,
  aboutContent,
  children,
}: ProductLayoutProps) {
  const [dbImageUrl, setDbImageUrl] = useState<string | null>(null);
  const validProduct = productSize ? { size: productSize } : null;
  const hasValidImage = isValidProductImage(validProduct);

  useEffect(() => {
    if (productSize) {
      fetch(`/api/product-images`, { cache: 'no-store' })
        .then((res) => res.json())
        .then((images) => {
          if (images[productSize]) {
            setDbImageUrl(images[productSize]);
          }
        })
        .catch((err) => console.error("Error fetching product image:", err));
    }
  }, [productSize]);

  const getDisplayImage = () => {
    if (dbImageUrl) return dbImageUrl;
    if (hasValidImage) return getProductImage(productSize);
    return productImage;
  };

  const displayImage = getDisplayImage();
  const showImage = hasValidImage || dbImageUrl || productImage;

  return (
    <div className="w-full px-6 lg:px-12 py-8">
      <div className="grid grid-cols-12 gap-8">
        {/* Left - Image - 8 cols */}
        <div className="col-span-12 lg:col-span-8">
          <div className="w-full aspect-[16/9] bg-gray-50 relative overflow-hidden rounded-xl border border-gray-100">
            {displayImage ? (
              <Image
                src={displayImage}
                alt={productName}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 66vw"
                priority
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-50">
                <span className="text-sm text-gray-400">Image coming soon</span>
              </div>
            )}
          </div>

          <div className="p-6 bg-white border border-gray-100 rounded-xl shadow-sm">
            <h2 className="text-lg font-semibold mb-4 text-gray-900">About {productName}</h2>
            
            {familyDescription && (
              <div className="product-family-description mb-5 text-sm text-gray-600 leading-relaxed">
                {familyDescription}
              </div>
            )}

            <p className="text-sm text-gray-600 whitespace-pre-line leading-relaxed">
              {aboutContent}
            </p>
          </div>
        </div>

        {/* Right - Configurator - 4 cols */}
        <div className="col-span-12 lg:col-span-4">
          <div className="sticky top-24 h-fit bg-white border rounded-xl p-6 shadow-sm">
            {children}
          </div>
        </div>
      </div>

      <style jsx>{`
        .product-family-description {
          border-bottom: 1px solid #f0f0f0;
          padding-bottom: 1.25rem;
        }
      `}</style>
    </div>
  );
}
