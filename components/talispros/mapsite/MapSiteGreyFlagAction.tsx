"use client";

import { useRef, useState, useTransition } from "react";
import { saveMapSiteListingLinksAction } from "@/app/talispros/mapsite/dashboard-actions";
import { uploadMapSiteFlagAttachmentAction } from "@/app/talispros/mapsite/flag-actions";
import { useT } from "@/lib/i18n/client";
import {
  FLAG_ATTACHMENT_TYPES,
  type GreyFlagAction,
} from "@/lib/talispros/mapsite-flag-attachments";

/**
 * One focused action for an owner who clicks a grey PIN-card link
 * (Ralf, Nov 27 item #8). Never opens the eBook editor.
 */
export default function MapSiteGreyFlagAction({
  action,
  mapsiteId,
  fastCode,
  onClose,
  onUrlSaved,
  onAttached,
}: {
  action: GreyFlagAction;
  mapsiteId: string;
  fastCode: string;
  onClose: () => void;
  onUrlSaved: (url: string | null) => void;
  onAttached: (kind: "teb" | "tva", url: string) => void;
}) {
  const copy = useT().mapsite.flagActions;
  const [url, setUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  const title =
    action === "url"
      ? copy.urlTitle
      : action === "teb"
        ? copy.tebTitle
        : action === "tva"
          ? copy.tvaTitle
          : copy.ttvTitle;
  const body =
    action === "url"
      ? copy.urlBody
      : action === "teb"
        ? copy.tebBody
        : action === "tva"
          ? copy.tvaBody
          : copy.ttvBody;

  function saveUrl() {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const result = await saveMapSiteListingLinksAction({ mapsiteId, fastCode, listingUrl: url });
      if ("error" in result) {
        setError(result.error);
        return;
      }
      onUrlSaved(result.listingUrl);
      setMessage(copy.urlSaved);
    });
  }

  function upload(kind: "teb" | "tva") {
    if (!file) return;
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const form = new FormData();
      form.set("mapsiteId", mapsiteId);
      form.set("fastCode", fastCode);
      form.set("kind", kind);
      form.set("file", file);
      const result = await uploadMapSiteFlagAttachmentAction(form);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      onAttached(kind, result.url);
      setMessage(copy.uploaded);
    });
  }

  return (
    <div
      className="mt-2 rounded-xl bg-white px-3 py-3 text-left ring-1 ring-black/10"
      data-testid={`mapsite-grey-flag-action-${action}`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="m-0 text-[14px] font-semibold text-neutral-950">{title}</p>
        <button
          type="button"
          onClick={onClose}
          aria-label={copy.close}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-[15px] leading-none text-neutral-700 hover:bg-neutral-200"
        >
          ×
        </button>
      </div>
      <p className="m-0 mt-1 text-[13px] leading-snug text-neutral-700">{body}</p>

      {action === "url" ? (
        <div className="mt-2 flex flex-col gap-2">
          <input
            type="url"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="https://"
            autoComplete="off"
            data-testid="mapsite-grey-flag-url-input"
            className="block w-full rounded-md border border-neutral-300 px-2.5 py-1.5 text-[14px] text-neutral-950"
          />
          <button
            type="button"
            onClick={saveUrl}
            disabled={pending || !url.trim()}
            data-testid="mapsite-grey-flag-url-save"
            className="inline-flex min-h-9 items-center justify-center rounded-full bg-[#046BD9] px-4 text-[13px] font-semibold text-white hover:bg-[#0558b3] disabled:opacity-60"
          >
            {pending ? copy.saving : copy.urlSave}
          </button>
        </div>
      ) : null}

      {action === "teb" || action === "tva" ? (
        <div className="mt-2 flex flex-col gap-2">
          <input
            ref={inputRef}
            type="file"
            accept={FLAG_ATTACHMENT_TYPES[action].accept}
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            data-testid={`mapsite-grey-flag-file-${action}`}
            className="block w-full text-[13px] text-neutral-800 file:mr-2 file:rounded-full file:border-0 file:bg-neutral-100 file:px-3 file:py-1.5 file:text-[13px] file:font-semibold"
            aria-label={copy.choose}
          />
          <button
            type="button"
            onClick={() => upload(action)}
            disabled={pending || !file}
            data-testid={`mapsite-grey-flag-upload-${action}`}
            className="inline-flex min-h-9 items-center justify-center rounded-full bg-[#046BD9] px-4 text-[13px] font-semibold text-white hover:bg-[#0558b3] disabled:opacity-60"
          >
            {pending ? copy.uploading : copy.upload}
          </button>
        </div>
      ) : null}

      {message ? (
        <p role="status" className="m-0 mt-2 text-[13px] font-semibold text-emerald-700">
          {message}
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="m-0 mt-2 text-[13px] font-semibold text-red-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}
