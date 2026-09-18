import { mapsiteAgencyLogoUrl } from "@/lib/talispros/mapsite-listing-media";
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
import {
  RM22_BLEED_CAPTION,
  RM22_BLEED_IMAGE,
  RM22_BLEED_TITLE,
  RM22_COLOR,
  RM22_INTRINSIC_BODY,
  RM22_INTRINSIC_CAPTION,
  RM22_INTRINSIC_IMAGE,
  RM22_INTRINSIC_SIGNOFF,
  RM22_INTRINSIC_TITLE,
  RM22_TYPE,
  type Rm22Box,
} from "@/lib/talisbooks/rm22-layout";

const SANS = RM22_TYPE.sans;
const HAND = RM22_TYPE.hand;
const ROUNDED = RM22_TYPE.rounded;

const CAPTION_OVERLAY = RM22_COLOR.captionOverlay;
const LIME = RM22_COLOR.lime;

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

function imageSize(image: CanvasImageSource): { iw: number; ih: number } {
  const iw =
    "naturalWidth" in image
      ? (image as HTMLImageElement).naturalWidth || (image as HTMLImageElement).width
      : (image as CanvasImageSource as HTMLCanvasElement).width;
  const ih =
    "naturalHeight" in image
      ? (image as HTMLImageElement).naturalHeight || (image as HTMLImageElement).height
      : (image as CanvasImageSource as HTMLCanvasElement).height;
  return { iw, ih };
}

function coverDraw(
  ctx: CanvasRenderingContext2D,
  image: CanvasImageSource,
  dx: number,
  dy: number,
  dw: number,
  dh: number,
  alignY: "center" | "top" = "center",
) {
  const { iw, ih } = imageSize(image);
  if (!iw || !ih) return;
  const scale = Math.max(dw / iw, dh / ih);
  const sw = dw / scale;
  const sh = dh / scale;
  const sx = (iw - sw) / 2;
  const sy = alignY === "top" ? 0 : (ih - sh) / 2;
  ctx.drawImage(image, sx, sy, sw, sh, dx, dy, dw, dh);
}

