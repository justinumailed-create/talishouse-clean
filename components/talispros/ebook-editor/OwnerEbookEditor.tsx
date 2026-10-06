"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { postEbookGenerateOptimizedImage } from "@/lib/media/client-upload-ebook-image";
import {
  OWNER_EBOOK_IMAGE_FIELDS,
  OWNER_EBOOK_TEXT_FIELDS,
  flattenUnits,
  groupOwnerEbookUnits,
  isMovableUnit,
  moveUnit,
  type OwnerEbookDetails,
  type OwnerEbookImageKey,
  type OwnerEbookPage,
  type OwnerEbookTextKey,
  type OwnerEbookUnit,
} from "@/lib/talisbooks/owner-ebook-editor-model";
import {
  addOwnerEbookPageAction,
  deleteOwnerEbookAction,
  deleteOwnerEbookPagesAction,
  loadOwnerEbookAction,
  reorderOwnerEbookPagesAction,
  saveOwnerEbookDetailsAction,
  saveOwnerEbookPageAction,
  setOwnerEbookPublishAction,
} from "@/app/talispros/mapsite/ebook-editor-actions";

type Props = {
  fastCode: string;
  mapsiteId: string;
  backHref: string;
  initialBook: OwnerEbookDetails;
  initialPages: OwnerEbookPage[];
};

const inputCls =
  "mt-1 block w-full rounded-md border border-neutral-300 px-2.5 py-1.5 text-sm focus:border-[#046BD9] focus:outline-none focus:ring-2 focus:ring-[#046BD9]/20";
const btnPrimary =
  "rounded-md bg-[#046BD9] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#035bb8] disabled:opacity-50";
const btnGhost =
  "rounded-md border border-neutral-300 px-3 py-1.5 text-xs font-semibold text-neutral-800 hover:bg-neutral-50 disabled:opacity-50";

function unitLabel(unit: OwnerEbookUnit, index: number): string {
  if (unit.kind === "front-cover") return "Front cover";
  if (unit.kind === "back-cover") return "Back cover";
  const first = unit.pages[0]!.pageNumber;
  const last = unit.pages[unit.pages.length - 1]!.pageNumber;
  const pages = first === last ? `Page ${first}` : `Pages ${first}–${last}`;
  return `${unit.kind === "spread" ? "Spread" : "Page"} ${index} · ${pages}`;
}

function unitThumb(unit: OwnerEbookUnit): string | null {
  for (const page of unit.pages) {
    const url = page.images.spreadImageUrl || page.images.heroImageUrl;
    if (url) return url;
  }
  return null;
}

async function uploadImage(mapsiteId: string, file: File, label: string): Promise<string> {
  const result = await postEbookGenerateOptimizedImage({
    mapsiteId,
    kind: "property",
    file,
    label,
  });
  return result.url;
}

function ImagePicker({
  mapsiteId,
  label,
  value,
  onChange,
  disabled,
}: {
  mapsiteId: string;
  label: string;
  value: string | null;
  onChange: (url: string) => void;
  disabled?: boolean;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-neutral-600">{label}</p>
      <div className="flex items-center gap-3">
        <div className="flex h-20 w-28 items-center justify-center overflow-hidden rounded border border-neutral-200 bg-neutral-50">
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt={`${label} preview`} className="h-full w-full object-cover" />
          ) : (
            <span className="text-[10px] text-neutral-400">No image</span>
          )}
        </div>
        <label className={`${btnGhost} cursor-pointer`}>
          {uploading ? "Uploading…" : value ? "Replace" : "Upload"}
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="sr-only"
            disabled={disabled || uploading}
            onChange={async (event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (!file) return;
              setUploading(true);
              setError(null);
              try {
                onChange(await uploadImage(mapsiteId, file, file.name || label));
              } catch (uploadError) {
                setError(uploadError instanceof Error ? uploadError.message : "Upload failed.");
              } finally {
                setUploading(false);
              }
            }}
          />
        </label>
      </div>
      {error ? <p className="text-[11px] text-red-600">{error}</p> : null}
    </div>
  );
}

