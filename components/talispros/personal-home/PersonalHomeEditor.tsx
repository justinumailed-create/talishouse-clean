"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { useT } from "@/lib/i18n/client";
import { optimizeImageFileForUpload } from "@/lib/media/client-optimize-upload-image";
import {
  PERSONAL_HOME_DRAFT_EVENT,
  PERSONAL_HOME_LIMITS,
  PERSONAL_HOME_OPEN_EDITOR_EVENT,
  PERSONAL_HOME_VIDEO_MAX_BYTES,
  coalescePersonalHomeContact,
  type PersonalHomeButton,
  type PersonalHomeSideMedia,
  type PersonalHomeContent,
  type PersonalHomeDefaults,
  type PersonalHomeDraft,
  type PersonalHomeOpenKind,
} from "@/lib/talispros/personal-home";
import PersonalHomeWriteUp from "@/components/talispros/personal-home/PersonalHomeWriteUp";
import {
  WRITE_UP_TOKENS,
  wrapWriteUpSelection,
  type WriteUpMark,
} from "@/lib/talispros/write-up-format";
import { fmt } from "@/lib/i18n/format";
import {
  resetPersonalHomeAction,
  savePersonalHomeAction,
  type PersonalHomeActionError,
} from "@/app/talispros/home/actions";

type PersonalHomeEditorProps = {
  fastCode: string;
  saved: PersonalHomeContent;
  defaults: PersonalHomeDefaults;
  /** Open the editor on arrival (navbar account pill from the Mapsite). */
  initialOpen?: boolean;
  /** Targets the Button opens menu can point at. */
  homeOpens?: {
    tebHref: string | null;
    pins: { id: string; label: string }[];
  } | null;
};

type ButtonDraft = {
  label: string;
  kind: PersonalHomeOpenKind;
  href: string;
  pinId: string;
};

const INPUT =
  "mt-1 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-[15px] text-neutral-900 outline-none focus:border-[#046BD9] focus:ring-2 focus:ring-[#046BD9]/20 disabled:opacity-60";
const LABEL = "block text-[13px] font-semibold text-neutral-700";

function openOptions(
  t: {
    openLink: string;
    openPin: string;
    panelEbooks: string;
    panelBookshelf: string;
    panelPins: string;
    panelCategories: string;
    panelBranding: string;
    panelPartners: string;
  },
  teb: boolean,
) {
  const options: { id: PersonalHomeOpenKind; label: string }[] = [
    { id: "link", label: t.openLink },
    { id: "pin", label: t.openPin },
    { id: "ebooks", label: t.panelEbooks },
    { id: "bookshelf", label: t.panelBookshelf },
  ];
  if (teb) options.push({ id: "teb", label: "TEB" });
  options.push(
    { id: "pins", label: t.panelPins },
    { id: "categories", label: t.panelCategories },
    { id: "branding", label: t.panelBranding },
    { id: "partners", label: t.panelPartners },
  );
  return options;
}

function openLabel(
  t: Parameters<typeof openOptions>[0],
  kind: PersonalHomeOpenKind,
): string {
  return openOptions(t, true).find((option) => option.id === kind)?.label || t.openLink;
}

function toDrafts(buttons: PersonalHomeButton[]): ButtonDraft[] {
  return buttons.map((button) => ({
    label: button.label,
    kind: button.kind || "link",
    href: button.href,
    pinId: button.pinId || "",
  }));
}

/**
 * Owner-only editor for the personal home page. The server renders this only
 * when the visitor holds the owner session (or is a Mapsite admin); every
 * action re-checks that on the server.
 */
