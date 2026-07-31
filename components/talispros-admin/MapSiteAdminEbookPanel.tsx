"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowDown,
  ArrowUp,
  Copy,
  ExternalLink,
  Link2,
  Loader2,
} from "lucide-react";
import {
  attachMapSiteEbookAction,
  createOrUpdateMapSiteEbookAction,
  loadAdminEbookWorkbenchAction,
  publishMapSiteEbookAction,
  reorderMapSiteEbookPagesAction,
  replaceMapSiteEbookPageImageAction,
  updateMapSiteEbookPageAction,
} from "@/app/talisbooks/library/actions";
import { ROUTES } from "@/lib/routes";
import type { AdminEbookPageRow } from "@/lib/talisbooks/admin-ebook-pages";
import type { MapSiteEbookDraft } from "@/lib/talisbooks/mapsite-ebook-service";

interface MapSiteAdminEbookPanelProps {
  fastCode: string;
  initialEbook: MapSiteEbookDraft | null;
  initialPages?: AdminEbookPageRow[];
  adminWritesEnabled?: boolean;
}

type WorkbenchEbook = {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  coverImageUrl: string | null;
  publishStatus: string;
  pageCount: number;
  viewerPath: string;
  bookUrl: string;
  attachedTebUrl: string | null;
};

const inputClass =
  "w-full h-11 px-4 bg-white border border-neutral-200 text-sm text-neutral-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900/20";
const textareaClass =
  "w-full px-4 py-3 bg-white border border-neutral-200 text-sm text-neutral-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900/20 resize-y";

