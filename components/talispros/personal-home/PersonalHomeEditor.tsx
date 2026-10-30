"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useT } from "@/lib/i18n/client";
import { optimizeImageFileForUpload } from "@/lib/media/client-optimize-upload-image";
import {
  PERSONAL_HOME_LIMITS,
  PERSONAL_HOME_OPEN_EDITOR_EVENT,
  type PersonalHomeButton,
  type PersonalHomeContent,
  type PersonalHomeDefaults,
} from "@/lib/talispros/personal-home";
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
};

type ButtonDraft = { label: string; href: string };

const INPUT =
  "mt-1 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-[15px] text-neutral-900 outline-none focus:border-[#046BD9] focus:ring-2 focus:ring-[#046BD9]/20 disabled:opacity-60";
const LABEL = "block text-[13px] font-semibold text-neutral-700";

function toDrafts(buttons: PersonalHomeButton[]): ButtonDraft[] {
  return buttons.map((button) => ({ label: button.label, href: button.href }));
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
}: PersonalHomeEditorProps) {
  const { personalHome } = useT();
  const t = personalHome.edit;
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(initialOpen);

  useEffect(() => {
    const openEditor = () => setOpen(true);
    window.addEventListener(PERSONAL_HOME_OPEN_EDITOR_EVENT, openEditor);
    return () => window.removeEventListener(PERSONAL_HOME_OPEN_EDITOR_EVENT, openEditor);
  }, []);
  const [pending, startTransition] = useTransition();
  const [uploading, setUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(saved.imageUrl);
  const [kicker, setKicker] = useState(saved.kicker ?? "");
  const [headline, setHeadline] = useState(saved.headline ?? "");
  const [writeUp, setWriteUp] = useState(saved.writeUp ?? "");
  const [buttons, setButtons] = useState<ButtonDraft[]>(
    toDrafts(saved.buttons.length ? saved.buttons : defaults.buttons),
  );
  const [invalid, setInvalid] = useState<number[]>([]);
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(
    null,
  );

  function errorText(error: PersonalHomeActionError | string): string {
    if (error === "auth") return t.errAuth;
    if (error === "buttons") return t.errButtons;
    if (error === "photo") return t.errPhoto;
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

  function handleSave() {
    setMessage(null);
    setInvalid([]);
    startTransition(async () => {
      const result = await savePersonalHomeAction({
        fastCode,
        imageUrl,
        kicker,
        headline,
        writeUp,
        buttons,
      });
      if (!result.ok) {
        setInvalid(result.invalidButtons ?? []);
        setMessage({ tone: "error", text: errorText(result.error) });
        return;
      }
      setMessage({ tone: "ok", text: t.saved });
      router.refresh();
    });
  }

  function handleReset() {
    if (!window.confirm(t.resetConfirm)) return;
    setMessage(null);
    setInvalid([]);
    startTransition(async () => {
      const result = await resetPersonalHomeAction({ fastCode });
      if (!result.ok) {
        setMessage({ tone: "error", text: errorText(result.error) });
        return;
      }
      setImageUrl(null);
      setKicker("");
      setHeadline("");
      setWriteUp("");
      setButtons(toDrafts(defaults.buttons));
      setMessage({ tone: "ok", text: t.saved });
      router.refresh();
    });
  }

  const busy = pending || uploading;
  const previewSrc = imageUrl || defaults.imageUrl;

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        data-testid="personal-home-edit-open"
        className="fixed bottom-4 right-4 z-50 inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-neutral-950 px-5 py-2 text-[14px] font-semibold text-white shadow-[0_8px_20px_rgba(0,0,0,0.25)] transition hover:bg-neutral-800 sm:bottom-6 sm:right-6"
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
        <div className="flex items-start justify-between gap-3 border-b border-neutral-200 px-5 py-4">
          <div>
            <h2
              id="personal-home-edit-title"
              className="m-0! text-[18px] font-semibold text-neutral-950!"
            >
              {t.title}
            </h2>
            <div className="mt-1 text-[13px] leading-snug text-neutral-600">{t.intro}</div>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-md px-2 py-1 text-[14px] font-medium text-neutral-600 hover:bg-neutral-100"
          >
            {t.close}
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
          <div className="text-[13px] text-neutral-500">{t.defaultHint}</div>

          <div>
            <div className={LABEL}>{t.photo}</div>
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
          </label>

          <label className="block">
            <span className={LABEL}>{t.headline}</span>
            <input
              value={headline}
              maxLength={PERSONAL_HOME_LIMITS.headline}
              placeholder={defaults.headline}
              disabled={busy}
              onChange={(event) => setHeadline(event.target.value)}
              className={INPUT}
            />
          </label>

          <label className="block">
            <span className={LABEL}>{t.writeUp}</span>
            <textarea
              value={writeUp}
              rows={6}
              maxLength={PERSONAL_HOME_LIMITS.writeUp}
              placeholder={defaults.writeUp}
              disabled={busy}
              onChange={(event) => setWriteUp(event.target.value)}
              className={`${INPUT} resize-y leading-relaxed`}
            />
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
                onClick={() => setButtons((rows) => [...rows, { label: "", href: "" }])}
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
            <button
              type="button"
              disabled={busy}
              onClick={handleSave}
              data-testid="personal-home-save"
              className="inline-flex min-h-11 items-center rounded-full bg-[#046BD9] px-6 text-[15px] font-semibold text-white shadow-[0_6px_14px_rgba(4,107,217,0.3)] hover:bg-[#0358b3] disabled:opacity-60"
            >
              {pending ? t.saving : t.save}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
