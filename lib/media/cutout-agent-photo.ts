import { agentPhotoProxyHref } from "@/lib/mapsite/agent-photo-url";
import {
  normalizePersonMask,
  personBoundingBox,
} from "@/lib/media/agent-photo-cutout";

const MEDIAPIPE_VERSION = "1.0.1";
const WASM_BASE = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${MEDIAPIPE_VERSION}/wasm`;
const SELFIE_MODEL =
  "https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_segmenter/float16/latest/selfie_segmenter.tflite";
const VISION_MODULE = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${MEDIAPIPE_VERSION}/vision_bundle.mjs`;

type CategoryMask = {
  width: number;
  height: number;
  getAsUint8Array: () => Uint8Array;
};

type ImageSegmenter = {
  segment: (image: HTMLImageElement) => { categoryMask?: CategoryMask };
};

type VisionModule = {
  FilesetResolver: {
    forVisionTasks: (base: string) => Promise<unknown>;
  };
  ImageSegmenter: {
    createFromOptions: (
      fileset: unknown,
      options: Record<string, unknown>,
    ) => Promise<ImageSegmenter>;
  };
};

const cutoutCache = new Map<string, Promise<string | null>>();
let segmenterPromise: Promise<ImageSegmenter> | null = null;

async function loadVision(): Promise<VisionModule> {
  const importer = new Function(
    "url",
    "return import(url)",
  ) as (url: string) => Promise<VisionModule>;
  return importer(VISION_MODULE);
}

function createSegmenter(
  vision: VisionModule,
  delegate: "GPU" | "CPU",
): Promise<ImageSegmenter> {
  return vision.FilesetResolver.forVisionTasks(WASM_BASE).then((fileset) =>
    vision.ImageSegmenter.createFromOptions(fileset, {
      baseOptions: {
        modelAssetPath: SELFIE_MODEL,
        delegate,
      },
      runningMode: "IMAGE",
      outputCategoryMask: true,
      outputConfidenceMasks: false,
    }),
  );
}

function getSegmenter(): Promise<ImageSegmenter> {
  if (!segmenterPromise) {
    segmenterPromise = loadVision().then((vision) =>
      createSegmenter(vision, "GPU").catch(() => createSegmenter(vision, "CPU")),
    );
  }
  return segmenterPromise;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Unable to load agent photo."));
    image.src = src;
  });
}

async function renderCutout(image: HTMLImageElement): Promise<string | null> {
  const segmenter = await getSegmenter();
  const result = segmenter.segment(image);
  const categoryMask = result.categoryMask;
  if (!categoryMask) return null;

  const mask = normalizePersonMask(new Uint8Array(categoryMask.getAsUint8Array()));
  const maskWidth = categoryMask.width;
  const maskHeight = categoryMask.height;
  const box = personBoundingBox(mask, maskWidth, maskHeight);
  if (!box) return null;

  const sourceWidth = image.naturalWidth || image.width;
  const sourceHeight = image.naturalHeight || image.height;
  if (!sourceWidth || !sourceHeight) return null;

  // Keep the full frame so the person is not zoom-cropped. Only the
  // background (mask == 0) is cleared; the subject stays intact.
  const canvas = document.createElement("canvas");
  canvas.width = sourceWidth;
  canvas.height = sourceHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  ctx.drawImage(image, 0, 0, sourceWidth, sourceHeight);

  const pixels = ctx.getImageData(0, 0, sourceWidth, sourceHeight);
  const data = pixels.data;
  for (let y = 0; y < sourceHeight; y += 1) {
    const maskY = Math.min(
      maskHeight - 1,
      Math.max(0, Math.round((y * maskHeight) / sourceHeight)),
    );
    for (let x = 0; x < sourceWidth; x += 1) {
      const maskX = Math.min(
        maskWidth - 1,
        Math.max(0, Math.round((x * maskWidth) / sourceWidth)),
      );
      if ((mask[maskY * maskWidth + maskX] ?? 0) === 0) {
        data[(y * sourceWidth + x) * 4 + 3] = 0;
      }
    }
  }
  ctx.putImageData(pixels, 0, 0);

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(blob ? URL.createObjectURL(blob) : null);
    }, "image/png");
  });
}

export function cutoutAgentPhoto(sourceUrl: string): Promise<string | null> {
  const proxied = agentPhotoProxyHref(sourceUrl);
  const cached = cutoutCache.get(proxied);
  if (cached) return cached;

  const pending = loadImage(proxied)
    .then(renderCutout)
    .catch(() => null);
  cutoutCache.set(proxied, pending);
  return pending;
}
