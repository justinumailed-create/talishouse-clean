'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { supabase } from "@/lib/supabase";
import { formatCAD } from "@/utils/currency";

interface Product {
  id: string;
  name: string;
  price?: number;
  size?: string;
  category?: string;
  image_url?: string;
}

export default function ProductList() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProducts() {
      const { data } = await supabase
        .from('products')
        .select('*')
        .eq('is_featured', true)
        .limit(3);
      if (data) {
        setProducts(data);
      }
      setLoading(false);
    }
    fetchProducts();
  }, []);

  if (loading) {
    return <div className="text-sm text-gray-500">Loading products...</div>;
  }

  if (products.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
       <div className="catalog-grid">
        {products.map((product) => (
           <Link
             key={product.id}
             href={`/catalog?product=${product.id}`}
             className="catalog-card group block bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-[0_20px_40px_rgba(0,0,0,0.06)] transition-all duration-500"
           >
            <div className="catalog-image">
              {product.image_url ? (
                <Image
                  src={product.image_url}
                  alt={product.name}
                  fill
                  style={{ objectFit: "cover" }}
                  className="transition-transform duration-700 group-hover:scale-105"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-50" />
              )}
            </div>
            <div className="p-4">
              {product.category && (
                <span className="inline-block px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full mb-2">
                  {product.category}
                </span>
              )}
              <h3 className="text-base font-semibold text-gray-900">
                {product.name}
              </h3>
              <div className="flex items-center justify-between mt-2">
                {product.price && (
                  <span className="text-lg font-semibold text-gray-900">
                    {formatCAD(product.price)}
                  </span>
                )}
                {product.size && (
                  <span className="text-sm text-gray-500">
                    {product.size} sq ft
                  </span>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
      <div className="text-center">
        <Link
          href="/catalog"
          className="inline-block px-6 py-2.5 rounded-full text-sm font-medium bg-black text-white hover:bg-gray-900 transition"
        >
          View All
        </Link>
      </div>
    </div>
  );
}
