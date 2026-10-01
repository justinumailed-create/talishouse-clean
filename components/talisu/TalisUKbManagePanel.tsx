"use client";

import Link from "next/link";
import { useEffect, useId, useState } from "react";
import {
  TALISU_KB_BUCKET_LABELS,
  TALISU_KB_PATH,
  defaultTalisUKbContent,
  readTalisUKbContentFromStorage,
  writeTalisUKbContentToStorage,
  type TalisUKbBucket,
  type TalisUKbContentState,
  type TalisUKbItem,
} from "@/lib/talisu/kb-content";
import { TALISU_BTN_PRIMARY, TALISU_BTN_SECONDARY, TALISU_CARD } from "@/lib/talisu/ui";

const BUCKETS: TalisUKbBucket[] = ["audios", "videos", "learning"];

function newItem(bucket: TalisUKbBucket): TalisUKbItem {
  const kind =
    bucket === "audios" ? "Audio" : bucket === "videos" ? "Video" : "Guide";
  return {
    id: `${bucket}-${Date.now()}`,
    title: "",
    description: "",
    href: bucket === "audios" ? "/talisu/au" : bucket === "videos" ? "/talisu/video" : "/talisu/kb",
    kind,
  };
}

/**
 * Manage Audios / Videos / Learning Material for the Knowledge Base.
 * Used from /talisu/kb/manage and linked from rm22's claimed Mapsite™ dashboard.
 */
export default function TalisUKbManagePanel() {
  const formId = useId();
  const [bucket, setBucket] = useState<TalisUKbBucket>("audios");
  const [content, setContent] = useState<TalisUKbContentState>(defaultTalisUKbContent);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  useEffect(() => {
    setContent(readTalisUKbContentFromStorage());
  }, []);

  const items = content[bucket];

  function updateItem(index: number, patch: Partial<TalisUKbItem>) {
    setContent((prev) => {
      const nextBucket = prev[bucket].map((item, i) =>
        i === index ? { ...item, ...patch } : item,
      );
      return { ...prev, [bucket]: nextBucket };
    });
    setSavedAt(null);
  }

  function addItem() {
    setContent((prev) => ({
      ...prev,
      [bucket]: [...prev[bucket], newItem(bucket)],
    }));
    setSavedAt(null);
  }

  function removeItem(index: number) {
    setContent((prev) => ({
      ...prev,
      [bucket]: prev[bucket].filter((_, i) => i !== index),
    }));
    setSavedAt(null);
  }

  function handleSave() {
    writeTalisUKbContentToStorage(content);
    setSavedAt(new Date().toLocaleTimeString());
  }

  function handleReset() {
    const defaults = defaultTalisUKbContent();
    setContent(defaults);
    writeTalisUKbContentToStorage(defaults);
    setSavedAt(new Date().toLocaleTimeString());
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div
          role="tablist"
          aria-label="Manage Knowledge Base buckets"
          className="inline-flex flex-wrap gap-1 rounded-xl bg-neutral-200/70 p-1"
        >
          {BUCKETS.map((key) => {
            const selected = bucket === key;
            return (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => setBucket(key)}
                className={`rounded-lg px-3.5 py-2 text-sm font-medium transition sm:px-4 ${
                  selected
                    ? "bg-white text-neutral-950 shadow-sm"
                    : "text-neutral-600 hover:text-neutral-900"
                }`}
              >
                {TALISU_KB_BUCKET_LABELS[key]}
              </button>
            );
          })}
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={TALISU_KB_PATH} className={TALISU_BTN_SECONDARY}>
            View dashboard
          </Link>
          <button type="button" onClick={handleReset} className={TALISU_BTN_SECONDARY}>
            Reset defaults
          </button>
          <button type="button" onClick={handleSave} className={TALISU_BTN_PRIMARY}>
            Save changes
          </button>
        </div>
      </div>

      {savedAt ? (
        <p className="text-sm text-emerald-700" role="status">
          Saved at {savedAt}. Visitors see updates on the Knowledge Base dashboard.
        </p>
      ) : null}

      <div className="space-y-4">
        {items.map((item, index) => (
          <div key={item.id} className={`${TALISU_CARD} space-y-3`}>
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-neutral-900">
                {TALISU_KB_BUCKET_LABELS[bucket]} #{index + 1}
              </p>
              <button
                type="button"
                onClick={() => removeItem(index)}
                className="text-sm font-medium text-red-600 hover:underline"
              >
                Remove
              </button>
            </div>
            <label className="block text-sm text-neutral-700">
              Title
              <input
                id={`${formId}-${item.id}-title`}
                value={item.title}
                onChange={(e) => updateItem(index, { title: e.target.value })}
                className="mt-1 h-10 w-full rounded-xl border border-neutral-200 px-3"
              />
            </label>
            <label className="block text-sm text-neutral-700">
              Description
              <textarea
                id={`${formId}-${item.id}-desc`}
                value={item.description}
                onChange={(e) => updateItem(index, { description: e.target.value })}
                rows={2}
                className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2"
              />
            </label>
            <label className="block text-sm text-neutral-700">
              Link (href)
              <input
                id={`${formId}-${item.id}-href`}
                value={item.href}
                onChange={(e) => updateItem(index, { href: e.target.value })}
                className="mt-1 h-10 w-full rounded-xl border border-neutral-200 px-3"
              />
            </label>
            <label className="block text-sm text-neutral-700">
              Kind / badge
              <input
                id={`${formId}-${item.id}-kind`}
                value={item.kind || ""}
                onChange={(e) => updateItem(index, { kind: e.target.value })}
                className="mt-1 h-10 w-full rounded-xl border border-neutral-200 px-3"
              />
            </label>
          </div>
        ))}
      </div>

      <button type="button" onClick={addItem} className={TALISU_BTN_SECONDARY}>
        Add {TALISU_KB_BUCKET_LABELS[bucket]} item
      </button>
    </div>
  );
}
