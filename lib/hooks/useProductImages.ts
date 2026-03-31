"use client";

import { useEffect, useState } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

interface ProductImage {
  size: string;
  type: string;
  image_url: string;
}

export function useProductImages() {
  const [images, setImages] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isSupabaseConfigured()) {
      fetchImages();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchImages = async () => {
    const { data, error } = await supabase
      .from("product_images")
      .select("size, type, image_url");

    if (error) {
      console.error("Error fetching product images:", error);
    } else if (data) {
      const imageMap: Record<string, string> = {};
      data.forEach((img) => {
        imageMap[img.size] = img.image_url;
      });
      setImages(imageMap);
    }
    setLoading(false);
  };

  const getImage = (size?: string): string | null => {
    if (!size) return null;
    return images[size] || null;
  };

  return { images, loading, getImage, refetch: fetchImages };
}