export default function PersonalHomeEditor({
  fastCode,
  saved,
  defaults,
  initialOpen = false,
  homeOpens = null,
}: PersonalHomeEditorProps) {
  const { personalHome } = useT();
  const t = personalHome.edit;
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const sideImageRef = useRef<HTMLInputElement>(null);
  const sideVideoRef = useRef<HTMLInputElement>(null);
  const writeUpRef = useRef<HTMLTextAreaElement>(null);
  const [open, setOpen] = useState(initialOpen);

  useEffect(() => {
    const openEditor = () => setOpen(true);
    window.addEventListener(PERSONAL_HOME_OPEN_EDITOR_EVENT, openEditor);
    return () => window.removeEventListener(PERSONAL_HOME_OPEN_EDITOR_EVENT, openEditor);
  }, []);
  const [saving, setSaving] = useState(false);
  const [reloadOnClose, setReloadOnClose] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(saved.imageUrl);
  const [sideKind, setSideKind] = useState<"" | PersonalHomeSideMedia["kind"]>(
    saved.sideMedia?.kind ?? "",
  );
  const [sideUrl, setSideUrl] = useState(saved.sideMedia?.url ?? "");
  const [kicker, setKicker] = useState(saved.kicker ?? "");
  const [headline, setHeadline] = useState(saved.headline ?? "");
  const initialContact = coalescePersonalHomeContact({
    contactName: saved.contactName,
    contactPhone: saved.contactPhone,
    contactEmail: saved.contactEmail,
  });
  const [contactName, setContactName] = useState(
    initialContact.contactName?.trim() || saved.contactName?.trim() || defaults.contactName || "",
  );
  const [contactPhone, setContactPhone] = useState(initialContact.contactPhone ?? "");
  const [contactEmail, setContactEmail] = useState(initialContact.contactEmail ?? "");
  const [writeUp, setWriteUp] = useState(saved.writeUp ?? "");
  const [buttons, setButtons] = useState<ButtonDraft[]>(
    toDrafts(saved.buttons.length ? saved.buttons : defaults.buttons),
  );
  const [openMenu, setOpenMenu] = useState<{ index: number; which: "opens" | "pin" } | null>(null);
  const [invalid, setInvalid] = useState<number[]>([]);
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(
    null,
  );

  function errorText(error: PersonalHomeActionError | string): string {
    if (error === "auth") return t.errAuth;
    if (error === "buttons") return t.errButtons;
    if (error === "photo") return t.errPhoto;
    if (error === "video") return t.errVideo;
    if (error === "media") return t.errMedia;
    return t.errSave;
  }

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setMessage(null);
    setUploading(true);
    try {
      const optimized = await optimizeImageFileForUpload(file, {
        kind: "agent",
        label: t.photo,
      });
      const body = new FormData();
      body.set("fastCode", fastCode);
      body.set("file", optimized);
      const response = await fetch("/api/talispros/personal-home/upload-image", {
        method: "POST",
        body,
      });
      const result = (await response.json().catch(() => null)) as
        | { ok: true; url: string }
        | { ok: false; error: string }
        | null;
      if (!result || !result.ok) {
        setMessage({ tone: "error", text: errorText(result?.ok === false ? result.error : "photo") });
        return;
      }
      setImageUrl(result.url);
    } catch {
      setMessage({ tone: "error", text: t.errPhoto });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function sidePayload(): PersonalHomeSideMedia | null {
    const url = sideUrl.trim();
    if (!sideKind || !url) return null;
    if (sideKind === "embed") return { kind: "embed", url, provider: "youtube" };
    return { kind: sideKind, url };
  }

  async function handleSideImage(file: File | undefined) {
    if (!file) return;
    setMessage(null);
    setUploading(true);
    try {
      const optimized = await optimizeImageFileForUpload(file, {
        kind: "agent",
        label: t.sidePicture,
      });
      const body = new FormData();
      body.set("fastCode", fastCode);
      body.set("file", optimized);
      const response = await fetch("/api/talispros/personal-home/upload-image", {
        method: "POST",
        body,
      });
      const result = (await response.json().catch(() => null)) as
        | { ok: true; url: string }
        | { ok: false; error: string }
        | null;
      if (!result || !result.ok) {
        setMessage({ tone: "error", text: errorText(result?.ok === false ? result.error : "photo") });
        return;
      }
      setSideKind("image");
      setSideUrl(result.url);
    } catch {
      setMessage({ tone: "error", text: t.errPhoto });
    } finally {
      setUploading(false);
      if (sideImageRef.current) sideImageRef.current.value = "";
    }
  }

  async function handleSideVideo(file: File | undefined) {
    if (!file) return;
    setMessage(null);
    if (file.size > PERSONAL_HOME_VIDEO_MAX_BYTES) {
      setMessage({ tone: "error", text: t.errVideo });
      if (sideVideoRef.current) sideVideoRef.current.value = "";
      return;
    }
    setUploading(true);
    try {
      const body = new FormData();
      body.set("fastCode", fastCode);
      body.set("file", file);
      const response = await fetch("/api/talispros/personal-home/upload-image", {
        method: "POST",
        body,
      });
      const result = (await response.json().catch(() => null)) as
        | { ok: true; url: string }
        | { ok: false; error: string }
        | null;
      if (!result || !result.ok) {
        setMessage({ tone: "error", text: errorText(result?.ok === false ? result.error : "video") });
        return;
      }
      setSideKind("video");
      setSideUrl(result.url);
    } catch {
      setMessage({ tone: "error", text: t.errVideo });
    } finally {
      setUploading(false);
      if (sideVideoRef.current) sideVideoRef.current.value = "";
    }
  }

  function applyWriteUpMark(kind: WriteUpMark) {
    const field = writeUpRef.current;
    const start = field?.selectionStart ?? writeUp.length;
    const end = field?.selectionEnd ?? writeUp.length;
    const next = wrapWriteUpSelection(writeUp, start, end, WRITE_UP_TOKENS[kind]);
    setWriteUp(next.value);
    requestAnimationFrame(() => {
      field?.focus();
      field?.setSelectionRange(next.start, next.end);
    });
  }

  function onWriteUpKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (!(event.metaKey || event.ctrlKey) || event.altKey) return;
    const key = event.key.toLowerCase();
    const kind: WriteUpMark | null =
      key === "b" ? "bold" : key === "i" ? "italic" : key === "u" ? "underline" : null;
    if (!kind) return;
    event.preventDefault();
    applyWriteUpMark(kind);
  }


  async function handleSave() {
    // Saving is a local flag so the button does not stay on "Saving…" if
    // router.refresh() is slow or hangs (heavy Mapsite / widget rerender).
    if (saving || uploading) return;
    setMessage(null);
    setInvalid([]);
    setSaving(true);
    try {
      const result = await savePersonalHomeAction({
        fastCode,
        imageUrl,
        kicker,
        headline,
        contactName,
        contactPhone,
        contactEmail,
        writeUp,
        buttons,
        sideMedia: sidePayload(),
      });
      if (!result.ok) {
        setInvalid(result.invalidButtons ?? []);
        setMessage({ tone: "error", text: errorText(result.error) });
        return;
      }
      setMessage({ tone: "ok", text: t.saved });
      setReloadOnClose(true);
    } catch {
      setMessage({ tone: "error", text: t.errSave });
    } finally {
      setSaving(false);
    }
    router.refresh();
  }

  function handleClose() {
    setOpen(false);
    if (reloadOnClose) {
      window.location.reload();
    }
  }

  async function handleReset() {
    if (saving || uploading) return;
    if (!window.confirm(t.resetConfirm)) return;
    setMessage(null);
    setInvalid([]);
    setSaving(true);
    try {
      const result = await resetPersonalHomeAction({ fastCode });
      if (!result.ok) {
        setMessage({ tone: "error", text: errorText(result.error) });
        return;
      }
      setImageUrl(null);
      setSideKind("");
      setSideUrl("");
      setKicker("");
      setHeadline("");
      setContactName(defaults.contactName || "");
      setContactPhone("");
      setContactEmail("");
      setWriteUp("");
      setButtons(toDrafts(defaults.buttons));
      setMessage({ tone: "ok", text: t.saved });
      setReloadOnClose(true);
    } catch {
      setMessage({ tone: "error", text: t.errSave });
    } finally {
      setSaving(false);
    }
    router.refresh();
  }

  useEffect(() => {
    const detail: PersonalHomeDraft = open
      ? { headline, contactName, contactPhone, contactEmail }
      : {
          headline: saved.headline ?? "",
          contactName: saved.contactName ?? "",
          contactPhone: saved.contactPhone ?? "",
          contactEmail: saved.contactEmail ?? "",
        };
    window.dispatchEvent(new CustomEvent(PERSONAL_HOME_DRAFT_EVENT, { detail }));
  }, [
    open,
    headline,
    contactName,
    contactPhone,
    contactEmail,
    saved.headline,
    saved.contactName,
    saved.contactPhone,
    saved.contactEmail,
  ]);

  const busy = saving || uploading;
  const previewSrc = imageUrl || defaults.imageUrl;

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        data-testid="personal-home-edit-open"
        className="fixed bottom-56 left-4 z-40 inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-black px-4 py-2 text-[15px] font-semibold text-white shadow-[0_8px_24px_rgba(0,0,0,0.28)] transition hover:bg-neutral-800 sm:bottom-6 sm:left-6"
      >
        <svg aria-hidden viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor">
          <path d="M13.6 2.6a2 2 0 0 1 2.8 2.8l-9.3 9.3-3.6.8.8-3.6 9.3-9.3Z" />
        </svg>
        {t.open}
      </button>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/30"
      role="dialog"
      aria-modal="true"
      aria-labelledby="personal-home-edit-title"
      data-testid="personal-home-editor"
    >
      <div className="flex h-full w-full max-w-[460px] flex-col overflow-hidden bg-white shadow-2xl">
        <div className="border-b border-neutral-200 px-5 py-4">
          <h2
            id="personal-home-edit-title"
            className="m-0! text-[18px] font-semibold text-neutral-950!"
          >
            {t.title}
          </h2>
          <div className="mt-1 text-[13px] leading-snug text-neutral-600">{t.intro}</div>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
          <div className="text-[13px] text-neutral-500">{t.defaultHint}</div>

          <div>
            <div className={LABEL}>{t.buttonPhoto}</div>
            <div className="mt-1 text-[12px] text-neutral-500">{t.buttonPhotoHint}</div>
            <div className="mt-2 flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewSrc}
                alt=""
                className="h-20 w-20 shrink-0 rounded-xl border border-neutral-200 object-cover"
              />
              <div className="flex flex-col items-start gap-1.5">
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
                  className="sr-only"
                  data-testid="personal-home-photo-input"
                  onChange={(event) => handleFile(event.target.files?.[0])}
                />
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => fileRef.current?.click()}
                  className="inline-flex min-h-9 items-center rounded-full bg-[#046BD9] px-4 text-[14px] font-semibold text-white hover:bg-[#0358b3] disabled:opacity-60"
                >
                  {uploading ? t.uploading : imageUrl ? t.replacePhoto : t.uploadPhoto}
                </button>
                {imageUrl ? (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => setImageUrl(null)}
                    className="text-[13px] font-medium text-neutral-600 underline-offset-2 hover:underline disabled:opacity-60"
                  >
                    {t.removePhoto}
                  </button>
                ) : null}
              </div>
            </div>
          </div>

          <div data-testid="personal-home-side-fields">
            <div className={LABEL}>{t.sideMedia}</div>
            <div className="mt-1 text-[12px] leading-snug text-neutral-500">{t.sideHint}</div>
            <div className="mt-2 flex flex-wrap gap-2">
              {(
                [
                  ["", t.sideSame],
                  ["image", t.sidePicture],
                  ["video", t.sideVideo],
                  ["embed", t.sideEmbed],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id || "same"}
                  type="button"
                  disabled={busy}
                  data-testid={`personal-home-side-${id || "same"}`}
                  onClick={() => {
                    if (id !== sideKind) setSideUrl("");
                    setSideKind(id);
                  }}
                  className={`rounded-full border px-3 py-1.5 text-[13px] font-semibold ${
                    sideKind === id
                      ? "border-[#046BD9] bg-[#046BD9] text-white"
                      : "border-neutral-300 bg-white text-neutral-800"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            {sideKind === "image" ? (
              <div className="mt-3">
                <input
                  ref={sideImageRef}
                  type="file"
                  accept="image/jpeg,image/png"
                  className="sr-only"
                  data-testid="personal-home-side-image-input"
                  onChange={(event) => handleSideImage(event.target.files?.[0])}
                />
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => sideImageRef.current?.click()}
                  className="inline-flex min-h-9 items-center rounded-full bg-[#046BD9] px-4 text-[14px] font-semibold text-white hover:bg-[#0358b3] disabled:opacity-60"
                >
                  {uploading ? t.uploading : sideUrl ? t.replacePhoto : t.uploadPhoto}
                </button>
              </div>
            ) : null}
            {sideKind === "video" ? (
              <div className="mt-3">
                <input
                  ref={sideVideoRef}
                  type="file"
                  accept="video/mp4"
                  className="sr-only"
                  data-testid="personal-home-side-video-input"
                  onChange={(event) => handleSideVideo(event.target.files?.[0])}
                />
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => sideVideoRef.current?.click()}
                  className="inline-flex min-h-9 items-center rounded-full bg-[#046BD9] px-4 text-[14px] font-semibold text-white hover:bg-[#0358b3] disabled:opacity-60"
                >
                  {uploading ? t.uploading : t.sideVideo}
                </button>
                {sideUrl ? (
                  <div className="mt-2 text-[12px] text-neutral-600">{t.sideVideoReady}</div>
                ) : null}
              </div>
            ) : null}
            {sideKind === "embed" ? (
              <label className="mt-3 block">
                <span className={LABEL}>{t.sideAddress}</span>
                <input
                  value={sideUrl}
                  disabled={busy}
                  placeholder="https://www.youtube.com/watch?v="
                  data-testid="personal-home-side-url"
                  onChange={(event) => setSideUrl(event.target.value)}
                  className={INPUT}
                />
              </label>
            ) : null}
          </div>

          <label className="block">
            <span className={LABEL}>{t.kicker}</span>
            <input
              value={kicker}
              maxLength={PERSONAL_HOME_LIMITS.kicker}
              placeholder={defaults.kicker}
              disabled={busy}
              onChange={(event) => setKicker(event.target.value)}
              className={INPUT}
            />
            <span className="mt-1 block text-[12px] leading-snug text-neutral-500">{t.kickerHint}</span>
          </label>

          <label className="block">
            <span className={LABEL}>{t.headline}</span>
            <input
              value={headline}
              maxLength={PERSONAL_HOME_LIMITS.headline}
              disabled={busy}
              data-testid="personal-home-headline"
              onChange={(event) => setHeadline(event.target.value)}
              className={INPUT}
            />
            <span className="mt-1 block text-[12px] leading-snug text-neutral-500">{t.headlineHint}</span>
          </label>

          <label className="block">
            <span className={LABEL}>{t.contactName}</span>
            <input
              value={contactName}
              maxLength={PERSONAL_HOME_LIMITS.contactName}
              disabled={busy}
              data-testid="personal-home-contact-name"
              onChange={(event) => setContactName(event.target.value)}
              className={INPUT}
            />
            <span className="mt-1 block text-[12px] leading-snug text-neutral-500">
              {fmt(t.contactHint, { name: defaults.contactName })}
            </span>
          </label>

          <label className="block">
            <span className={LABEL}>{t.contactPhone}</span>
            <input
              type="tel"
              value={contactPhone}
              maxLength={PERSONAL_HOME_LIMITS.contactPhone}
              disabled={busy}
              data-testid="personal-home-contact-phone"
              onChange={(event) => setContactPhone(event.target.value)}
              className={INPUT}
            />
            <span className="mt-1 block text-[12px] leading-snug text-neutral-500">{t.contactPhoneHint}</span>
          </label>

          <label className="block">
            <span className={LABEL}>{t.contactEmail}</span>
            <input
              type="email"
              value={contactEmail}
              maxLength={PERSONAL_HOME_LIMITS.contactEmail}
              disabled={busy}
              data-testid="personal-home-contact-email"
              onChange={(event) => setContactEmail(event.target.value)}
              className={INPUT}
            />
            <span className="mt-1 block text-[12px] leading-snug text-neutral-500">{t.contactEmailHint}</span>
          </label>

          <label className="block">
            <span className={LABEL}>{t.writeUp}</span>
            <div className="mt-1 flex flex-wrap items-center gap-1" data-testid="personal-home-writeup-toolbar">
              {(
                [
                  ["bold", t.writeUpBold],
                  ["italic", t.writeUpItalic],
                  ["underline", t.writeUpUnderline],
                ] as const
              ).map(([kind, label]) => (
                <button
                  key={kind}
                  type="button"
                  disabled={busy}
                  onClick={() => applyWriteUpMark(kind)}
                  data-testid={`personal-home-writeup-${kind}`}
                  className={`inline-flex min-h-8 items-center rounded-md border border-neutral-300 bg-white px-2.5 text-[13px] font-semibold text-neutral-800 hover:bg-neutral-50 disabled:opacity-60 ${
                    kind === "bold" ? "font-bold" : kind === "italic" ? "italic" : "underline"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <textarea
              ref={writeUpRef}
              value={writeUp}
              rows={6}
              maxLength={PERSONAL_HOME_LIMITS.writeUp}
              placeholder={defaults.writeUp}
              disabled={busy}
              onChange={(event) => setWriteUp(event.target.value)}
              onKeyDown={onWriteUpKeyDown}
              data-testid="personal-home-writeup-input"
              className={`${INPUT} resize-y leading-relaxed`}
            />
            <span className="mt-1 block text-[12px] leading-snug text-neutral-500">{t.writeUpHint}</span>
            <span className="mt-1 block text-[12px] leading-snug text-neutral-500">{t.writeUpFormatHint}</span>
            {writeUp.trim() ? (
              <div className="mt-3 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2">
                <span className="block text-[12px] font-semibold text-neutral-600">{t.writeUpPreview}</span>
                <PersonalHomeWriteUp
                  text={writeUp}
                  className="mt-1 space-y-2 text-[15px] leading-relaxed text-neutral-900"
                  testId="personal-home-writeup-preview"
                />
              </div>
            ) : null}
          </label>

          <fieldset className="space-y-3">
            <legend className={LABEL}>{t.buttons}</legend>
            <div className="text-[12px] leading-snug text-neutral-500">{t.buttonsHint}</div>
            {buttons.map((button, index) => (
              <div
                key={index}
                className={`space-y-2 rounded-xl border p-3 ${
                  invalid.includes(index) ? "border-red-400 bg-red-50" : "border-neutral-200"
                }`}
              >
                <label className="block">
                  <span className="text-[12px] font-medium text-neutral-600">{t.buttonLabel}</span>
                  <input
                    value={button.label}
                    maxLength={PERSONAL_HOME_LIMITS.buttonLabel}
                    disabled={busy}
                    onChange={(event) =>
                      setButtons((rows) =>
                        rows.map((row, i) => (i === index ? { ...row, label: event.target.value } : row)),
                      )
                    }
                    className={INPUT}
                  />
                </label>
                <div>
                  <span className="text-[12px] font-medium text-neutral-600">{t.buttonOpens}</span>
                  <button
                    type="button"
                    disabled={busy}
                    aria-expanded={openMenu?.index === index && openMenu.which === "opens"}
                    data-testid={index === 0 ? "personal-home-button-opens" : undefined}
                    onClick={() =>
                      setOpenMenu((current) =>
                        current?.index === index && current.which === "opens"
                          ? null
                          : { index, which: "opens" },
                      )
                    }
                    className={`${INPUT} flex items-center justify-between text-left`}
                  >
                    <span>{openLabel(t, button.kind)}</span>
                    <span aria-hidden>▾</span>
                  </button>
                  {openMenu?.index === index && openMenu.which === "opens" ? (
                    <ul
                      role="listbox"
                      data-testid="personal-home-button-opens-menu"
                      className="mt-1 overflow-hidden rounded-lg border border-neutral-200 bg-white"
                    >
                      {openOptions(t, Boolean(homeOpens?.tebHref)).map((option) => (
                        <li key={option.id}>
                          <button
                            type="button"
                            role="option"
                            aria-selected={button.kind === option.id}
                            onClick={() => {
                              setButtons((rows) =>
                                rows.map((row, i) =>
                                  i === index
                                    ? {
                                        ...row,
                                        kind: option.id,
                                        pinId:
                                          option.id === "pin"
                                            ? row.pinId || homeOpens?.pins[0]?.id || ""
                                            : "",
                                      }
                                    : row,
                                ),
                              );
                              setOpenMenu(null);
                            }}
                            className={`block w-full px-3 py-2 text-left text-[15px] hover:bg-neutral-50 ${
                              button.kind === option.id ? "bg-[#046BD9]/10 font-medium" : ""
                            }`}
                          >
                            {option.label}
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
                {button.kind === "link" ? (
                  <label className="block">
                    <span className="text-[12px] font-medium text-neutral-600">{t.buttonLink}</span>
                    <input
                      value={button.href}
                      maxLength={PERSONAL_HOME_LIMITS.buttonHref}
                      disabled={busy}
                      inputMode="url"
                      onChange={(event) =>
                        setButtons((rows) =>
                          rows.map((row, i) => (i === index ? { ...row, href: event.target.value } : row)),
                        )
                      }
                      className={INPUT}
                    />
                  </label>
                ) : null}
                {button.kind === "pin" ? (
                  <div>
                    <span className="text-[12px] font-medium text-neutral-600">{t.choosePin}</span>
                    {homeOpens?.pins.length ? (
                      <>
                        <button
                          type="button"
                          disabled={busy}
                          aria-expanded={openMenu?.index === index && openMenu.which === "pin"}
                          data-testid={index === 0 ? "personal-home-pin-picker" : undefined}
                          onClick={() =>
                            setOpenMenu((current) =>
                              current?.index === index && current.which === "pin"
                                ? null
                                : { index, which: "pin" },
                            )
                          }
                          className={`${INPUT} flex items-center justify-between text-left`}
                        >
                          <span>
                            {homeOpens.pins.find((pin) => pin.id === button.pinId)?.label || t.choosePin}
                          </span>
                          <span aria-hidden>▾</span>
                        </button>
                        {openMenu?.index === index && openMenu.which === "pin" ? (
                          <ul
                            role="listbox"
                            data-testid="personal-home-pin-menu"
                            className="mt-1 max-h-48 overflow-auto rounded-lg border border-neutral-200 bg-white"
                          >
                            {homeOpens.pins.map((pin) => (
                              <li key={pin.id}>
                                <button
                                  type="button"
                                  role="option"
                                  aria-selected={button.pinId === pin.id}
                                  onClick={() => {
                                    setButtons((rows) =>
                                      rows.map((row, i) =>
                                        i === index ? { ...row, pinId: pin.id } : row,
                                      ),
                                    );
                                    setOpenMenu(null);
                                  }}
                                  className={`block w-full px-3 py-2 text-left text-[15px] hover:bg-neutral-50 ${
                                    button.pinId === pin.id ? "bg-[#046BD9]/10 font-medium" : ""
                                  }`}
                                >
                                  {pin.label}
                                </button>
                              </li>
                            ))}
                          </ul>
                        ) : null}
                      </>
                    ) : (
                      <p className="mt-1 text-[12px] leading-snug text-neutral-500">{t.noPins}</p>
                    )}
                  </div>
                ) : null}
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => setButtons((rows) => rows.filter((_, i) => i !== index))}
                  className="text-[13px] font-medium text-red-700 hover:underline disabled:opacity-60"
                >
                  {t.removeButton}
                </button>
              </div>
            ))}
            {buttons.length < PERSONAL_HOME_LIMITS.buttons ? (
              <button
                type="button"
                disabled={busy}
                onClick={() =>
                  setButtons((rows) => [...rows, { label: "", kind: "link", href: "", pinId: "" }])
                }
                className="inline-flex min-h-9 items-center rounded-full border border-neutral-300 px-4 text-[14px] font-medium text-neutral-800 hover:bg-neutral-50 disabled:opacity-60"
              >
                {t.addButton}
              </button>
            ) : null}
          </fieldset>
        </div>

        <div className="space-y-2 border-t border-neutral-200 px-5 py-4">
          {message ? (
            <div
              role="status"
              className={`text-[13px] ${message.tone === "ok" ? "text-emerald-700" : "text-red-700"}`}
            >
              {message.text}
            </div>
          ) : null}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={handleReset}
              className="text-[13px] font-medium text-neutral-600 hover:underline disabled:opacity-60"
            >
              {t.reset}
            </button>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={handleSave}
                data-testid="personal-home-save"
                className="inline-flex min-h-11 items-center rounded-full bg-[#046BD9] px-6 text-[15px] font-semibold text-white shadow-[0_6px_14px_rgba(4,107,217,0.3)] hover:bg-[#0358b3] disabled:opacity-60"
              >
                {saving ? t.saving : t.save}
              </button>
              <button
                type="button"
                onClick={handleClose}
                data-testid="personal-home-close"
                className="inline-flex min-h-11 items-center rounded-full border border-neutral-300 bg-white px-6 text-[15px] font-semibold text-neutral-800 hover:bg-neutral-50"
              >
                {t.close}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