function containDraw(
  ctx: CanvasRenderingContext2D,
  image: CanvasImageSource,
  dx: number,
  dy: number,
  dw: number,
  dh: number,
) {
  const { iw, ih } = imageSize(image);
  if (!iw || !ih) return;
  const scale = Math.min(dw / iw, dh / ih);
  const tw = iw * scale;
  const th = ih * scale;
  ctx.drawImage(image, dx + (dw - tw) / 2, dy + (dh - th) / 2, tw, th);
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

async function loadPhoto(
  file: File | null,
  url?: string | null,
): Promise<HTMLImageElement | null> {
  if (file) return loadImage(file);
  const href = url?.trim() || "";
  if (href) return loadImage(href);
  return null;
}

function fitSingleLine(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  style: {
    italic?: boolean;
    weight?: string;
    start: number;
    min: number;
    family: string;
  },
): number {
  let size = style.start;
  const prefix = `${style.italic ? "italic " : ""}${style.weight ? `${style.weight} ` : ""}`;
  while (size > style.min) {
    ctx.font = `${prefix}${size}px ${style.family}`;
    if (ctx.measureText(text).width <= maxWidth) return size;
    size -= 1;
  }
  ctx.font = `${prefix}${style.min}px ${style.family}`;
  return style.min;
}

function fillImageSlot(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement | null,
  box: Rm22Box,
  fit: "cover" | "contain" = "cover",
  emptyColor: string = RM22_COLOR.lime,
) {
  ctx.fillStyle = emptyColor;
  ctx.fillRect(box.x, box.y, box.width, box.height);
  if (!image) return;
  if (fit === "contain") {
    containDraw(ctx, image, box.x, box.y, box.width, box.height);
    return;
  }
  coverDraw(ctx, image, box.x, box.y, box.width, box.height);
}

function drawCaptionBar(
  ctx: CanvasRenderingContext2D,
  caption: string,
  options: { x: number; y: number; width: number; height: number },
) {
  ctx.fillStyle = CAPTION_OVERLAY;
  ctx.fillRect(options.x, options.y, options.width, options.height);
  const text = caption.trim();
  if (!text) return;
  ctx.fillStyle = RM22_COLOR.caption;
  ctx.font = `36px ${HAND}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  const lines = wrapLines(ctx, text, options.width - 80);
  const lineHeight = 48;
  const baseline =
    options.y + options.height / 2 + 10 - ((lines.length - 1) * lineHeight) / 2;
  lines.forEach((line, index) => {
    ctx.fillText(line, options.x + options.width / 2, baseline + index * lineHeight);
  });
  ctx.textAlign = "left";
}

/**
 * Self-serve front cover caption (raster baked at generate time).
 *
 * Existing live books keep their previous cover art until regenerated:
 *   LG02  /talisbooks/viewer/lg02-lg02-talisbook-4jmz
 *   RM22  /talisbooks/viewer/rm22-rm22-talisbook-b1mz
 */
async function composeFront(slots: Rm22SlotState): Promise<HTMLCanvasElement> {
  const { canvas, ctx } = makePage(RM22_COVER_WIDTH, RM22_COVER_HEIGHT);
  const image = await loadPhoto(slots.frontImage, slots.frontImageUrl);
  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  if (image) {
    coverDraw(ctx, image, 0, 0, canvas.width, canvas.height, "top");
  }

  const fadeTop = Math.round(canvas.height * 0.5);
  const gradient = ctx.createLinearGradient(0, fadeTop, 0, canvas.height);
  gradient.addColorStop(0, "rgba(0,0,0,0)");
  gradient.addColorStop(0.38, "rgba(0,0,0,0.42)");
  gradient.addColorStop(0.72, "rgba(0,0,0,0.82)");
  gradient.addColorStop(1, "rgba(0,0,0,0.94)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, fadeTop, canvas.width, canvas.height - fadeTop);

  const title = slots.frontTitle.trim();
  const subtitle = slots.frontSubtitle.trim();
  const price = slots.frontPriceLine.trim();
  const tagline = slots.frontTagline.trim();
  const maxTextWidth = canvas.width - 88;
  ctx.textAlign = "center";
  ctx.textBaseline = "bottom";

  let cursorY = canvas.height - 36;

  if (tagline) {
    ctx.fillStyle = LIME;
    fitSingleLine(ctx, tagline, maxTextWidth, {
      italic: true,
      start: 34,
      min: 20,
      family: SANS,
    });
    ctx.fillText(tagline, canvas.width / 2, cursorY);
    cursorY -= 42;
  }

  if (price) {
    ctx.fillStyle = "#ffffff";
    fitSingleLine(ctx, price, maxTextWidth, {
      weight: "500",
      start: 42,
      min: 24,
      family: SANS,
    });
    ctx.fillText(price, canvas.width / 2, cursorY);
    cursorY -= 48;
  }

  if (subtitle) {
    ctx.fillStyle = LIME;
    fitSingleLine(ctx, subtitle, maxTextWidth, {
      italic: true,
      start: 42,
      min: 24,
      family: SANS,
    });
    ctx.fillText(subtitle, canvas.width / 2, cursorY);
    cursorY -= 48;
  }

  if (title) {
    ctx.fillStyle = "#ffffff";
    fitSingleLine(ctx, title, maxTextWidth, {
      weight: "700",
      start: 48,
      min: 24,
      family: SANS,
    });
    ctx.fillText(title, canvas.width / 2, cursorY);
  }

  ctx.textAlign = "left";
  return canvas;
}

async function composeBack(slots: Rm22SlotState): Promise<HTMLCanvasElement> {
  const { canvas, ctx } = makePage(RM22_COVER_WIDTH, RM22_COVER_HEIGHT);
  const image = slots.backAgentImage
    ? await loadPhoto(slots.backAgentImage)
    : slots.backAgentImageUrl
      ? await loadPhoto(null, slots.backAgentImageUrl)
      : await loadImage(RM22_ASSETS.agent);
  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  if (image) {
    coverDraw(ctx, image, 0, 0, canvas.width, canvas.height, "top");
  }

  const logo = await loadPhoto(
    slots.agencyLogo,
    slots.agencyLogoUrl || mapsiteAgencyLogoUrl(null),
  );
  if (logo) {
    const logoBox = Math.round(canvas.width * 0.22);
    const logoX = Math.round(canvas.width * 0.055);
    const logoY = Math.round(canvas.height * 0.035);
    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.38)";
    ctx.shadowBlur = 28;
    ctx.shadowOffsetY = 6;
    containDraw(ctx, logo, logoX, logoY, logoBox, logoBox);
    ctx.restore();
  }

  const fadeTop = Math.round(canvas.height * 0.5);
  const gradient = ctx.createLinearGradient(0, fadeTop, 0, canvas.height);
  gradient.addColorStop(0, "rgba(0,0,0,0)");
  gradient.addColorStop(0.38, "rgba(0,0,0,0.42)");
  gradient.addColorStop(0.72, "rgba(0,0,0,0.82)");
  gradient.addColorStop(1, "rgba(0,0,0,0.94)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, fadeTop, canvas.width, canvas.height - fadeTop);

  const kicker = slots.backKicker.trim();
  const name = slots.agentName.trim() || "Your Name";
  const phone = slots.agentPhone.trim()
    ? `Please message me @ ${slots.agentPhone.trim()}`
    : "";
  const maxTextWidth = canvas.width - 88;
  ctx.textAlign = "center";
  ctx.fillStyle = "#ffffff";
  ctx.textBaseline = "bottom";

  let cursorY = canvas.height - 36;
  if (phone) {
    fitSingleLine(ctx, phone, maxTextWidth, {
      italic: true,
      start: 34,
      min: 20,
      family: SANS,
    });
    ctx.fillText(phone, canvas.width / 2, cursorY);
    cursorY -= 42;
  }

  fitSingleLine(ctx, name, maxTextWidth, {
    weight: "500",
    start: 42,
    min: 24,
    family: SANS,
  });
  ctx.fillText(name, canvas.width / 2, cursorY);
  cursorY -= 48;

  if (kicker) {
    fitSingleLine(ctx, kicker, maxTextWidth, {
      weight: "700",
      start: 48,
      min: 24,
      family: SANS,
    });
    ctx.fillText(kicker, canvas.width / 2, cursorY);
  }

  ctx.textAlign = "left";
  return canvas;
}

async function composeTitleCaption(
  item: Rm22InteriorPlanItem,
): Promise<HTMLCanvasElement> {
  const { canvas, ctx } = makePage();
  fillImageSlot(ctx, await loadPhoto(item.image), RM22_BLEED_IMAGE.box);

  const title = item.title?.trim() || "";
  if (title) {
    ctx.fillStyle = RM22_BLEED_TITLE.style.color;
    ctx.font = `700 ${RM22_BLEED_TITLE.style.fontSize}px ${ROUNDED}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.shadowColor = "rgba(0,0,0,0.6)";
    ctx.shadowBlur = 18;
    ctx.shadowOffsetY = 2;
    ctx.fillText(
      title,
      RM22_BLEED_TITLE.box.x + RM22_BLEED_TITLE.box.width / 2,
      RM22_BLEED_TITLE.box.y,
    );
    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
    ctx.textAlign = "left";
  }

  drawCaptionBar(ctx, item.caption || "", RM22_BLEED_CAPTION.box);
  return canvas;
}

