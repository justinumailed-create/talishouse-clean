"use client";

import { useState } from "react";
import Image from "next/image";
import { GripVertical, Trash2, Upload } from "lucide-react";
import { updateMapSiteGallery, uploadMapSiteAsset } from "@/lib/mapsite-admin-service";

interface MapSiteGalleryEditorProps {
  fastCode: string;
  images: string[];
  onChange: (images: string[]) => void;
}

export default function MapSiteGalleryEditor({
  fastCode,
  images,
  onChange,
}: MapSiteGalleryEditorProps) {
  const [uploading, setUploading] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  async function handleUpload(file: File) {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("fastCode", fastCode);
      formData.append("fieldName", "gallery");
      formData.append("file", file);

      const result = await uploadMapSiteAsset(formData);
      if (result.success && result.url) {
        const next = [...images, result.url];
        onChange(next);
        await updateMapSiteGallery(fastCode, next);
      }
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(index: number) {
    const next = images.filter((_, i) => i !== index);
    onChange(next);
    await updateMapSiteGallery(fastCode, next);
  }

  async function handleReorder(fromIndex: number, toIndex: number) {
    if (fromIndex === toIndex) return;
    const next = [...images];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    onChange(next);
    await updateMapSiteGallery(fastCode, next);
  }

  return (
    <div className="space-y-4">
      <label className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-dashed border-neutral-300 text-sm text-neutral-600 hover:bg-neutral-50 cursor-pointer">
        <Upload className="w-4 h-4" />
        {uploading ? "Uploading..." : "Upload gallery image"}
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          disabled={uploading}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleUpload(file);
            e.target.value = "";
          }}
        />
      </label>

      <div className="space-y-3">
        {images.map((src, index) => (
          <div
            key={`${src}-${index}`}
            draggable
            onDragStart={() => setDragIndex(index)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => {
              if (dragIndex != null) {
                void handleReorder(dragIndex, index);
                setDragIndex(null);
              }
            }}
            className="flex items-center gap-3 p-3 rounded-xl border border-neutral-200 bg-white"
          >
            <GripVertical className="w-4 h-4 text-neutral-400 flex-shrink-0 cursor-grab" />
            <div className="relative w-20 h-14 rounded-lg overflow-hidden bg-neutral-100 flex-shrink-0">
              <Image src={src} alt="" fill className="object-cover" unoptimized />
            </div>
            <p className="flex-1 text-xs text-neutral-500 truncate">{src}</p>
            <button
              type="button"
              onClick={() => void handleDelete(index)}
              className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
              aria-label="Delete image"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
