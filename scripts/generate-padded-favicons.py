"""Padded square tree-mark favicons (Ralf, Nov 27 item #8B).

Composites public/logo-mark.png onto a square white canvas with an ~11%
margin so browsers never clip the tree mark, then writes:
  public/favicon.ico, public/favicon-v2.ico  (16, 32, 48 multi-size ICO)
  public/favicon.png, public/favicon-v2.png  (180x180 PNG)
  app/icon.png (512x512), app/apple-icon.png (180x180)
Run: python3 scripts/generate-padded-favicons.py
"""
from PIL import Image

MARGIN = 0.11
SRC = "public/logo-mark.png"


def padded_square(size: int) -> Image.Image:
    mark = Image.open(SRC).convert("RGBA")
    bbox = mark.split()[-1].getbbox() or (0, 0, *mark.size)
    mark = mark.crop(bbox)
    inner = round(size * (1 - 2 * MARGIN))
    scale = inner / max(mark.size)
    w, h = max(1, round(mark.width * scale)), max(1, round(mark.height * scale))
    mark = mark.resize((w, h), Image.LANCZOS)
    canvas = Image.new("RGBA", (size, size), (255, 255, 255, 255))
    canvas.alpha_composite(mark, ((size - w) // 2, (size - h) // 2))
    return canvas.convert("RGB")


def main() -> None:
    big = padded_square(512)
    big.save("app/icon.png", optimize=True)
    apple = padded_square(180)
    apple.save("app/apple-icon.png", optimize=True)
    for name in ("public/favicon.png", "public/favicon-v2.png"):
        apple.save(name, format="PNG", optimize=True)
    ico_base = padded_square(256)
    for name in ("public/favicon.ico", "public/favicon-v2.ico"):
        ico_base.save(name, format="ICO", sizes=[(16, 16), (32, 32), (48, 48)])


if __name__ == "__main__":
    main()
