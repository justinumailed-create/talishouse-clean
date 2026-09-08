import { agentPhotoProxyHref } from "@/lib/mapsite/agent-photo-url";
import {
  normalizePersonMask,
  personBoundingBox,
  zoomedCropRect,
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
  const scaleX = sourceWidth / maskWidth;
  const scaleY = sourceHeight / maskHeight;
  const crop = zoomedCropRect(
    {
      x: Math.round(box.x * scaleX),
      y: Math.round(box.y * scaleY),
      width: Math.round(box.width * scaleX),
      height: Math.round(box.height * scaleY),
    },
    sourceWidth,
    sourceHeight,
    { padding: 0.08, zoom: 1.32 },
  );

  const canvas = document.createElement("canvas");
  canvas.width = crop.width;
  canvas.height = crop.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  ctx.drawImage(
    image,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    0,
    0,
    crop.width,
    crop.height,
  );

  const pixels = ctx.getImageData(0, 0, crop.width, crop.height);
  const data = pixels.data;
  for (let y = 0; y < crop.height; y += 1) {
    const maskY = Math.min(
      maskHeight - 1,
      Math.max(0, Math.round((crop.y + y) / scaleY)),
    );
    for (let x = 0; x < crop.width; x += 1) {
      const maskX = Math.min(
        maskWidth - 1,
        Math.max(0, Math.round((crop.x + x) / scaleX)),
      );
      if ((mask[maskY * maskWidth + maskX] ?? 0) === 0) {
        data[(y * crop.width + x) * 4 + 3] = 0;
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
