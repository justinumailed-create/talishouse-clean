import {
  RM22_ASSETS,
  RM22_COVER_HEIGHT,
  RM22_COVER_WIDTH,
  RM22_PAGE_HEIGHT,
  RM22_PAGE_WIDTH,
  planRm22TemplateInteriors,
  type Rm22InteriorPlanItem,
  type Rm22SlotState,
} from "@/lib/talisbooks/rm22-template";

const SANS = 'HelveticaNeue, "Helvetica Neue", Helvetica, Arial, sans-serif';
const SCRIPT = 'Zapfino, "Snell Roundhand", "Apple Chancery", "Segoe Script", cursive';
const HAND = 'Noteworthy, "Bradley Hand", "Segoe Print", cursive';
const ROUNDED = '"Arial Rounded MT Bold", "Varela Round", Arial, sans-serif';

const BAND = "#062806";
const LIME = "#c6de00";

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

async function fileFromHref(href: string, fileName: string): Promise<File> {
  const response = await fetch(href);
  if (!response.ok) {
    throw new Error("Could not load the Talisbook™ template.");
  }
  const blob = await response.blob();
  return new File([blob], fileName, { type: blob.type || "image/jpeg" });
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

function makePage(
  width = RM22_PAGE_WIDTH,
  height = RM22_PAGE_HEIGHT,
): {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
} {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is not available.");
  return { canvas, ctx };
}

async function sourceOrDefault(
  file: File | null,
  href: string,
): Promise<HTMLImageElement> {
  return loadImage(file ?? href);
}

function drawCaptionBar(
  ctx: CanvasRenderingContext2D,
  caption: string,
  options: { x: number; y: number; width: number; height: number },
) {
  ctx.fillStyle = BAND;
  ctx.fillRect(options.x, options.y, options.width, options.height);
  const text = caption.trim();
  if (!text) return;
  ctx.fillStyle = "#ffffff";
  ctx.font = `36px ${HAND}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const lines = wrapLines(ctx, text, options.width - 80);
  const lineHeight = 40;
  const startY = options.y + options.height / 2 - ((lines.length - 1) * lineHeight) / 2;
  lines.forEach((line, index) => {
    ctx.fillText(line, options.x + options.width / 2, startY + index * lineHeight);
  });
  ctx.textAlign = "left";
}

async function composeFront(slots: Rm22SlotState): Promise<HTMLCanvasElement> {
  const { canvas, ctx } = makePage(RM22_COVER_WIDTH, RM22_COVER_HEIGHT);
  const image = await sourceOrDefault(slots.frontImage, RM22_ASSETS.front);
  coverDraw(ctx, image, 0, 0, canvas.width, canvas.height);

  const bandTop = Math.round(canvas.height * 0.62);
  ctx.fillStyle = BAND;
  ctx.fillRect(0, bandTop, canvas.width, canvas.height - bandTop);

  ctx.textAlign = "center";
  ctx.fillStyle = "#ffffff";
  ctx.font = `700 72px ${SANS}`;
  ctx.textBaseline = "top";
  ctx.fillText(slots.frontTitle.trim() || "Property", canvas.width / 2, bandTop + 48);

  ctx.fillStyle = LIME;
  ctx.font = `italic 42px ${SANS}`;
  ctx.fillText(slots.frontSubtitle.trim(), canvas.width / 2, bandTop + 140);

  ctx.fillStyle = "#ffffff";
  ctx.font = `32px ${SANS}`;
  ctx.fillText(slots.frontPriceLine.trim(), canvas.width / 2, bandTop + 210);

  ctx.fillStyle = LIME;
  ctx.font = `italic 22px ${SANS}`;
  const tagLines = wrapLines(ctx, slots.frontTagline.trim(), canvas.width - 80);
  tagLines.forEach((line, index) => {
    ctx.fillText(line, canvas.width / 2, bandTop + 270 + index * 28);
  });
  ctx.textAlign = "left";
  return canvas;
}

async function composeBack(slots: Rm22SlotState): Promise<HTMLCanvasElement> {
  const { canvas, ctx } = makePage(RM22_COVER_WIDTH, RM22_COVER_HEIGHT);
  const image = await sourceOrDefault(slots.backAgentImage, RM22_ASSETS.agent);
  coverDraw(ctx, image, 0, 0, canvas.width, canvas.height);

  const bandTop = Math.round(canvas.height * 0.68);
  const gradient = ctx.createLinearGradient(0, bandTop - 80, 0, canvas.height);
  gradient.addColorStop(0, "rgba(0,0,0,0)");
  gradient.addColorStop(0.35, "rgba(0,0,0,0.55)");
  gradient.addColorStop(1, "rgba(0,0,0,0.82)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, bandTop - 80, canvas.width, canvas.height - bandTop + 80);

  ctx.textAlign = "center";
  ctx.fillStyle = LIME;
  ctx.font = `italic 36px ${SANS}`;
  ctx.textBaseline = "top";
  ctx.fillText(slots.backKicker.trim(), canvas.width / 2, bandTop + 24);

  ctx.fillStyle = "#ffffff";
  ctx.font = `64px ${SCRIPT}`;
  ctx.fillText(slots.agentName.trim() || "Your Name", canvas.width / 2, bandTop + 90);

  if (slots.agentPhone.trim()) {
    ctx.font = `italic 28px ${SANS}`;
    ctx.fillText(
      `Please message me @ ${slots.agentPhone.trim()}`,
      canvas.width / 2,
      bandTop + 190,
    );
  }
  ctx.textAlign = "left";
  return canvas;
}

async function composeTitleCaption(
  item: Rm22InteriorPlanItem,
): Promise<HTMLCanvasElement> {
  const { canvas, ctx } = makePage();
  const image = await sourceOrDefault(item.image, item.assetHref);
  coverDraw(ctx, image, 0, 0, canvas.width, canvas.height);

  const title = item.title?.trim() || "";
  if (title) {
    ctx.fillStyle = "#ffffff";
    ctx.font = `700 92px ${ROUNDED}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText(title, canvas.width / 2, 36);
    ctx.textAlign = "left";
  }

  drawCaptionBar(ctx, item.caption || "", {
    x: 0,
    y: canvas.height - 120,
    width: canvas.width,
    height: 120,
  });
  return canvas;
}

