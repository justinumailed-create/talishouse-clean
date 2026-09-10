import {
  PINNED_TALISBOOK_INTERIOR_PAGE_COUNT,
  PINNED_TALISBOOK_PDF_FILE_NAME,
  PINNED_TALISBOOK_PDF_PATH,
  pinnedTalisBookInteriorAssets,
  pinnedTalisBookInteriorPageHref,
} from "@/lib/talisbooks/library/pinned-catalog";

const PAGE_FETCH_TIMEOUT_MS = 15_000;

export async function fetchWithTimeout(
  input: RequestInfo | URL,
  init: RequestInit | undefined,
  timeoutMs: number,
  fetchImpl: typeof fetch = fetch,
): Promise<Response> {
  const controller = new AbortController();
  return await new Promise<Response>((resolve, reject) => {
    const timer = setTimeout(() => {
      controller.abort();
      reject(new DOMException("Timed out.", "AbortError"));
    }, timeoutMs);
    void fetchImpl(input, {
      ...init,
      signal: init?.signal ?? controller.signal,
    }).then(
      (response) => {
        clearTimeout(timer);
        resolve(response);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

async function fileFromResponse(
  response: Response,
  fileName: string,
  mimeType: string,
): Promise<File> {
  if (!response.ok) {
    throw new Error(`Could not load ${fileName}.`);
  }
  const blob = await response.blob();
  if (blob.size === 0) {
    throw new Error(`Could not load ${fileName}.`);
  }
  return new File([blob], fileName, {
    type: blob.type || mimeType,
  });
}

/**
 * Load the already-rasterized pinned PDF interiors.
 * These are the same /talisbooks/pinned/pages/page-NN.jpg assets the
 * demonstration viewer uses, so extract cannot hang on a PDF.js worker.
 */
export async function loadPinnedTalisBookPageFiles(options?: {
  onProgress?: (done: number, total: number) => void;
  fetchImpl?: typeof fetch;
}): Promise<File[]> {
  const fetchImpl = options?.fetchImpl ?? fetch;
  const total = PINNED_TALISBOOK_INTERIOR_PAGE_COUNT;
  const pages: File[] = [];

  for (let index = 1; index <= total; index += 1) {
    const href = pinnedTalisBookInteriorPageHref(index);
    const fileName = `page-${String(index).padStart(2, "0")}.jpg`;
    let response: Response;
    try {
      response = await fetchWithTimeout(
        href,
        { cache: "force-cache" },
        PAGE_FETCH_TIMEOUT_MS,
        fetchImpl,
      );
    } catch {
      throw new Error(`Could not load ${fileName}.`);
    }
    pages.push(await fileFromResponse(response, fileName, "image/jpeg"));
    options?.onProgress?.(index, total);
  }

  if (pages.length === 0) {
    throw new Error("No pages were extracted from the pinned PDF.");
  }
  return pages;
}

export async function loadPinnedTalisBookPdfFile(options?: {
  fetchImpl?: typeof fetch;
}): Promise<File> {
  const fetchImpl = options?.fetchImpl ?? fetch;
  let response: Response;
  try {
    response = await fetchWithTimeout(
      PINNED_TALISBOOK_PDF_PATH,
      undefined,
      PAGE_FETCH_TIMEOUT_MS,
      fetchImpl,
    );
  } catch {
    throw new Error("Could not load the pinned Talispros eBook PDF.");
  }
  return fileFromResponse(
    response,
    PINNED_TALISBOOK_PDF_FILE_NAME,
    "application/pdf",
  );
}

export function fallbackOptimizedDemoPages(
  count = PINNED_TALISBOOK_INTERIOR_PAGE_COUNT,
) {
  return pinnedTalisBookInteriorAssets().slice(0, Math.max(0, count));
}