export default function MapSiteAdminEbookPanel({
  fastCode,
  initialEbook,
  initialPages = [],
  adminWritesEnabled = true,
}: MapSiteAdminEbookPanelProps) {
  const router = useRouter();
  const [title, setTitle] = useState(initialEbook?.title || "");
  const [subtitle, setSubtitle] = useState(initialEbook?.subtitle || "");
  const [description, setDescription] = useState(initialEbook?.description || "");
  const [coverImageUrl, setCoverImageUrl] = useState(
    initialEbook?.coverImageUrl || "",
  );
  const [ebook, setEbook] = useState<WorkbenchEbook | null>(
    initialEbook
      ? {
          id: initialEbook.id,
          slug: initialEbook.slug,
          title: initialEbook.title,
          subtitle: initialEbook.subtitle,
          description: initialEbook.description,
          coverImageUrl: initialEbook.coverImageUrl,
          publishStatus: "published",
          pageCount: initialPages.length || 0,
          viewerPath: `${ROUTES.TALISBOOKS_VIEWER}/${initialEbook.slug}`,
          bookUrl: `${ROUTES.TALISBOOKS_VIEWER}/${initialEbook.slug}`,
          attachedTebUrl: null,
        }
      : null,
  );
  const [pages, setPages] = useState<AdminEbookPageRow[]>(initialPages);
  const [saving, setSaving] = useState(false);
  const [busyPageId, setBusyPageId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const shelfHref = `${ROUTES.TALISBOOKS_LIBRARY}?fastCode=${encodeURIComponent(fastCode)}`;
  const viewerHref = ebook?.viewerPath || null;
  const bookUrl = ebook?.bookUrl || viewerHref || "";

  const movablePages = useMemo(
    () =>
      pages.filter((page) => {
        if (page.isPermanent) return false;
        const last = pages[pages.length - 1];
        if (
          last &&
          page.id === last.id &&
          (page.layout === "cover" || page.slug === "back-cover")
        ) {
          return false;
        }
        return true;
      }),
    [pages],
  );

  async function refreshWorkbench() {
    const result = await loadAdminEbookWorkbenchAction(fastCode);
    if (!result.success) return;
    if (result.ebook) {
      setEbook(result.ebook);
      setTitle(result.ebook.title);
      setSubtitle(result.ebook.subtitle);
      setDescription(result.ebook.description);
      setCoverImageUrl(result.ebook.coverImageUrl || "");
    }
    setPages(result.pages || []);
  }

  useEffect(() => {
    if (initialEbook?.id) {
      void refreshWorkbench();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fastCode, initialEbook?.id]);

  async function handleSave(event: React.FormEvent) {
    event.preventDefault();
    if (!adminWritesEnabled) return;

    setSaving(true);
    setMessage("");
    setError("");

    const result = await createOrUpdateMapSiteEbookAction({
      fastCode,
      title,
      subtitle,
      description,
      coverImageUrl: coverImageUrl.trim() || null,
      asAdmin: true,
    });

    setSaving(false);

    if (!result.success) {
      setError(result.error || "Could not save ebook.");
      return;
    }

    setMessage(ebook ? "Ebook updated." : "Ebook created for this FAST Code.");
    await refreshWorkbench();
    router.refresh();
  }

  async function handleCopyUrl() {
    if (!bookUrl) return;
    try {
      await navigator.clipboard.writeText(bookUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      setError("Could not copy URL. Select and copy it manually.");
    }
  }

  async function handleAttach() {
    if (!ebook || !adminWritesEnabled) return;
    setSaving(true);
    setError("");
    setMessage("");
    const result = await attachMapSiteEbookAction({
      fastCode,
      bookId: ebook.id,
    });
    setSaving(false);
    if (!result.success) {
      setError(result.error || "Could not attach ebook to MapSite.");
      return;
    }
    setMessage("Book URL attached to MapSite™ (teb_url).");
    await refreshWorkbench();
    router.refresh();
  }

  async function handlePublish(status: "draft" | "published") {
    if (!ebook || !adminWritesEnabled) return;
    setSaving(true);
    setError("");
    setMessage("");
    const result = await publishMapSiteEbookAction({
      fastCode,
      bookId: ebook.id,
      status,
    });
    setSaving(false);
    if (!result.success) {
      setError(result.error || "Could not update publish status.");
      return;
    }
    setMessage(status === "published" ? "Ebook published." : "Ebook set to draft.");
    await refreshWorkbench();
    router.refresh();
  }

  async function handleMove(pageId: string, direction: -1 | 1) {
    if (!ebook || !adminWritesEnabled) return;
    const ids = movablePages.map((page) => page.id);
    const index = ids.indexOf(pageId);
    const swapWith = index + direction;
    if (index < 0 || swapWith < 0 || swapWith >= ids.length) return;

    const next = [...ids];
    const temp = next[index]!;
    next[index] = next[swapWith]!;
    next[swapWith] = temp;

    setBusyPageId(pageId);
    setError("");
    const result = await reorderMapSiteEbookPagesAction({
      fastCode,
      bookId: ebook.id,
      orderedPageIds: next,
    });
    setBusyPageId(null);
    if (!result.success) {
      setError(result.error || "Could not reorder pages.");
      return;
    }
    setMessage("Pages reordered.");
    await refreshWorkbench();
  }

  async function handlePageSave(page: AdminEbookPageRow, titleValue: string, bodyValue: string) {
    if (!ebook || !adminWritesEnabled || page.isPermanent) return;
    setBusyPageId(page.id);
    setError("");
    const result = await updateMapSiteEbookPageAction({
      fastCode,
      bookId: ebook.id,
      pageId: page.id,
      title: titleValue,
      body: bodyValue,
    });
    setBusyPageId(null);
    if (!result.success) {
      setError(result.error || "Could not update page.");
      return;
    }
    setMessage(`Page ${page.pageNumber} saved.`);
    await refreshWorkbench();
  }

  async function handleReplaceImage(
    page: AdminEbookPageRow,
    imageUrl: string,
    file: File | null,
  ) {
    if (!ebook || !adminWritesEnabled || page.isPermanent) return;
    setBusyPageId(page.id);
    setError("");
    const formData = new FormData();
    if (file) formData.set("image", file);
    const result = await replaceMapSiteEbookPageImageAction({
      fastCode,
      bookId: ebook.id,
      pageId: page.id,
      imageUrl: imageUrl.trim() || null,
      formData: file ? formData : undefined,
    });
    setBusyPageId(null);
    if (!result.success) {
      setError(result.error || "Could not replace image.");
      return;
    }
    setMessage(`Page ${page.pageNumber} image updated.`);
    await refreshWorkbench();
  }

  return (
    <section className="rounded-2xl border border-neutral-200 bg-white p-6 space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-neutral-900">TalisBooks™</h2>
          <p className="mt-1 text-sm text-neutral-500">
            Form-driven ebook tools for {fastCode.toUpperCase()} — create, replace
            images, reorder, preview, publish, and attach to MapSite™. No HTML editing.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-sm">
          <Link
            href={shelfHref}
            target="_blank"
            className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-200 px-3 py-1.5 text-neutral-700 hover:bg-neutral-50"
          >
            Open shelf <ExternalLink className="h-3.5 w-3.5" />
          </Link>
          {viewerHref ? (
            <Link
              href={viewerHref}
              target="_blank"
              className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-200 px-3 py-1.5 text-neutral-700 hover:bg-neutral-50"
            >
              Preview book <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          ) : null}
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-neutral-500">
            Title
          </span>
          <input
            required
            className={inputClass}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            disabled={!adminWritesEnabled}
            placeholder="Property lookbook title"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-neutral-500">
            Subtitle
          </span>
          <input
            className={inputClass}
            value={subtitle}
            onChange={(event) => setSubtitle(event.target.value)}
            disabled={!adminWritesEnabled}
            placeholder="Address or short line"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-neutral-500">
            Description
          </span>
          <textarea
            className={textareaClass}
            rows={3}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            disabled={!adminWritesEnabled}
            placeholder="Short ebook summary"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-neutral-500">
            Cover image URL
          </span>
          <input
            className={inputClass}
            value={coverImageUrl}
            onChange={(event) => setCoverImageUrl(event.target.value)}
            disabled={!adminWritesEnabled}
            placeholder="https://…"
          />
        </label>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        {message ? <p className="text-sm text-green-700">{message}</p> : null}

        <div className="flex flex-wrap gap-2">
          <button
            type="submit"
            disabled={saving || !adminWritesEnabled}
            className="rounded-xl bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-60"
          >
            {saving ? "Saving…" : ebook ? "Save ebook" : "Create TalisBook™"}
          </button>
          <button
            type="button"
            disabled={saving || !adminWritesEnabled}
            onClick={async () => {
              if (!adminWritesEnabled) return;
              setSaving(true);
              setMessage("");
              setError("");
              const result = await createOrUpdateMapSiteEbookAction({
                fastCode,
                title,
                subtitle,
                description,
                coverImageUrl: coverImageUrl.trim() || null,
                asAdmin: true,
                notifyClient: true,
                attachToMapSite: true,
              });
              setSaving(false);
              if (!result.success) {
                setError(result.error || "Could not save ebook.");
                return;
              }
              setMessage(
                result.notified
                  ? "Ebook saved, attached, and client notified."
                  : "Ebook saved and attached. Client email was not found or notification was skipped.",
              );
              await refreshWorkbench();
              router.refresh();
            }}
            className="rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-medium text-neutral-900 hover:bg-neutral-50 disabled:opacity-60"
          >
            Save, attach & notify
          </button>
        </div>
      </form>

      {ebook ? (
        <div className="space-y-4 rounded-2xl border border-neutral-100 bg-neutral-50 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
                Book URL
              </p>
              <p className="mt-1 break-all text-sm text-neutral-800">{bookUrl}</p>
              <p className="mt-1 text-xs text-neutral-500">
                Status: <span className="font-medium">{ebook.publishStatus}</span>
                {" · "}
                {ebook.pageCount} pages
                {ebook.attachedTebUrl
                  ? " · Attached to MapSite™"
                  : " · Not attached yet"}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void handleCopyUrl()}
                className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-800 hover:bg-neutral-50"
              >
                <Copy className="h-3.5 w-3.5" />
                {copied ? "Copied" : "Copy URL"}
              </button>
              <button
                type="button"
                disabled={saving || !adminWritesEnabled}
                onClick={() => void handleAttach()}
                className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-800 hover:bg-neutral-50 disabled:opacity-60"
              >
                <Link2 className="h-3.5 w-3.5" />
                Attach to MapSite™
              </button>
              {ebook.publishStatus === "published" ? (
                <button
                  type="button"
                  disabled={saving || !adminWritesEnabled}
                  onClick={() => void handlePublish("draft")}
                  className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-800 hover:bg-neutral-50 disabled:opacity-60"
                >
                  Unpublish
                </button>
              ) : (
                <button
                  type="button"
                  disabled={saving || !adminWritesEnabled}
                  onClick={() => void handlePublish("published")}
                  className="rounded-xl bg-neutral-900 px-3 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-60"
                >
                  Publish book
                </button>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {ebook && pages.length > 0 ? (
        <div className="space-y-3">
          <div>
            <h3 className="text-sm font-semibold text-neutral-900">Pages</h3>
            <p className="mt-0.5 text-xs text-neutral-500">
              Replace images and reorder with the form controls. Glasshouse brochure
              pages are permanent and locked.
            </p>
          </div>

          <ul className="space-y-3">
            {pages.map((page) => (
              <PageAdminRow
                key={page.id}
                page={page}
                disabled={!adminWritesEnabled || busyPageId === page.id}
                busy={busyPageId === page.id}
                canMoveUp={
                  !page.isPermanent &&
                  movablePages.findIndex((item) => item.id === page.id) > 0
                }
                canMoveDown={
                  !page.isPermanent &&
                  movablePages.findIndex((item) => item.id === page.id) >= 0 &&
                  movablePages.findIndex((item) => item.id === page.id) <
                    movablePages.length - 1
                }
                onMoveUp={() => void handleMove(page.id, -1)}
                onMoveDown={() => void handleMove(page.id, 1)}
                onSaveFields={(nextTitle, nextBody) =>
                  void handlePageSave(page, nextTitle, nextBody)
                }
                onReplaceImage={(url, file) =>
                  void handleReplaceImage(page, url, file)
                }
              />
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}

function PageAdminRow({
  page,
  disabled,
  busy,
  canMoveUp,
  canMoveDown,
  onMoveUp,
  onMoveDown,
  onSaveFields,
  onReplaceImage,
}: {
  page: AdminEbookPageRow;
  disabled: boolean;
  busy: boolean;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onSaveFields: (title: string, body: string) => void;
  onReplaceImage: (url: string, file: File | null) => void;
}) {
  const [title, setTitle] = useState(page.title);
  const [body, setBody] = useState(page.body);
  const [imageUrl, setImageUrl] = useState(page.heroImageUrl || "");
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    setTitle(page.title);
    setBody(page.body);
    setImageUrl(page.heroImageUrl || "");
    setFile(null);
  }, [page.id, page.title, page.body, page.heroImageUrl]);

  return (
    <li className="rounded-2xl border border-neutral-200 bg-white p-4">
      <div className="flex flex-wrap items-start gap-4">
        <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded-lg bg-neutral-100">
          {page.heroImageUrl ? (
            <Image
              src={page.heroImageUrl}
              alt=""
              fill
              className="object-cover"
              unoptimized
            />
          ) : (
            <div className="flex h-full items-center justify-center text-[10px] text-neutral-400">
              No image
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-medium text-neutral-900">
              Page {page.pageNumber}
              <span className="ml-2 text-xs font-normal text-neutral-500">
                {page.layout.replaceAll("_", " ")}
                {page.isPermanent ? " · permanent" : ""}
              </span>
            </p>
            {!page.isPermanent ? (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={disabled || !canMoveUp}
                  onClick={onMoveUp}
                  className="rounded-lg border border-neutral-200 p-1.5 text-neutral-700 hover:bg-neutral-50 disabled:opacity-40"
                  aria-label="Move page up"
                >
                  <ArrowUp className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  disabled={disabled || !canMoveDown}
                  onClick={onMoveDown}
                  className="rounded-lg border border-neutral-200 p-1.5 text-neutral-700 hover:bg-neutral-50 disabled:opacity-40"
                  aria-label="Move page down"
                >
                  <ArrowDown className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : null}
          </div>

          {page.isPermanent ? (
            <p className="text-xs text-neutral-500">
              Locked Glasshouse™ brochure page. Replace globally in system settings —
              not editable per book.
            </p>
          ) : (
            <>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-neutral-500">
                  Title
                </span>
                <input
                  className={inputClass}
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  disabled={disabled}
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-neutral-500">
                  Body
                </span>
                <textarea
                  className={textareaClass}
                  rows={2}
                  value={body}
                  onChange={(event) => setBody(event.target.value)}
                  disabled={disabled}
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-neutral-500">
                  Image URL
                </span>
                <input
                  className={inputClass}
                  value={imageUrl}
                  onChange={(event) => setImageUrl(event.target.value)}
                  disabled={disabled}
                  placeholder="https://… or upload a file below"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-neutral-500">
                  Or upload image
                </span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  disabled={disabled}
                  onChange={(event) =>
                    setFile(event.target.files?.[0] ?? null)
                  }
                  className="block w-full text-sm text-neutral-600 file:mr-3 file:rounded-lg file:border-0 file:bg-neutral-900 file:px-3 file:py-2 file:text-sm file:font-medium file:text-white"
                />
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => onSaveFields(title, body)}
                  className="rounded-xl border border-neutral-200 px-3 py-2 text-sm text-neutral-800 hover:bg-neutral-50 disabled:opacity-60"
                >
                  {busy ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Save page text"
                  )}
                </button>
                <button
                  type="button"
                  disabled={disabled || (!imageUrl.trim() && !file)}
                  onClick={() => onReplaceImage(imageUrl, file)}
                  className="rounded-xl bg-neutral-900 px-3 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-60"
                >
                  Replace image
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </li>
  );
}
