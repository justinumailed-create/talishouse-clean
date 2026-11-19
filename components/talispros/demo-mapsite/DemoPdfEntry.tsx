"use client";

import { useRef, useState } from "react";
import { createDemoMapSiteAction } from "@/app/talispros/demo-mapsite/actions";
import DemoEbookGenerateClient from "@/components/talispros/demo-mapsite/DemoEbookGenerateClient";
import { BUILD_MAPSITE_PREVIEW_LOCATION } from "@/components/build-mapsite/home-pin-types";
import { EBOOK_UPLOAD_ACCEPT } from "@/lib/talisbooks/ebook-upload-formats";
import { SELF_SERVICE_MAX_UPLOAD_IMAGES } from "@/lib/talisbooks/self-service-page-plan";
import { useT } from "@/lib/i18n/client";
import { NSNC_PDF_FILE_NAME, NSNC_PDF_PATH } from "@/lib/talispros/nsnc-book";
import { TALISU_MKTS_HEADER_BLUE } from "@/lib/talisu/markets-pins";

function titleFromFile(file: File | undefined): string {
  const raw = file?.name?.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").trim() || "";
  return raw.slice(0, 120) || "Demo Mapsite";
}

/**
 * Primary PDF entry on /demo. The file uses the same build as the ebook page,
 * then the attach-or-keep choice. The Demo Mapsites panel stays on the page.
 */
export default function DemoPdfEntry() {
  const copy = useT().demo.pdfEntry;
  const sampleCopy = useT().demo.downloadSamplePdf;
  const help = useT().demo.ebookPage.uploadHelp.replace(
    "{max}",
    String(SELF_SERVICE_MAX_UPLOAD_IMAGES),
  );
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [job, setJob] = useState<{
    mapsiteId: string;
    fastCode: string;
    title: string;
    files: File[];
  } | null>(null);

  async function start(files: File[]) {
    if (files.length === 0 || pending) return;
    setError(null);
    setPending(true);
    const title = titleFromFile(files[0]);
    const formData = new FormData();
    formData.set("propertyTitle", title);
    formData.set("streetAddress", "");
    formData.set("description", "");
    formData.set("latitude", String(BUILD_MAPSITE_PREVIEW_LOCATION.latitude));
    formData.set("longitude", String(BUILD_MAPSITE_PREVIEW_LOCATION.longitude));
    formData.set("mapZoom", String(BUILD_MAPSITE_PREVIEW_LOCATION.mapZoom));
    const result = await createDemoMapSiteAction(formData);
    setPending(false);
    if (!result.ok) {
      setError(result.error || copy.error);
      return;
    }
    setJob({
      mapsiteId: result.mapsiteId,
      fastCode: result.code,
      title,
      files,
    });
  }

  return (
    <section
      className="mb-4 rounded-[20px] bg-white px-5 py-5 shadow-[0_1px_2px_rgba(0,0,0,0.05),0_12px_32px_rgba(0,0,0,0.08)] sm:px-8 sm:py-6"
      data-testid="demo-pdf-upload"
      aria-labelledby="demo-pdf-upload-title"
    >
      {job ? (
        <DemoEbookGenerateClient
          compact
          inlineFinish
          pendingFiles={job.files}
          mapsiteId={job.mapsiteId}
          fastCode={job.fastCode}
          title={job.title}
        />
      ) : (
        <>
          <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-neutral-500">
            Tsplits™
          </p>
          <h2
            id="demo-pdf-upload-title"
            className="mt-2 text-[24px] font-semibold leading-tight tracking-[-0.02em] text-neutral-950 sm:text-[30px]"
          >
            {copy.title}
          </h2>
          <p className="mt-2 max-w-[40rem] text-[15px] leading-relaxed text-neutral-600">{copy.hint}</p>
          <button
            type="button"
            data-testid="demo-pdf-upload-button"
            disabled={pending}
            onClick={() => inputRef.current?.click()}
            className="mt-4 inline-flex h-12 w-full items-center justify-center rounded-full px-8 text-[16px] font-semibold text-white transition hover:brightness-95 disabled:opacity-50 sm:w-auto"
            style={{ backgroundColor: TALISU_MKTS_HEADER_BLUE }}
          >
            {pending ? copy.starting : copy.button}
          </button>
          <p className="mt-3 text-[13px] leading-relaxed text-neutral-500">{help}</p>
          <a
            href={NSNC_PDF_PATH}
            download={NSNC_PDF_FILE_NAME}
            data-testid="demo-sample-pdf-download"
            className="mt-2 inline-block text-[13px] font-semibold text-[#046BD9] underline-offset-2 hover:underline"
          >
            {sampleCopy}
          </a>
          {error ? (
            <p role="alert" className="mt-3 text-[13px] leading-relaxed text-red-600">
              {error}
            </p>
          ) : null}
          <input
            ref={inputRef}
            type="file"
            accept={EBOOK_UPLOAD_ACCEPT}
            className="sr-only"
            data-testid="demo-pdf-upload-input"
            onChange={(event) => {
              const files = event.target.files ? Array.from(event.target.files) : [];
              event.target.value = "";
              void start(files);
            }}
          />
        </>
      )}
    </section>
  );
}
