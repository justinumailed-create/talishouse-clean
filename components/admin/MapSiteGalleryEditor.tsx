"use client";

import { useState } from "react";
import Image from "next/image";
import {
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  GripVertical,
  Trash2,
  Upload,
} from "lucide-react";
import { updateMapSiteGallery, uploadMapSiteAsset } from "@/lib/mapsite-admin-service";
import {
  normalizeGalleryItemsForSave,
  type MapSiteGalleryItem,
} from "@/lib/mapsite-gallery";

interface MapSiteGalleryEditorProps {
  fastCode: string;
  items: MapSiteGalleryItem[];
  onChange: (items: MapSiteGalleryItem[]) => void;
}

export default function MapSiteGalleryEditor({
  fastCode,
  items,
  onChange,
}: MapSiteGalleryEditorProps) {
  const [uploading, setUploading] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [savingIndex, setSavingIndex] = useState<number | null>(null);

  async function persist(next: MapSiteGalleryItem[]) {
    const normalized = normalizeGalleryItemsForSave(next);
    onChange(normalized);
    await updateMapSiteGallery(fastCode, normalized);
  }

  async function handleUpload(file: File) {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("fastCode", fastCode);
      formData.append("fieldName", "gallery");
      formData.append("file", file);

      const result = await uploadMapSiteAsset(formData);
      if (result.success && result.url) {
        const next = normalizeGalleryItemsForSave([
          ...items,
          {
            url: result.url,
            description: "",
            sortOrder: items.length,
            visible: true,
          },
        ]);
        await persist(next);
      }
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(index: number) {
    const next = items.filter((_, i) => i !== index);
    await persist(next);
  }

  async function handleReorder(fromIndex: number, toIndex: number) {
    if (fromIndex === toIndex) return;
    const next = [...items];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    await persist(next);
  }

  async function updateItem(
    index: number,
    patch: Partial<MapSiteGalleryItem>
  ) {
    setSavingIndex(index);
    try {
      const next = items.map((item, i) =>
        i === index ? { ...item, ...patch } : item
      );
      await persist(next);
    } finally {
      setSavingIndex(null);
    }
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
        {items.map((item, index) => (
          <div
            key={`${item.url}-${index}`}
            draggable
            onDragStart={() => setDragIndex(index)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => {
              if (dragIndex != null) {
                void handleReorder(dragIndex, index);
                setDragIndex(null);
              }
            }}
            className={`rounded-xl border bg-white p-3 ${
              item.visible ? "border-neutral-200" : "border-neutral-200/70 opacity-70"
            }`}
          >
            <div className="flex items-start gap-3">
              <GripVertical className="mt-1 w-4 h-4 text-neutral-400 flex-shrink-0 cursor-grab" />
              <div className="relative w-20 h-14 rounded-lg overflow-hidden bg-neutral-100 flex-shrink-0">
                <Image
                  src={item.url}
                  alt=""
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>

              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-medium text-neutral-500">
                    Image {index + 1}
                  </p>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => void handleReorder(index, index - 1)}
                      disabled={index === 0}
                      className="p-1.5 text-neutral-500 hover:bg-neutral-100 rounded-md disabled:opacity-30"
                      aria-label="Move image up"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleReorder(index, index + 1)}
                      disabled={index === items.length - 1}
                      className="p-1.5 text-neutral-500 hover:bg-neutral-100 rounded-md disabled:opacity-30"
                      aria-label="Move image down"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        void updateItem(index, { visible: !item.visible })
                      }
                      className="p-1.5 text-neutral-500 hover:bg-neutral-100 rounded-md"
                      aria-label={item.visible ? "Hide image" : "Show image"}
                    >
                      {item.visible ? (
                        <Eye className="w-4 h-4" />
                      ) : (
                        <EyeOff className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDelete(index)}
                      className="p-1.5 text-red-500 hover:bg-red-50 rounded-md"
                      aria-label="Delete image"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <textarea
                  value={item.description}
                  onChange={(e) => {
                    const description = e.target.value;
                    onChange(
                      items.map((entry, i) =>
                        i === index ? { ...entry, description } : entry
                      )
                    );
                  }}
                  onBlur={(e) =>
                    void updateItem(index, { description: e.target.value })
                  }
                  placeholder="Image description"
                  rows={2}
                  className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900/20 resize-y"
                />
                {savingIndex === index ? (
                  <p className="text-[11px] text-neutral-400">Saving...</p>
                ) : null}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
