"use client";

import Image from "next/image";
import { ReactNode, useEffect, useState } from "react";
import { getProductImage } from "@/lib/productImages";

interface ProductLayoutProps {
  productName: string;
  productImage: string;
  productSize?: string;
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
    <div className="max-w-[1400px] mx-auto md:px-6 py-4 md:py-8">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-10 lg:gap-12 items-start px-4 md:px-0">
        <div className="col-span-1 md:col-span-7 space-y-4 md:space-y-8">
           <div className="catalog-image rounded-xl border border-gray-100 shadow-sm">
             {displayImage ? (
               <Image
                 src={displayImage}
                 alt={productName}
                 fill
                 style={{ objectFit: "cover" }}
                 sizes="(max-width: 1024px) 100vw, 60vw"
                 priority
               />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-white">
                <span className="text-sm text-gray-400">Image coming soon</span>
              </div>
            )}
          </div>

          <div className="p-4 md:p-6 bg-white border border-gray-100 rounded-xl shadow-sm">
            <h2 className="text-lg font-semibold mb-4 text-gray-900">About {productName}</h2>
            
            <p className="text-sm text-gray-600 whitespace-pre-line leading-relaxed">
              {aboutContent}
            </p>
          </div>
        </div>

        <div className="col-span-1 md:col-span-5 flex flex-col gap-3 w-full">
          <div className="w-full bg-white border border-gray-100 rounded-xl p-4 md:p-6 lg:p-8 shadow-sm">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
