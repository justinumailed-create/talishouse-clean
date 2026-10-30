"""Tsplits™ mobile layout check.

Loads every public page at 390x844, 375x667 and 430x932 (EN; DE for a subset)
and FAILS on: horizontal overflow, key text covered by another element,
clipped headings, a mobile header taller than 88px, and core tap targets
(menu button, structure buttons) under 44px.  Usage:
  BASE=https://www.talispros.com python3 scripts/mobile/mobile_check.py [out.json]
  ONLY=home,reg  (comma list of page keys) limits the run.
Needs: pip install playwright (Chrome at /usr/bin/google-chrome, $CHROME, or
`playwright install chromium`).
"""
import json, os, sys
from playwright.sync_api import sync_playwright

BASE = os.environ.get("BASE", "https://www.talispros.com")
PAGES = [
    ("home", "/"), ("mkts", "/talisu/mkts"), ("engage", "/talisu/engage"),
    ("engage-pay", "/talisu/engage?step=pay"), ("discuss", "/talisu/discuss"),
    ("demo", "/talispros/demo-mapsite"), ("reg", "/talisu/reg"),
    ("catalogue", "/catalogue"), ("bookshelf", "/catalogue/bookshelf"),
    ("pmc", "/talisu/talispros"), ("media", "/talisu/media-directory"),
    ("contract", "/talisu/contract"), ("terms", "/talisu/terms"),
    ("privacy", "/talisu/privacy"), ("talisu", "/talisu"), ("kb", "/talisu/kb"),
    ("mapsite", "/mapsite/rm22"), ("agent-login", "/agent/login"),
    ("admin-login", "/admin/login"),
]
DE = {"home", "engage", "reg", "discuss", "catalogue", "talisu"}
SIZES = [(390, 844), (375, 667), (430, 932)]
ONLY = set(filter(None, os.environ.get("ONLY", "").split(",")))

JS = r"""
() => {
  const vw = window.innerWidth, out = {overflow: [], covered: [], clipped: [], small: [], offscreen: []};
  const sw = document.documentElement.scrollWidth;
  out.scrollWidth = sw; out.vw = vw;
  const vis = e => { const s = getComputedStyle(e); const r = e.getBoundingClientRect();
    return s.visibility !== 'hidden' && s.display !== 'none' && +s.opacity > 0.05 && r.width > 1 && r.height > 1; };  // sr-only (1x1) is not visible text
  const clippedByAncestor = e => { for (let a = e.parentElement; a && a !== document.body; a = a.parentElement) {
      const s = getComputedStyle(a); if (s.overflowX !== 'visible') {
        const r = a.getBoundingClientRect(); if (r.right <= vw + 1 && r.left >= -1) return true; } } return false; };
  const desc = e => (e.tagName.toLowerCase() + (e.id ? '#' + e.id : '') + (e.dataset && e.dataset.testid ? `[${e.dataset.testid}]` : '') + ' "' + ((e.innerText || e.alt || '') + '').trim().replace(/\s+/g,' ').slice(0, 40) + '"');
  if (sw > vw + 1) {
    for (const e of document.body.querySelectorAll('*')) {
      if (!vis(e)) continue; const r = e.getBoundingClientRect();
      if ((r.right > vw + 1 || r.left < -1) && !clippedByAncestor(e)) { out.overflow.push(desc(e) + ` [${Math.round(r.left)},${Math.round(r.right)}]`); if (out.overflow.length > 6) break; }
    }
  }
  const fixedish = e => { for (let a = e; a && a.nodeType === 1; a = a.parentElement) { const p = getComputedStyle(a).position; if (p === 'fixed' || p === 'sticky') return true; } return false; };
  const texts = [...document.querySelectorAll('h1,h2,h3,p,li,label,button,a')].filter(e => vis(e) && (e.innerText || '').trim().length > 1 && !fixedish(e));
  for (const e of texts.slice(0, 350)) {
    const r = e.getBoundingClientRect();
    if (e.matches('h1,h2,h3') && ((e.scrollWidth > e.clientWidth + 2 && getComputedStyle(e).overflowX !== 'visible') || r.right > vw + 1 || r.left < -1))
      out.clipped.push(desc(e));
    // Text pushed past the screen edge but hidden by an overflow:hidden ancestor
    // (no scrollbar, just cut-off copy).  Horizontal scrollers/carousels are fine.
    if (e.matches('h1,h2,h3,p') && (r.left < -2 || r.right > vw + 2)) {
      let scroller = false;
      for (let a = e.parentElement; a && a !== document.body; a = a.parentElement) {
        const ox = getComputedStyle(a).overflowX; if (ox === 'auto' || ox === 'scroll') { scroller = true; break; } }
      if (!scroller && out.offscreen.length < 6) out.offscreen.push(desc(e) + ` [${Math.round(r.left)},${Math.round(r.right)}]`);
    }
    const absTop = r.top + scrollY;
    window.scrollTo(0, Math.max(0, absTop - window.innerHeight / 2));
    const r2 = e.getBoundingClientRect();
    const pts = [[r2.left + r2.width / 2, r2.top + Math.min(r2.height / 2, 10)], [r2.left + 5, r2.top + r2.height / 2], [r2.right - 5, r2.top + r2.height / 2]];
    let bad = 0, hitDesc = '';
    for (const [px, py] of pts) {
      if (px < 0 || px >= vw || py < 0 || py >= window.innerHeight) continue;
      const h = document.elementFromPoint(px, py); if (!h) continue;
      if (e.contains(h) || h.contains(e) || fixedish(h)) continue;
      const c1 = h.closest('a,button,label'), c2 = e.closest('a,button,label'); if (c1 && c1 === c2) continue;
      bad++; hitDesc = desc(h); }
    if (bad >= 2) out.covered.push(desc(e) + ' UNDER ' + hitDesc);
    if (out.covered.length > 8) break;
  }
  window.scrollTo(0, 0);
  const hdr = document.querySelector('[data-testid=site-header]') || [...document.querySelectorAll('header')].find(h => ['sticky','fixed'].includes(getComputedStyle(h).position));
  out.headerH = hdr ? Math.round(hdr.getBoundingClientRect().height) : 0;
  for (const e of document.querySelectorAll('[data-testid=mobile-menu-button],[data-structure-id]')) {
    if (!vis(e)) continue; const r = e.getBoundingClientRect(); if (r.height < 43.5 || r.width < 43.5) out.small.push(desc(e) + ` ${Math.round(r.width)}x${Math.round(r.height)}`); }
  return out;
}
"""

