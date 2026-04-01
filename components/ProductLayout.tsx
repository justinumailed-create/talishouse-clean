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
  const validSizes = ['160', '200', '400', '800', '1600', '2400', 'glasshouse-200', 'talishouse-420', 'talishouse-residential', 'talistowns'];
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
  const showImage = hasValidImage || dbImageUrl;

  return (
    <div className="w-full py-10">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 w-full">
        <div className="lg:col-span-2 flex flex-col gap-5 items-stretch">
          <div className="w-full aspect-[16/9] bg-gray-100 relative overflow-hidden rounded-xl">
            {showImage ? (
              <Image
                src={displayImage}
                alt={productName}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 60vw"
                priority
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-100">
                <span className="text-sm text-gray-500">Image coming soon</span>
              </div>
            )}
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
        .product-family-description {
          border-bottom: 1px solid #e5e5e5;
          padding-bottom: 1.5rem;
        }
      `}</style>
    </div>
  );
}