function PageFields({
  page,
  mapsiteId,
  pending,
  onSave,
}: {
  page: OwnerEbookPage;
  mapsiteId: string;
  pending: boolean;
  onSave: (patch: {
    text: Partial<Record<OwnerEbookTextKey, string>>;
    images: Partial<Record<OwnerEbookImageKey, string>>;
    captionsEnabled: boolean;
  }) => void;
}) {
  const [text, setText] = useState(page.text);
  const [images, setImages] = useState(page.images);
  const [captions, setCaptions] = useState(page.captionsEnabled);
  const textFields = OWNER_EBOOK_TEXT_FIELDS.filter(
    (field) => field.key === "title" || field.key === "body" || page.text[field.key] !== undefined,
  );
  // Spreads share one image on the left leaf; show the right leaf's image only if it differs.
  const imageFields = OWNER_EBOOK_IMAGE_FIELDS.filter((field) => {
    if (page.images[field.key] !== undefined) return true;
    if (field.key === "heroImageUrl") {
      return !page.layout.startsWith("centerfold") && page.images.spreadImageUrl === undefined;
    }
    return false;
  });

  if (page.locked) {
    return (
      <p className="text-xs text-neutral-500">
        Locked system page (Talispros™ brochure). It is updated globally, not per book.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <p className="font-mono text-[10px] uppercase text-neutral-400">
        Page {page.pageNumber} · {page.layout}
      </p>
      {imageFields.map((field) => (
        <ImagePicker
          key={field.key}
          mapsiteId={mapsiteId}
          label={field.label}
          value={images[field.key] ?? null}
          disabled={pending}
          onChange={(url) => setImages((current) => ({ ...current, [field.key]: url }))}
        />
      ))}
      {textFields.map((field) => (
        <label key={field.key} className="block text-xs font-medium text-neutral-600">
          {field.label}
          {field.multiline ? (
            <textarea
              rows={field.key === "body" ? 4 : 2}
              value={text[field.key] ?? ""}
              onChange={(event) =>
                setText((current) => ({ ...current, [field.key]: event.target.value }))
              }
              className={inputCls}
            />
          ) : (
            <input
              value={text[field.key] ?? ""}
              onChange={(event) =>
                setText((current) => ({ ...current, [field.key]: event.target.value }))
              }
              className={inputCls}
            />
          )}
        </label>
      ))}
      {page.layout.startsWith("centerfold") ? (
        <label className="flex items-center gap-2 text-xs text-neutral-700">
          <input
            type="checkbox"
            checked={captions}
            onChange={(event) => setCaptions(event.target.checked)}
          />
          Show caption text on this spread
        </label>
      ) : null}
      <button
        type="button"
        disabled={pending}
        className={btnPrimary}
        onClick={() => onSave({ text, images, captionsEnabled: captions })}
      >
        Save page {page.pageNumber}
      </button>
    </div>
  );
}

/**
 * Owner Ebook Editor (separate page). Book details + cover, every editable page
 * component the viewer reads, spread-aware add / reorder / delete, publish,
 * and delete ebook. All writes go through ownership-checked server actions.
 */
export default function OwnerEbookEditor({
  fastCode,
  mapsiteId,
  backHref,
  initialBook,
  initialPages,
}: Props) {
  const router = useRouter();
  const [book, setBook] = useState(initialBook);
  const [pages, setPages] = useState(initialPages);
  const [units, setUnits] = useState(() => groupOwnerEbookUnits(initialPages));
  const [orderDirty, setOrderDirty] = useState(false);
  const [openUnit, setOpenUnit] = useState<string | null>(null);
  const [details, setDetails] = useState({
    title: initialBook.title,
    subtitle: initialBook.subtitle,
    description: initialBook.description,
    coverImageUrl: initialBook.coverImageUrl,
  });
  const [newPage, setNewPage] = useState<{ imageUrl: string | null; title: string; body: string }>({
    imageUrl: null,
    title: "",
    body: "",
  });
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const viewerHref = `/talisbooks/viewer/${encodeURIComponent(book.slug)}`;
  const hasSpreads = useMemo(() => pages.some((page) => page.layout === "centerfold_left"), [pages]);

  function report(result: { success: boolean; error?: string }, ok: string): boolean {
    if (!result.success) {
      setError(result.error || "Something went wrong.");
      setMessage(null);
      return false;
    }
    setError(null);
    setMessage(ok);
    return true;
  }

  async function reload() {
    const result = await loadOwnerEbookAction({ fastCode, bookId: book.id });
    if (!result.success) {
      setError(result.error);
      return;
    }
    setBook(result.book);
    setPages(result.pages);
    setUnits(groupOwnerEbookUnits(result.pages));
    setOrderDirty(false);
  }

  function run(task: () => Promise<{ success: boolean; error?: string }>, ok: string, refresh = true) {
    startTransition(async () => {
      const result = await task();
      if (report(result, ok) && refresh) await reload();
    });
  }

  const unitLabels = useMemo(() => {
    let interior = 0;
    return units.map((unit) =>
      unitLabel(unit, unit.kind === "spread" || unit.kind === "page" ? ++interior : 0),
    );
  }, [units]);

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-6 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href={backHref}
          className="inline-flex items-center gap-1 text-sm font-medium text-[#046BD9] hover:underline"
        >
          ← Back to Mapsite™
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <a href={viewerHref} target="_blank" rel="noopener noreferrer" className={btnGhost}>
            View ebook
          </a>
          <button
            type="button"
            disabled={pending}
            className={btnGhost}
            onClick={() =>
              run(
                () =>
                  setOwnerEbookPublishAction({
                    fastCode,
                    bookId: book.id,
                    status: book.publishStatus === "published" ? "draft" : "published",
                  }),
                book.publishStatus === "published" ? "Moved to draft." : "Published.",
              )
            }
          >
            {book.publishStatus === "published" ? "Unpublish" : "Publish"}
          </button>
          <button
            type="button"
            disabled={pending}
            className="rounded-md px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
            onClick={() => {
              if (
                !window.confirm(
                  `Delete “${book.title || "this ebook"}”? This removes it from your shelf and cannot be undone.`,
                )
              ) {
                return;
              }
              startTransition(async () => {
                const result = await deleteOwnerEbookAction({ fastCode, bookId: book.id });
                if (report(result, "Ebook deleted.")) router.push(backHref);
              });
            }}
          >
            Delete ebook
          </button>
        </div>
      </div>

      <header>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
          Ebook Editor · FAST Code™ {fastCode.toUpperCase()}
        </p>
        <h1 className="text-xl font-semibold text-neutral-900">{book.title || "Untitled ebook"}</h1>
        <p className="text-xs text-neutral-500">
          {book.publishStatus} · {pages.length} pages
        </p>
      </header>

      {message ? (
        <p className="rounded-md bg-emerald-50 px-3 py-2 text-xs text-emerald-800">{message}</p>
      ) : null}
      {error ? (
        <p className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-700" role="alert">
          {error}
        </p>
      ) : null}

      <section className="space-y-3 rounded-xl border border-neutral-200 bg-white p-4">
        <h2 className="text-sm font-semibold">Book details</h2>
        <label className="block text-xs font-medium text-neutral-600">
          Title
          <input
            value={details.title}
            maxLength={200}
            onChange={(event) => setDetails((d) => ({ ...d, title: event.target.value }))}
            className={inputCls}
          />
        </label>
        <label className="block text-xs font-medium text-neutral-600">
          Subtitle
          <input
            value={details.subtitle}
            maxLength={300}
            onChange={(event) => setDetails((d) => ({ ...d, subtitle: event.target.value }))}
            className={inputCls}
          />
        </label>
        <label className="block text-xs font-medium text-neutral-600">
          Description
          <textarea
            rows={3}
            value={details.description}
            maxLength={4000}
            onChange={(event) => setDetails((d) => ({ ...d, description: event.target.value }))}
            className={inputCls}
          />
        </label>
        <ImagePicker
          mapsiteId={mapsiteId}
          label="Front cover (shelf + first page)"
          value={details.coverImageUrl}
          disabled={pending}
          onChange={(url) => setDetails((d) => ({ ...d, coverImageUrl: url }))}
        />
        <button
          type="button"
          disabled={pending}
          className={btnPrimary}
          onClick={() =>
            run(
              () =>
                saveOwnerEbookDetailsAction({
                  fastCode,
                  bookId: book.id,
                  ...details,
                  coverImageUrl:
                    details.coverImageUrl !== book.coverImageUrl
                      ? details.coverImageUrl
                      : null,
                }),
              "Book details saved.",
            )
          }
        >
          {pending ? "Saving…" : "Save details"}
        </button>
      </section>

      <section className="space-y-3 rounded-xl border border-neutral-200 bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold">Pages</h2>
          {orderDirty ? (
            <div className="flex gap-2">
              <button
                type="button"
                disabled={pending}
                className={btnPrimary}
                onClick={() =>
                  run(
                    () =>
                      reorderOwnerEbookPagesAction({
                        fastCode,
                        bookId: book.id,
                        orderedPageIds: flattenUnits(units),
                      }),
                    "Page order saved.",
                  )
                }
              >
                Save page order
              </button>
              <button
                type="button"
                disabled={pending}
                className={btnGhost}
                onClick={() => {
                  setUnits(groupOwnerEbookUnits(pages));
                  setOrderDirty(false);
                }}
              >
                Undo
              </button>
            </div>
          ) : null}
        </div>
        <p className="text-[11px] text-neutral-500">
          {hasSpreads
            ? "Template spreads move and delete as a pair so left and right pages stay together. Covers stay first and last."
            : "Covers stay first and last."}
        </p>
        <ol className="space-y-2">
          {units.map((unit, index) => {
            const label = unitLabels[index]!;
            const thumb = unitThumb(unit);
            const movable = isMovableUnit(unit);
            const open = openUnit === unit.key;
            const deletable = movable;
            return (
              <li key={unit.key} className="rounded-lg border border-neutral-200">
                <div className="flex items-center gap-3 p-2">
                  <div className="h-12 w-20 shrink-0 overflow-hidden rounded bg-neutral-100">
                    {thumb ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={thumb} alt="" className="h-full w-full object-cover" />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{label}</p>
                    <p className="truncate text-[11px] text-neutral-500">
                      {unit.pages[0]?.text.title || unit.pages[0]?.slug}
                      {unit.pages.some((page) => page.locked) ? " · locked" : ""}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      aria-label={`Move ${label} up`}
                      disabled={!movable || pending || !isMovableUnit(units[index - 1] ?? unit) || index === 0}
                      onClick={() => {
                        setUnits((current) => moveUnit(current, unit.key, -1));
                        setOrderDirty(true);
                      }}
                      className="rounded border border-neutral-200 px-2 py-1 text-xs disabled:opacity-30"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      aria-label={`Move ${label} down`}
                      disabled={
                        !movable || pending || index === units.length - 1 || !isMovableUnit(units[index + 1] ?? unit)
                      }
                      onClick={() => {
                        setUnits((current) => moveUnit(current, unit.key, 1));
                        setOrderDirty(true);
                      }}
                      className="rounded border border-neutral-200 px-2 py-1 text-xs disabled:opacity-30"
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      className={btnGhost}
                      disabled={orderDirty}
                      title={orderDirty ? "Save or undo the page order first" : undefined}
                      onClick={() => setOpenUnit(open ? null : unit.key)}
                    >
                      {open ? "Close" : "Edit"}
                    </button>
                    {deletable ? (
                      <button
                        type="button"
                        disabled={pending || orderDirty}
                        className="rounded-md px-2 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-40"
                        onClick={() => {
                          if (!window.confirm(`Delete ${label}? This cannot be undone.`)) return;
                          run(
                            () =>
                              deleteOwnerEbookPagesAction({
                                fastCode,
                                bookId: book.id,
                                pageIds: unit.pages.map((page) => page.id),
                              }),
                            `${label} deleted.`,
                          );
                        }}
                      >
                        Delete
                      </button>
                    ) : null}
                  </div>
                </div>
                {open ? (
                  <div className="grid gap-4 border-t border-neutral-100 p-3 sm:grid-cols-2">
                    {unit.pages.map((page) => (
                      <PageFields
                        key={`${page.id}-${page.pageNumber}`}
                        page={page}
                        mapsiteId={mapsiteId}
                        pending={pending}
                        onSave={(patch) =>
                          run(
                            () =>
                              saveOwnerEbookPageAction({
                                fastCode,
                                bookId: book.id,
                                pageId: page.id,
                                text: patch.text as Record<string, string>,
                                images: patch.images as Record<string, string>,
                                captionsEnabled: patch.captionsEnabled,
                              }),
                            `Page ${page.pageNumber} saved.`,
                          )
                        }
                      />
                    ))}
                  </div>
                ) : null}
              </li>
            );
          })}
        </ol>
      </section>

      <section className="space-y-3 rounded-xl border border-neutral-200 bg-white p-4">
        <h2 className="text-sm font-semibold">
          Add a {hasSpreads ? "spread" : "page"}
        </h2>
        <p className="text-[11px] text-neutral-500">
          Added before the back cover. Move it with the arrows afterwards.
        </p>
        <ImagePicker
          mapsiteId={mapsiteId}
          label={hasSpreads ? "Spread image (landscape works best)" : "Page image"}
          value={newPage.imageUrl}
          disabled={pending}
          onChange={(url) => setNewPage((p) => ({ ...p, imageUrl: url }))}
        />
        <label className="block text-xs font-medium text-neutral-600">
          Title
          <input
            value={newPage.title}
            onChange={(event) => setNewPage((p) => ({ ...p, title: event.target.value }))}
            className={inputCls}
          />
        </label>
        <label className="block text-xs font-medium text-neutral-600">
          Caption / body (optional)
          <textarea
            rows={3}
            value={newPage.body}
            onChange={(event) => setNewPage((p) => ({ ...p, body: event.target.value }))}
            className={inputCls}
          />
        </label>
        <button
          type="button"
          disabled={pending || !newPage.imageUrl || orderDirty}
          className={btnPrimary}
          onClick={() =>
            run(async () => {
              const result = await addOwnerEbookPageAction({
                fastCode,
                bookId: book.id,
                imageUrl: newPage.imageUrl || "",
                title: newPage.title,
                body: newPage.body,
              });
              if (result.success) setNewPage({ imageUrl: null, title: "", body: "" });
              return result;
            }, hasSpreads ? "Spread added." : "Page added.")
          }
        >
          Add {hasSpreads ? "spread" : "page"}
        </button>
      </section>
    </div>
  );
}
