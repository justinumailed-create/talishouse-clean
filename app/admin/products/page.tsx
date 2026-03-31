"use client";

import { useState, useEffect } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import Image from "next/image";

interface ProductImage {
  id: string;
  size: string;
  type: string;
  image_url: string;
  created_at: string;
}

const DEFAULT_PRODUCTS = [
  { size: "160", type: "glasshouse", name: "Glasshouse 160" },
  { size: "200", type: "glasshouse", name: "Glasshouse 200" },
  { size: "400", type: "talishouse", name: "Talishouse 400" },
  { size: "800", type: "talishouse", name: "Talishouse 800" },
  { size: "1600", type: "talishouse-residential", name: "Talishouse 1600" },
  { size: "2400", type: "talishouse-residential", name: "Talishouse 2400" },
  { size: "glasshouse", type: "glasshouse", name: "Glasshouse Family" },
  { size: "talishouse-420", type: "talishouse", name: "Talishouse 420" },
  { size: "talishouse-residential", type: "talishouse-residential", name: "Talishouse Residential" },
  { size: "talistowns", type: "talistowns", name: "TalisTowns" },
];

export default function ProductImagesPage() {
  const [productImages, setProductImages] = useState<ProductImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (isSupabaseConfigured()) {
      fetchProductImages();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchProductImages = async () => {
    const { data, error } = await supabase
      .from("product_images")
      .select("*")
      .order("size", { ascending: true });

    if (error) {
      console.error("Error fetching product images:", error);
    } else {
      setProductImages(data || []);
    }
    setLoading(false);
  };

  const handleUpload = async (product: { size: string; type: string }, file: File) => {
    if (!file) return;
    
    setUploading(product.size);
    setError(null);
    setSuccess(null);

    try {
      const fileExt = file.name.split(".").pop();
      const filePath = `products/${product.size}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("product-images")
        .getPublicUrl(filePath);

      const existingImage = productImages.find(
        (img) => img.size === product.size && img.type === product.type
      );

      if (existingImage) {
        const { error: updateError } = await supabase
          .from("product_images")
          .update({ image_url: urlData.publicUrl, updated_at: new Date().toISOString() })
          .eq("id", existingImage.id);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from("product_images")
          .insert([{
            size: product.size,
            type: product.type,
            image_url: urlData.publicUrl,
          }]);

        if (insertError) throw insertError;
      }

      setSuccess(`Image for ${product.size} updated successfully!`);
      fetchProductImages();
    } catch (err: any) {
        if (err) console.error("Upload error:", err);
        setError(err?.message || "Failed to upload image");
    } finally {
      setUploading(null);
    }
  };

  const handleDelete = async (imageId: string, size: string) => {
    if (!confirm(`Remove image for ${size}?`)) return;

    const { error } = await supabase
      .from("product_images")
      .delete()
      .eq("id", imageId);

    if (error) {
      setError(error.message);
    } else {
      setSuccess(`Image for ${size} removed`);
      fetchProductImages();
    }
  };

  const getImageUrl = (size: string, type: string) => {
    const img = productImages.find((i) => i.size === size && i.type === type);
    return img?.image_url || null;
  };

  if (loading) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (!isSupabaseConfigured()) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <p className="text-yellow-800">
            Supabase is not configured. Product images cannot be managed.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Product Images</h1>
        <p className="text-gray-500 mt-1">
          Upload and manage product images for the storefront
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
          <p className="text-green-800">{success}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {DEFAULT_PRODUCTS.map((product) => {
          const imageUrl = getImageUrl(product.size, product.type);
          const isGlasshouse = product.type === "glasshouse" || product.size === "glasshouse";

          return (
            <div
              key={product.size}
              className="bg-white border border-gray-200 rounded-xl overflow-hidden"
            >
              <div className="aspect-video bg-gray-100 relative">
                {imageUrl ? (
                  <Image
                    src={imageUrl}
                    alt={product.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-gray-400 text-sm">No image</span>
                  </div>
                )}
              </div>

              <div className="p-4">
                <h3 className="font-medium text-gray-900">{product.name}</h3>
                <p className="text-xs text-gray-500 mt-1">
                  Size: {product.size} • Type: {product.type}
                </p>

                <div className="mt-4 flex gap-2">
                  <label className="flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleUpload(product, file);
                      }}
                      disabled={uploading === product.size}
                    />
                    <span
                      className={`block w-full text-center py-2 text-sm font-medium rounded-lg cursor-pointer ${
                        uploading === product.size
                          ? "bg-gray-100 text-gray-400"
                          : "bg-[#0070ba] text-white hover:bg-[#005a8c]"
                      }`}
                    >
                      {uploading === product.size
                        ? "Uploading..."
                        : imageUrl
                        ? "Replace"
                        : "Upload"}
                    </span>
                  </label>

                  {imageUrl && (
                    <button
                      onClick={() => {
                        const img = productImages.find(
                          (i) => i.size === product.size && i.type === product.type
                        );
                        if (img) handleDelete(img.id, product.size);
                      }}
                      className="px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      Remove
                    </button>
                  )}
                </div>

                {isGlasshouse && imageUrl && (
                  <p className="text-xs text-blue-600 mt-2">
                    Glasshouse: Single image mode
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {productImages.length > 0 && (
        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">
            {productImages.length} product image(s) configured in database
          </p>
        </div>
      )}
    </div>
  );
}