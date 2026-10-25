# -*- coding: utf-8 -*-
"""Render the page share cards (1200x630, EN + DE) and emit lib/seo/pages.json.

    python3 scripts/og/generate.py            # from the repo root (needs Pillow)

Design follows public/og/talisu-reg-*.jpg: photo/brand panel left, blue rule,
tree logo + Talispros™ wordmark, 3-line headline (last line blue), chips, URL.
"""
import json, os, sys
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageOps

sys.path.insert(0, os.path.dirname(__file__))
from pages_src import P, ADMIN  # noqa: E402

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
PUB = os.path.join(ROOT, "public")
OUT = os.path.join(PUB, "og", "pages")
FONT_DIR = os.environ.get("POPPINS_DIR", "/usr/share/fonts/truetype/sand-box/google/Poppins")
def f(w, s): return ImageFont.truetype(os.path.join(FONT_DIR, f"Poppins-{w}.ttf"), s)

W, H = 1200, 630
BLUE = (3, 108, 217); NAVY = (17, 24, 39); GRAY = (75, 85, 99); CHIP = (235, 244, 255)
X = 556
LOGO = Image.open(os.path.join(PUB, "logo-mark.png")).convert("RGBA")

def fit(d, text, w, size, maxw):
    while size > 10 and d.textlength(text, font=f(w, size)) > maxw: size -= 1
    return size

def cover(img, w, h, focus):
    s = max(w / img.width, h / img.height)
    im = img.resize((max(w, round(img.width * s)), max(h, round(img.height * s))), Image.LANCZOS)
    left = int(min(max(im.width * focus - w / 2, 0), im.width - w))
    top = 0 if im.height - h < 4 else int((im.height - h) * 0.3)
    return im.crop((left, top, left + w, top + h))

