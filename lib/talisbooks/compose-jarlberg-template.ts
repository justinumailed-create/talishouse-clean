import { splitWrapCoverImageFile } from "@/lib/talisbooks/pdf-pages-to-images";
import {
  JARLBERG_ASSETS,
  JARLBERG_DEFAULT_COPY,
  JARLBERG_DOME_PLACE,
  JARLBERG_LIME,
  JARLBERG_PAGE_HEIGHT,
  JARLBERG_PAGE_WIDTH,
  jarlbergInteriorHref,
  type JarlbergPin,
  type JarlbergSlotState,
} from "@/lib/talisbooks/jarlberg-template";

const SANS = 'HelveticaNeue, "Helvetica Neue", Helvetica, Arial, sans-serif';
const SCRIPT = 'Zapfino, "Snell Roundhand", "Apple Chancery", "Segoe Script", cursive';
const HAND = 'Noteworthy, "Bradley Hand", "Segoe Print", cursive';
const CONDENSED =
  '"Avenir Next Condensed", "Helvetica Neue Condensed", "Arial Narrow", sans-serif';
const ROUNDED = '"Arial Rounded MT Bold", "Varela Round", Arial, sans-serif';

async function loadImage(src: string | File): Promise<HTMLImageElement> {
  const url = typeof src === "string" ? src : URL.createObjectURL(src);
  try {
    const image = new Image();
    image.crossOrigin = "anonymous";
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error("Could not load a template image."));
      image.src = url;
    });
    return image;
  } finally {
    if (typeof src !== "string") URL.revokeObjectURL(url);
  }
}

function canvasToJpegFile(canvas: HTMLCanvasElement, fileName: string): Promise<File> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Could not export a template page."));
          return;
        }
        resolve(new File([blob], fileName, { type: "image/jpeg" }));
      },
      "image/jpeg",
      0.92,
    );
  });
}

function coverDraw(
  ctx: CanvasRenderingContext2D,
  image: CanvasImageSource,
  dx: number,
  dy: number,
  dw: number,
  dh: number,
) {
  const iw =
    "naturalWidth" in image
      ? (image as HTMLImageElement).naturalWidth || (image as HTMLImageElement).width
      : (image as HTMLCanvasElement).width;
  const ih =
    "naturalHeight" in image
      ? (image as HTMLImageElement).naturalHeight || (image as HTMLImageElement).height
      : (image as HTMLCanvasElement).height;
  if (!iw || !ih) return;
  const scale = Math.max(dw / iw, dh / ih);
  const sw = dw / scale;
  const sh = dh / scale;
  const sx = (iw - sw) / 2;
  const sy = (ih - sh) / 2;
  ctx.drawImage(image, sx, sy, sw, sh, dx, dy, dw, dh);
}

function wrapLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] {
  const paragraphs = text.replace(/\r/g, "").split("\n");
  const lines: string[] = [];
  for (const paragraph of paragraphs) {
    const words = paragraph.trim().split(/\s+/).filter(Boolean);
    if (words.length === 0) {
      lines.push("");
      continue;
    }
    let current = words[0] ?? "";
    for (const word of words.slice(1)) {
      const next = `${current} ${word}`;
      if (ctx.measureText(next).width <= maxWidth) current = next;
      else {
        lines.push(current);
        current = word;
      }
    }
    lines.push(current);
  }
  return lines;
}

async function sourceOrDefault(
  file: File | null,
  href: string,
): Promise<HTMLImageElement> {
  return loadImage(file ?? href);
}

function makePage(): {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
} {
  const canvas = document.createElement("canvas");
  canvas.width = JARLBERG_PAGE_WIDTH;
  canvas.height = JARLBERG_PAGE_HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is not available.");
  return { canvas, ctx };
}