async function composePhotoCaption(
  item: Rm22InteriorPlanItem,
): Promise<HTMLCanvasElement> {
  const { canvas, ctx } = makePage();
  const image = await sourceOrDefault(item.image, item.assetHref);
  coverDraw(ctx, image, 0, 0, canvas.width, canvas.height);
  drawCaptionBar(ctx, item.caption || "", {
    x: 0,
    y: canvas.height - 120,
    width: canvas.width,
    height: 120,
  });
  return canvas;
}

async function composeIntrinsic(
  item: Rm22InteriorPlanItem,
): Promise<HTMLCanvasElement> {
  const { canvas, ctx } = makePage();
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const leftWidth = Math.round(canvas.width * 0.38);
  const image = await sourceOrDefault(item.image, item.assetHref);
  coverDraw(ctx, image, 0, 0, leftWidth, canvas.height);
  drawCaptionBar(ctx, item.caption || "", {
    x: 0,
    y: canvas.height - 110,
    width: leftWidth,
    height: 110,
  });

  const textLeft = leftWidth + 56;
  const textWidth = canvas.width - textLeft - 56;
  ctx.fillStyle = "#111111";
  ctx.textAlign = "center";
  ctx.font = `700 42px ${SANS}`;
  ctx.textBaseline = "top";
  ctx.fillText(item.title?.trim() || "Intrinsic Value", leftWidth + (canvas.width - leftWidth) / 2, 72);

  ctx.textAlign = "left";
  ctx.font = `22px ${SANS}`;
  const body = item.body?.trim() || "";
  const lines = wrapLines(ctx, body, textWidth);
  lines.forEach((line, index) => {
    ctx.fillText(line, textLeft, 150 + index * 28);
  });

  ctx.textAlign = "right";
  ctx.font = `32px ${SANS}`;
  ctx.fillText(item.signoff?.trim() || "", canvas.width - 56, canvas.height - 90);
  ctx.textAlign = "left";
  return canvas;
}

async function composeInterior(item: Rm22InteriorPlanItem): Promise<File> {
  if (item.role === "product-sheet") {
    if (item.image) {
      return new File([item.image], item.fileName, { type: item.image.type || "image/jpeg" });
    }
    return fileFromHref(item.assetHref, item.fileName);
  }
  if (item.role === "intro" || item.role === "outro") {
    return canvasToJpegFile(await composeTitleCaption(item), item.fileName);
  }
  if (item.role === "intrinsic") {
    return canvasToJpegFile(await composeIntrinsic(item), item.fileName);
  }
  return canvasToJpegFile(await composePhotoCaption(item), item.fileName);
}

export async function composeRm22TemplateBook(
  slots: Rm22SlotState,
  onProgress?: (detail: string) => void,
): Promise<{ front: File; back: File; interiors: File[] }> {
  onProgress?.("Composing covers…");
  const front = await canvasToJpegFile(await composeFront(slots), "rm22-front.jpg");
  const back = await canvasToJpegFile(await composeBack(slots), "rm22-back.jpg");

  const plan = planRm22TemplateInteriors(slots);
  const interiors: File[] = [];
  for (const [index, item] of plan.entries()) {
    onProgress?.(`Composing page ${index + 1}…`);
    interiors.push(await composeInterior(item));
  }

  return { front, back, interiors };
}