def brand_panel(bg):
    panel = Image.new("RGB", (500, H), bg)
    # Tree mark as a white silhouette (alpha of the header logo).
    th = 400; tw = int(LOGO.width * th / LOGO.height)
    a = LOGO.split()[3].resize((tw, th), Image.LANCZOS)
    panel.paste((255, 255, 255), ((500 - tw) // 2, (H - th) // 2 - 10), a)
    return panel

def card(lang, kicker, lines, chips, footer, photo, out, panel_bg=BLUE, wordmark="Talispros™"):
    im = Image.new("RGB", (W, H), "white"); d = ImageDraw.Draw(im)
    if photo:
        src, focus, pill, _ = photo
        im.paste(cover(Image.open(os.path.join(PUB, src)).convert("RGB"), 500, H, focus), (0, 0))
    else:
        im.paste(brand_panel(panel_bg), (0, 0)); pill = None
    d.rectangle([500, 0, 508, H], fill=BLUE)
    lh = 92; lw = int(LOGO.width * lh / LOGO.height); lg = LOGO.resize((lw, lh), Image.LANCZOS)
    im.paste(lg, (X, 40), lg)
    d.text((X + lw + 20, 58), wordmark, font=f("SemiBold", 36), fill=NAVY)
    ks = fit(d, kicker, "Medium", 16, W - (X + lw + 22) - 30)
    d.text((X + lw + 22, 103), kicker, font=f("Medium", ks), fill=BLUE)
    maxw = W - X - 50
    lines = [l for l in lines if l]
    size = min(fit(d, l, "Bold", 64, maxw) for l in lines)
    y = (185 if chips else 205) + (3 - len(lines)) * 36
    for i, l in enumerate(lines):
        d.text((X, y), l, font=f("Bold", size), fill=BLUE if i == len(lines) - 1 else NAVY)
        y += int(size * 1.12)
    y += 22
    if chips:
        cf = f("Medium", 17); cx = X
        for ch in chips:
            w = int(d.textlength(ch, font=cf) + 24)
            if cx + w > W - 30: break
            d.rounded_rectangle([cx, y, cx + w, y + 38], radius=19, fill=CHIP, outline=BLUE, width=2)
            d.text((cx + 12, y + 19), ch, font=cf, fill=BLUE, anchor="lm"); cx += w + 8
        assert y + 38 <= 555, (out, y)
    else:
        assert y <= 560, (out, y)
    fs = fit(d, footer, "Regular", 24, maxw)
    d.text((X, 575), footer, font=f("Regular", fs), fill=GRAY)
    if pill:
        p = pill[lang]; pf = f("SemiBold", 22); pw = int(d.textlength(p, font=pf) + 40)
        px = (500 - pw) // 2; py = 562
        sh = Image.new("L", (W, H), 0); ImageDraw.Draw(sh).rounded_rectangle([px, py + 3, px + pw, py + 48], radius=24, fill=90)
        im.paste((0, 0, 0), (0, 0), sh.filter(ImageFilter.GaussianBlur(6)))
        d = ImageDraw.Draw(im)
        d.rounded_rectangle([px, py, px + pw, py + 46], radius=23, fill="white")
        d.text((250, py + 23), p, font=pf, fill=NAVY, anchor="mm")
    im.save(out, quality=86, progressive=True, optimize=True)

def alt_text(lang, photo, lines):
    head = ""
    for l in (l for l in lines if l):
        if head.endswith("-"):
            # Soft line-break hyphen: "Produkt-" + "katalog" -> "Produktkatalog".
            head = (head[:-1] + l) if l[:1].islower() else head + l
        else:
            head += (" " if head else "") + l
    if head.endswith("-"):
        head = head[:-1]
    who = photo[3] if photo and photo[3] else None
    if lang == "en":
        return f"{who} with the Talispros™ tree logo: {head}" if who else f"Talispros™ tree logo: {head}"
    return f"{who} mit dem Talispros™ Baumlogo: {head}" if who else f"Talispros™ Baumlogo: {head}"

BAD = ["Mapsite™", "Mapsites™", "USD", "$"]
def check(route, lang, t, dsc):
    assert len(t) <= 60, (route, lang, len(t), t)
    assert len(dsc) <= 155, (route, lang, len(dsc), dsc)
    for b in BAD:
        assert b not in t + dsc, (route, b)

def main():
    os.makedirs(OUT, exist_ok=True)
    only = set(sys.argv[1:])
    pages = {}
    for p in P:
        r = p["route"]; e = {"kind": p["kind"]}
        if p["kind"] in ("public", "login", "utility"):
            e["noindex"] = p["kind"] != "public"
            e["image"] = f"/og/pages/{p['slug']}"
            for lang in ("en", "de"):
                t, dsc, kicker, lines, chips = p[lang]
                check(r, lang, t, dsc)
                e[lang] = {"title": t, "description": dsc, "alt": alt_text(lang, p["photo"], lines)}
                if not only or p["slug"] in only:
                    card(lang, kicker, lines, chips, "talispros.com" + (r if r != "/" else ""),
                         p["photo"], os.path.join(OUT, f"{p['slug']}-{lang}.jpg"))
        elif p["kind"] == "custom":
            e["image"] = f"/og/{p['slug']}"
        pages[r] = e
    # shared admin card
    admin = {"kind": "admin", "noindex": True, "image": "/og/pages/admin",
             "en": {"title": "Talispros™ Admin", "description": "Internal Talispros™ admin tools. Sign in required.",
                    "alt": "Talispros™ tree logo: Talispros™ Admin console"},
             "de": {"title": "Talispros™ Admin", "description": "Interne Talispros™ Admin-Werkzeuge. Anmeldung erforderlich.",
                    "alt": "Talispros™ Baumlogo: Talispros™ Admin-Konsole"}}
    # Dedicated /talisu/engage share card (Thorsten P, product catalogue), served
    # from /og/talisu-engage-<lang>.jpg via meta.talisuEngage.
    if not only or "talisu-engage" in only:
        thorsten = next(p["photo"] for p in P if p["route"] == "/talisu/engage")
        card("en", "TALISU™  ·  PRODUCT CATALOGUE", ["Engage Thorsten P", "and his", "Fulfilment Team"],
             ["Talishouse™ Catalogue", "$2,000 CAD Down Payment"], "talispros.com/talisu/engage",
             thorsten, os.path.join(PUB, "og", "talisu-engage-en.jpg"))
        card("de", "TALISU™  ·  PRODUKTKATALOG", ["Beauftragen Sie", "Thorsten P und sein", "Fulfilment-Team"],
             ["Talishouse™ Katalog", "Anzahlung 2.000 CAD"], "talispros.com/talisu/engage",
             thorsten, os.path.join(PUB, "og", "talisu-engage-de.jpg"))
    if not only or "admin" in only:
        card("en", "TALISPROS™  ·  ADMIN CONSOLE", ["Talispros™", "Admin"], ["Mapsites", "Talisbooks™", "Agents"],
             "Internal tools · sign in required", None, os.path.join(OUT, "admin-en.jpg"), panel_bg=NAVY)
        card("de", "TALISPROS™  ·  ADMIN-KONSOLE", ["Talispros™", "Admin"], ["Mapsites", "Talisbooks™", "Agenten"],
             "Interne Werkzeuge · Anmeldung erforderlich", None, os.path.join(OUT, "admin-de.jpg"), panel_bg=NAVY)
    with open(os.path.join(ROOT, "lib", "seo", "pages.json"), "w", encoding="utf-8") as fh:
        json.dump({"pages": pages, "admin": admin}, fh, ensure_ascii=False, indent=1)
    print(len(pages), "routes")

if __name__ == "__main__":
    main()