async function composePhotoCaption(
  item: Rm22InteriorPlanItem,
): Promise<HTMLCanvasElement> {
  const { canvas, ctx } = makePage();
  fillImageSlot(ctx, await loadPhoto(item.image), RM22_BLEED_IMAGE.box);
  drawCaptionBar(ctx, item.caption || "", RM22_BLEED_CAPTION.box);
  return canvas;
}

async function composeIntrinsic(
  item: Rm22InteriorPlanItem,
): Promise<HTMLCanvasElement> {
  const { canvas, ctx } = makePage();
  ctx.fillStyle = RM22_COLOR.paper;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  fillImageSlot(ctx, await loadPhoto(item.image), RM22_INTRINSIC_IMAGE.box);
  drawCaptionBar(ctx, item.caption || "", RM22_INTRINSIC_CAPTION.box);

  const titleBox = RM22_INTRINSIC_TITLE.box;
  ctx.fillStyle = RM22_INTRINSIC_TITLE.style.color;
  ctx.textAlign = "center";
  ctx.font = `700 ${RM22_INTRINSIC_TITLE.style.fontSize}px ${SANS}`;
  ctx.textBaseline = "top";
  ctx.fillText(
    item.title?.trim() || "Intrinsic Value",
    titleBox.x + titleBox.width / 2,
    titleBox.y,
  );

  const bodyBox = RM22_INTRINSIC_BODY.box;
  ctx.textAlign = "left";
  ctx.font = `${RM22_INTRINSIC_BODY.style.fontSize}px ${SANS}`;
  const body = item.body?.trim() || "";
  const maxLines = Math.floor(bodyBox.height / RM22_INTRINSIC_BODY.style.lineHeight);
  const lines = wrapLines(ctx, body, bodyBox.width).slice(0, maxLines);
  lines.forEach((line, index) => {
    ctx.fillText(
      line,
      bodyBox.x,
      bodyBox.y + index * RM22_INTRINSIC_BODY.style.lineHeight,
    );
  });

  const signoffBox = RM22_INTRINSIC_SIGNOFF.box;
  ctx.textAlign = "right";
  ctx.font = `${RM22_INTRINSIC_SIGNOFF.style.fontSize}px ${SANS}`;
  ctx.fillText(
    item.signoff?.trim() || "",
    signoffBox.x + signoffBox.width,
    signoffBox.y,
  );
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

export async function composeRm22TemplateCovers(
  slots: Rm22SlotState,
): Promise<{ front: File; back: File }> {
  const front = await canvasToJpegFile(await composeFront(slots), "rm22-front.jpg");
  const back = await canvasToJpegFile(await composeBack(slots), "rm22-back.jpg");
  return { front, back };
}

export async function composeRm22TemplateBook(
  slots: Rm22SlotState,
  onProgress?: (detail: string) => void,
): Promise<{ front: File; back: File; interiors: File[] }> {
  onProgress?.("Composing covers…");
  const { front, back } = await composeRm22TemplateCovers(slots);

  const plan = planRm22TemplateInteriors(slots);
  const interiors: File[] = [];
  for (const [index, item] of plan.entries()) {
    onProgress?.(`Composing page ${index + 1}…`);
    interiors.push(await composeInterior(item));
  }

  return { front, back, interiors };
}
