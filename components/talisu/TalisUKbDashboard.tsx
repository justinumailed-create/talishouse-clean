"use client";

import Link from "next/link";
import { useEffect, useId, useState } from "react";
import {
  TALISU_KB_BUCKET_LABELS,
  TALISU_KB_MANAGE_PATH,
  defaultTalisUKbContent,
  readTalisUKbContentFromStorage,
  type TalisUKbBucket,
  type TalisUKbContentState,
  type TalisUKbItem,
} from "@/lib/talisu/kb-content";
import { TALISU_CARD, TALISU_BTN_SECONDARY } from "@/lib/talisu/ui";

const TABS: TalisUKbBucket[] = ["audios", "videos", "learning"];

function ItemCard({ item }: { item: TalisUKbItem }) {
  return (
    <Link
      href={item.href}
      className={`${TALISU_CARD} flex flex-col gap-2 transition hover:ring-[#046BD9]/30 hover:shadow-[0_12px_28px_rgba(4,107,217,0.12)]`}
    >
      {item.kind ? (
        <span className="inline-flex w-fit rounded-full bg-[#046BD9]/10 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-[#046BD9]">
          {item.kind}
        </span>
      ) : null}
      <h3 className="text-base font-semibold text-neutral-950">{item.title}</h3>
      <p className="text-sm leading-relaxed text-neutral-600">{item.description}</p>
      <span className="mt-auto pt-2 text-sm font-medium text-[#046BD9]">Open →</span>
    </Link>
  );
}

function ItemGrid({ items, emptyHint }: { items: TalisUKbItem[]; emptyHint: string }) {
  if (!items.length) {
    return (
      <div className={`${TALISU_CARD} px-6 py-12 text-center text-sm text-neutral-600`}>
        {emptyHint}
      </div>
    );
  }
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <ItemCard key={item.id} item={item} />
      ))}
    </div>
  );
}

/**
 * Post-unlock Knowledge Base dashboard: Audios / Videos / Learning Material.
 */
export default function TalisUKbDashboard({
  showManageLink = false,
}: {
  /** When true, show a link to the manage UI (rm22 / editors). */
  showManageLink?: boolean;
}) {
  const tabsId = useId();
  const [tab, setTab] = useState<TalisUKbBucket>("audios");
  const [content, setContent] = useState<TalisUKbContentState>(defaultTalisUKbContent);

  useEffect(() => {
    setContent(readTalisUKbContentFromStorage());
    function onStorage(event: StorageEvent) {
      if (event.key === null || event.key === "talisu_kb_content_v1") {
        setContent(readTalisUKbContentFromStorage());
      }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const items =
    tab === "audios"
      ? content.audios
      : tab === "videos"
        ? content.videos
        : content.learning;

  const emptyHint =
    tab === "learning"
      ? "Learning Material placeholders will grow here as guides are published."
      : "No items in this section yet.";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div
          role="tablist"
          aria-label="Knowledge Base sections"
          className="inline-flex flex-wrap gap-1 rounded-xl bg-neutral-200/70 p-1"
        >
          {TABS.map((key) => {
            const selected = tab === key;
            return (
              <button
                key={key}
                type="button"
                role="tab"
                id={`${tabsId}-${key}`}
                aria-selected={selected}
                aria-controls={`${tabsId}-panel`}
                onClick={() => setTab(key)}
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
        {showManageLink ? (
          <Link href={TALISU_KB_MANAGE_PATH} className={TALISU_BTN_SECONDARY}>
            Update content
          </Link>
        ) : null}
      </div>

      <div
        role="tabpanel"
        id={`${tabsId}-panel`}
        aria-labelledby={`${tabsId}-${tab}`}
      >
        <ItemGrid items={items} emptyHint={emptyHint} />
      </div>
    </div>
  );
}