async function composeWrap(slots: JarlbergSlotState): Promise<HTMLCanvasElement> {
  const { canvas, ctx } = makePage();
  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const front = await sourceOrDefault(slots.frontImage, JARLBERG_ASSETS.front);
  coverDraw(ctx, front, 960, 0, 960, 1080);

  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  const titleLines = slots.frontTitle.split("\n").filter((line) => line.length > 0);
  titleLines.forEach((line, index) => {
    const first = index === 0 && titleLines.length > 1;
    ctx.font = first ? `50px ${SANS}` : `700 88px ${SANS}`;
    ctx.fillText(line, 1440, 710 + index * (first ? 70 : 96));
  });

  ctx.fillStyle = JARLBERG_LIME;
  ctx.font = `italic 32px ${SANS}`;
  ctx.textAlign = "center";
  ctx.fillText(slots.broughtBy, 480, 168);

  ctx.fillStyle = "#ffffff";
  ctx.font = `80px ${SCRIPT}`;
  ctx.fillText(slots.agentName, 480, 300);

  ctx.font = `italic 50px ${SANS}`;
  ctx.fillText(slots.agentPhone, 480, 530);

  const agent = await sourceOrDefault(slots.backAgentImage, JARLBERG_ASSETS.agent);
  coverDraw(ctx, agent, 479, 599, 480, 480);

  ctx.textAlign = "left";
  return canvas;
}

async function composeMapDome(
  slots: JarlbergSlotState,
  pin: JarlbergPin | null,
): Promise<HTMLCanvasElement> {
  const { canvas, ctx } = makePage();
  let mapSrc: string | File = JARLBERG_ASSETS.mapDefault;
  if (pin) {
    mapSrc = `/api/talispros/ebook-map-background?lat=${encodeURIComponent(
      String(pin.latitude),
    )}&lng=${encodeURIComponent(String(pin.longitude))}`;
  }
  try {
    const map = await loadImage(mapSrc);
    coverDraw(ctx, map, 0, 0, canvas.width, canvas.height);
  } catch {
    const fallback = await loadImage(JARLBERG_ASSETS.mapDefault);
    coverDraw(ctx, fallback, 0, 0, canvas.width, canvas.height);
  }

  if (pin) {
    const x = canvas.width / 2;
    const y = canvas.height / 2;
    ctx.fillStyle = "#e11d48";
    ctx.beginPath();
    ctx.arc(x, y - 18, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x, y + 16);
    ctx.lineTo(x - 12, y - 8);
    ctx.lineTo(x + 12, y - 8);
    ctx.closePath();
    ctx.fill();
  }

  const dome = await loadImage(JARLBERG_ASSETS.dome);
  ctx.drawImage(
    dome,
    JARLBERG_DOME_PLACE.x * canvas.width,
    JARLBERG_DOME_PLACE.y * canvas.height,
    JARLBERG_DOME_PLACE.w * canvas.width,
    JARLBERG_DOME_PLACE.h * canvas.height,
  );

  ctx.fillStyle = "#ffffff";
  ctx.font = `80px ${CONDENSED}`;
  ctx.textBaseline = "top";
  ctx.fillText(slots.welcomeTitle, 49, 16);
  return canvas;
}