def run(out_path=None):
    results, fails = [], 0
    with sync_playwright() as p:
        chrome = os.environ.get("CHROME") or ("/usr/bin/google-chrome" if os.path.exists("/usr/bin/google-chrome") else None)
        b = p.chromium.launch(executable_path=chrome, args=["--no-sandbox"])
        for loc in ("en", "de"):
            for (w, h) in SIZES:
                ctx = b.new_context(viewport={"width": w, "height": h}, device_scale_factor=2, is_mobile=True, has_touch=True,
                    user_agent="Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1")
                ctx.add_cookies([{"name": "talis_locale", "value": loc, "url": BASE}])
                pg = ctx.new_page()
                for k, u in PAGES:
                    if ONLY and k not in ONLY: continue
                    if loc == "de" and k not in DE: continue
                    try:
                        pg.goto(BASE + u, wait_until="networkidle", timeout=45000)
                    except Exception:
                        pg.wait_for_timeout(2000)
                    pg.wait_for_timeout(1200)
                    try:
                        r = pg.evaluate(JS)
                    except Exception as ex:
                        print("ERR ", loc, w, k, ex); continue
                    probs = []
                    if r["scrollWidth"] > r["vw"] + 1: probs.append(f"h-overflow {r['scrollWidth']}>{r['vw']}: " + "; ".join(r["overflow"][:4]))
                    if r["covered"]: probs.append("covered: " + "; ".join(r["covered"][:4]))
                    if r["clipped"]: probs.append("clipped: " + "; ".join(r["clipped"][:3]))
                    if r["offscreen"]: probs.append("text off-screen: " + "; ".join(r["offscreen"][:3]))
                    if r["headerH"] > 88: probs.append(f"header {r['headerH']}px")
                    if r["small"]: probs.append("tap<44: " + "; ".join(r["small"][:4]))
                    fails += bool(probs)
                    results.append({"page": k, "loc": loc, "size": f"{w}x{h}", "url": pg.url, "ok": not probs, "problems": probs})
                    print(("OK  " if not probs else "FAIL"), loc, f"{w}x{h}", k, " | ".join(probs)[:500], flush=True)
                ctx.close()
        b.close()
    if out_path: json.dump(results, open(out_path, "w"), indent=1)
    print(f"\n{len(results) - fails}/{len(results)} passed")
    return fails

if __name__ == "__main__":
    sys.exit(1 if run(sys.argv[1] if len(sys.argv) > 1 else None) else 0)