async function composePhotoCaption(
  imageSrc: string | File,
  caption: string,
): Promise<HTMLCanvasElement> {
  const { canvas, ctx } = makePage();
  const image = await loadImage(imageSrc);
  coverDraw(ctx, image, 0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "rgba(0,0,0,0.28)";
  ctx.fillRect(0, 960, canvas.width, 120);
  ctx.fillStyle = "#ffffff";
  ctx.font = `37px ${HAND}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const lines = wrapLines(ctx, caption, 1700);
  const lineHeight = 42;
  const startY = 1020 - ((lines.length - 1) * lineHeight) / 2;
  lines.forEach((line, index) => ctx.fillText(line, 960, startY + index * lineHeight));
  ctx.textAlign = "left";
  return canvas;
}

async function composeFourUp(
  slots: JarlbergSlotState,
): Promise<HTMLCanvasElement> {
  const { canvas, ctx } = makePage();
  const sources = JARLBERG_ASSETS.neighbours.map(
    (href, index) => slots.neighbourImages[index] ?? href,
  );
  const images = await Promise.all(sources.map((src) => loadImage(src)));
  const boxes = [
    [0, 0],
    [960, 0],
    [0, 540],
    [960, 540],
  ] as const;
  images.forEach((image, index) => {
    const box = boxes[index];
    if (!box) return;
    coverDraw(ctx, image, box[0], box[1], 960, 540);
  });
  ctx.fillStyle = "rgba(0,0,0,0.62)";
  const pillW = 420;
  const pillH = 64;
  const x = (canvas.width - pillW) / 2;
  const y = (canvas.height - pillH) / 2;
  ctx.beginPath();
  if (typeof ctx.roundRect === "function") {
    ctx.roundRect(x, y, pillW, pillH, 18);
  } else {
    ctx.rect(x, y, pillW, pillH);
  }
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.font = `37px ${HAND}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(slots.neighboursTitle, canvas.width / 2, canvas.height / 2);
  ctx.textAlign = "left";
  return canvas;
}

async function composeSplitCopy(
  slots: JarlbergSlotState,
): Promise<HTMLCanvasElement> {
  const { canvas, ctx } = makePage();
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const image = await sourceOrDefault(slots.investorImage, JARLBERG_ASSETS.investor);
  coverDraw(ctx, image, 0, 0, 960, 1080);

  ctx.fillStyle = "#111111";
  ctx.textAlign = "center";
  ctx.font = `48px ${SANS}`;
  ctx.textBaseline = "top";
  ctx.fillText(slots.investorTitle, 1440, 90);

  ctx.textAlign = "left";
  ctx.font = `22px ${SANS}`;
  const lines = wrapLines(ctx, slots.investorBody, 790);
  lines.forEach((line, index) => {
    ctx.fillText(line, 1032, 171 + index * 28);
  });

  ctx.textAlign = "right";
  ctx.font = `32px ${SANS}`;
  ctx.fillText(slots.investorSignoff, 1849, 952);
  ctx.textAlign = "left";
  return canvas;
}

async function composeParting(
  slots: JarlbergSlotState,
): Promise<HTMLCanvasElement> {
  const { canvas, ctx } = makePage();
  const image = await sourceOrDefault(
    slots.partingImage,
    jarlbergInteriorHref(11),
  );
  coverDraw(ctx, image, 0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.font = `137px ${ROUNDED}`;
  ctx.textBaseline = "top";
  ctx.fillText(slots.partingTitle, 960, 8);
  ctx.font = `72px ${HAND}`;
  ctx.textBaseline = "alphabetic";
  ctx.fillText(slots.partingCaption, 960, 1048);
  ctx.textAlign = "left";
  return canvas;
}

export async function composeJarlbergTemplateBook(
  slots: JarlbergSlotState,
  pin: JarlbergPin | null,
  onProgress?: (detail: string) => void,
): Promise<{ front: File; back: File; interiors: File[] }> {
  onProgress?.("Composing wrap cover…");
  const wrapCanvas = await composeWrap(slots);
  const wrapFile = await canvasToJpegFile(wrapCanvas, "jarlberg-wrap.jpg");
  const { front, back } = await splitWrapCoverImageFile(wrapFile);

  const interiors: File[] = [];
  onProgress?.("Composing page 1…");
  interiors.push(
    await canvasToJpegFile(await composeMapDome(slots, pin), "interior-01.jpg"),
  );

  for (let i = 0; i < 7; i += 1) {
    const page = i + 2;
    onProgress?.(`Composing page ${page}…`);
    const src = slots.photoImages[i] ?? jarlbergInteriorHref(page);
    const caption =
      slots.photoCaptions[i] ?? JARLBERG_DEFAULT_COPY.photoCaptions[i] ?? "";
    interiors.push(
      await canvasToJpegFile(
        await composePhotoCaption(src, caption),
        `interior-${String(page).padStart(2, "0")}.jpg`,
      ),
    );
  }

  onProgress?.("Composing page 9…");
  interiors.push(await canvasToJpegFile(await composeFourUp(slots), "interior-09.jpg"));
  onProgress?.("Composing page 10…");
  interiors.push(
    await canvasToJpegFile(await composeSplitCopy(slots), "interior-10.jpg"),
  );
  onProgress?.("Composing page 11…");
  interiors.push(await canvasToJpegFile(await composeParting(slots), "interior-11.jpg"));

  return { front, back, interiors };
}
