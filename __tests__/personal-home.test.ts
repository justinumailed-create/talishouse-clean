import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  clampSeoText,
  normalizePersonalHomeSideMedia,
  parsePersonalHomeEmbed,
  personalHomeEmbedSrc,
  fillPersonalHomeCopy,
  invalidPersonalHomeButtons,
  isPersonalHomePath,
  normalizePersonalHomeButtons,
  normalizePersonalHomeHref,
  packPersonalHomeButtonsForContact,
  contactNameFromPersonalHomeRow,
  mapsiteBrokerageDisplayName,
  personalHomePath,
  resolvePersonalHome,
} from "../lib/talispros/personal-home";
import { en } from "../lib/i18n/dictionaries/en";
import { de } from "../lib/i18n/dictionaries/de";

const root = process.cwd();

const defaults = {
  imageUrl: "/default.jpg",
  kicker: "Welcome",
  headline: "Jane Doe",
  contactName: "Jane Doe",
  writeUp: "Default write-up",
  buttons: [{ label: "Open Mapsite", href: "/map/xx00", kind: "link" as const }],
};

describe("contact name pack (fallback when contact_name column is missing)", () => {
  const buttons = [{ label: "Open Mapsite", href: "/map/dc06", kind: "link" as const }];

  it("packs and reads the contact name from the buttons column", () => {
    const packed = packPersonalHomeButtonsForContact(buttons, "Ralf");
    expect(packed._ph).toBe("contact-v1");
    expect(packed.contactName).toBe("Ralf");
    expect(normalizePersonalHomeButtons(packed)).toEqual(buttons);
    expect(contactNameFromPersonalHomeRow(null, packed)).toBe("Ralf");
  });

  it("prefers the contact_name column over the pack", () => {
    const packed = packPersonalHomeButtonsForContact(buttons, "Ralf");
    expect(contactNameFromPersonalHomeRow("Doug Copp", packed)).toBe("Doug Copp");
  });

  it("lets resolvePersonalHome use the packed contact name instead of the owner default", () => {
    const packed = packPersonalHomeButtonsForContact(buttons, "Ralf");
    const resolved = resolvePersonalHome(defaults, {
      imageUrl: null,
      kicker: null,
      headline: 'My "Chagatown" Project',
      contactName: contactNameFromPersonalHomeRow(null, packed),
      writeUp: null,
      buttons: normalizePersonalHomeButtons(packed),
      sideMedia: null,
      updatedAt: null,
    });
    expect(resolved.contactName).toBe("Ralf");
    expect(resolved.customized.contactName).toBe(true);
    expect(resolved.buttons).toEqual(buttons);
  });
});


describe("personal home helpers", () => {
  it("builds lowercase /talispros/home paths", () => {
    expect(personalHomePath(" AB12 ")).toBe("/home/ab12");
    expect(isPersonalHomePath("/home/ab12")).toBe(true);
    expect(isPersonalHomePath("/talispros/mapsite")).toBe(false);
  });

  it("only accepts safe button links", () => {
    expect(normalizePersonalHomeHref("/talisu/engage")).toBe("/talisu/engage");
    expect(normalizePersonalHomeHref("www.example.com")).toBe("https://www.example.com/");
    expect(normalizePersonalHomeHref("https://example.com/x")).toBe("https://example.com/x");
    expect(normalizePersonalHomeHref("mailto:a@b.co")).toBe("mailto:a@b.co");
    expect(normalizePersonalHomeHref("javascript:alert(1)")).toBeNull();
    expect(normalizePersonalHomeHref("//evil.example")).toBeNull();
    expect(normalizePersonalHomeHref("")).toBeNull();
  });

  it("keeps an older plain link and stores a PIN choice beside it", () => {
    const context = {
      mapsiteHref: "/map/dc06",
      bookshelfHref: "/talisbooks/fast/dc06",
      tebHref: "https://books.example/teb",
      pinIds: ["home-pin", "pin-2"],
    };
    expect(
      normalizePersonalHomeButtons([{ label: "Call", href: "https://example.com/a" }], context)[0]?.kind,
    ).toBe("link");
    const buttons = normalizePersonalHomeButtons(
      [
        { label: "Listing", kind: "pin", pinId: "pin-2", href: "https://evil.example" },
        { label: "Books", kind: "bookshelf", href: "https://evil.example" },
        { label: "Tools", kind: "ebooks", href: "https://evil.example" },
      ],
      context,
    );
    expect(buttons.map((button) => button.href)).toEqual([
      "/map/dc06?pin=pin-2",
      "/talisbooks/fast/dc06",
      "/map/dc06?dashboard=ebooks",
    ]);
    expect(buttons[0]?.pinId).toBe("pin-2");
    expect(invalidPersonalHomeButtons([{ label: "Listing", kind: "pin", pinId: "nope" }], context)).toEqual([0]);
  });

  it("drops invalid buttons and reports the bad rows", () => {
    const raw = [
      { label: "Call me", href: "tel:+14165550100" },
      { label: "", href: "" },
      { label: "Bad", href: "javascript:void(0)" },
      { label: "A", href: "/a" },
      { label: "B", href: "/b" },
    ];
    expect(invalidPersonalHomeButtons(raw)).toEqual([2]);
    const buttons = normalizePersonalHomeButtons(raw);
    expect(buttons).toHaveLength(3);
    expect(buttons[0]).toEqual({ label: "Call me", href: "tel:+14165550100", kind: "link" });
  });

  it("falls back to Mapsite defaults field by field", () => {
    const none = resolvePersonalHome(defaults, null);
    expect(none.headline).toBe("");
    expect(none.contactName).toBe("Jane Doe");
    expect(none.buttons).toEqual(defaults.buttons);
    expect(none.customized.headline).toBe(false);

    const some = resolvePersonalHome(defaults, {
      imageUrl: null,
      kicker: null,
      headline: "Custom",
      contactName: "Tsplits",
      writeUp: "  ",
      buttons: [],
      sideMedia: null,
      updatedAt: null,
    });
    expect(some.headline).toBe("Custom");
    expect(some.contactName).toBe("Tsplits");
    expect(some.writeUp).toBe("Default write-up");
    expect(some.imageUrl).toBe("/default.jpg");
    expect(some.customized.headline).toBe(true);
    expect(some.sideMedia).toBeNull();
  });

  it("keeps the left side on the current photo until an image, MP4 or embed is saved", () => {
    expect(parsePersonalHomeEmbed("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toEqual({
      provider: "youtube",
      id: "dQw4w9WgXcQ",
    });
    expect(parsePersonalHomeEmbed("https://youtu.be/dQw4w9WgXcQ")).toEqual({
      provider: "youtube",
      id: "dQw4w9WgXcQ",
    });
    expect(parsePersonalHomeEmbed("https://vimeo.com/123456789")).toEqual({
      provider: "vimeo",
      id: "123456789",
    });
    expect(parsePersonalHomeEmbed("https://example.com/watch?v=dQw4w9WgXcQ")).toBeNull();
    const embed = normalizePersonalHomeSideMedia({
      kind: "embed",
      url: "https://player.vimeo.com/video/123456789",
    });
    expect(embed?.kind).toBe("embed");
    expect(embed && embed.kind === "embed" ? personalHomeEmbedSrc(embed) : "").toContain(
      "player.vimeo.com/video/123456789",
    );
    expect(normalizePersonalHomeSideMedia({ kind: "video", url: "not a url" })).toBeNull();
    const page = readFileSync(join(root, "app/home/[fastCode]/page.tsx"), "utf8");
    expect(page).toContain("PersonalHomeSide");
    const body = readFileSync(
      join(root, "components/talispros/personal-home/PersonalHomeBody.tsx"),
      "utf8",
    );
    expect(body).toContain('split="home"');
    const layout = readFileSync(join(root, "components/talisu/AdviserLayout.tsx"), "utf8");
    expect(layout).toContain("minmax(0,2fr)_minmax(0,3fr)");
    const migration = readFileSync(
      join(root, "supabase/migrations/129_personal_home_side_media.sql"),
      "utf8",
    );
    expect(migration).toContain("side_media jsonb");
    expect(migration).toContain("Not applied");
    expect(en.personalHome.edit.sideHint).not.toMatch(/[—–]/);
    expect(de.personalHome.edit.sideHint).not.toMatch(/[—–]/);
  });

  it("uses the brokerage on a FAST Code home page and falls back to the person", () => {
    expect(
      mapsiteBrokerageDisplayName({
        propertyTitle: "East Coast Realty",
        ownerFirstName: "Kyle",
        ownerLastName: "Kickham",
        agentName: "Kyle Kickham",
        fallback: "My Mapsite",
      }),
    ).toBe("East Coast Realty");
    expect(
      mapsiteBrokerageDisplayName({
        brokerageName: "For-Sale-By-Owner",
        propertyTitle: "Ralf Meyer",
        ownerFirstName: "Ralf",
        ownerLastName: "Meyer",
        fallback: "My Mapsite",
      }),
    ).toBe("Ralf Meyer");
    expect(
      mapsiteBrokerageDisplayName({
        propertyTitle: "95 Bonaventure Avenue",
        ownerFirstName: "Aritri",
        ownerLastName: "Dutta",
        fallback: "My Mapsite",
      }),
    ).toBe("Aritri Dutta");
    expect(
      mapsiteBrokerageDisplayName({
        propertyTitle: "The Right Choice Realty",
        ownerFirstName: "Dave",
        ownerLastName: "Watt",
        fallback: "My Mapsite",
      }),
    ).toBe("The Right Choice Realty");
  });

  it("fills copy templates and clamps SEO text", () => {
    expect(fillPersonalHomeCopy("Hi {name}", { name: "Jane" })).toBe("Hi Jane");
    expect(clampSeoText("x".repeat(200), 70).length).toBeLessThanOrEqual(70);
  });
});

describe("personal home wiring", () => {
  it("has EN + DE copy with the Home / Mapsite navbar labels", () => {
    expect(en.personalHome.navHome).toBe("Home");
    expect(en.personalHome.navMapsite).toBe("Mapsite");
    expect(de.personalHome.navMapsite).toBe("Mapsite");
    expect(de.personalHome.navHome).toBeTruthy();
    expect(en.personalHome.claimMarket).toContain("™");
    expect(en.personalHome.navMapsite).not.toContain("™");
    expect(Object.keys(de.personalHome.edit).sort()).toEqual(
      Object.keys(en.personalHome.edit).sort(),
    );
    expect(de.meta.personalHome.title).toContain("{name}");
  });

  it("routes FAST Code entry and the demo build to the home page first", () => {
    const actions = readFileSync(join(root, "app/talispros/mapsites/actions.ts"), "utf8");
    expect(actions).toContain("personalHomePath(resolvedCode)");
    const demo = readFileSync(join(root, "app/talispros/demo-mapsite/actions.ts"), "utf8");
    expect(demo).toContain("homeHref");
    const client = readFileSync(
      join(root, "components/talispros/demo-mapsite/DemoEbookGenerateClient.tsx"),
      "utf8",
    );
    expect(client).toContain("result.homeHref ||");
    const redirects = readFileSync(join(root, "next.config.ts"), "utf8");
    expect(redirects).toContain('source: "/a/:fastCode"');
    expect(redirects).toContain('destination: "/home/:fastCode"');
  });

  it("keeps edit controls owner-only and adds the Mapsite navbar", () => {
    const page = readFileSync(join(root, "app/home/[fastCode]/page.tsx"), "utf8");
    expect(page).toContain("PersonalHomeBody");
    expect(
      readFileSync(join(root, "components/talispros/personal-home/PersonalHomeBody.tsx"), "utf8"),
    ).toContain("AdviserLayout");
    expect(
      readFileSync(join(root, "components/talispros/personal-home/PersonalHomeEditor.tsx"), "utf8"),
    ).toContain("personal-home-headline");
    expect(
      readFileSync(join(root, "components/talispros/personal-home/PersonalHomeEditor.tsx"), "utf8"),
    ).toContain("personal-home-contact-name");
    expect(page).toContain("canEdit ?");
    expect(page).toContain("generateMetadata");
    const app = readFileSync(
      join(root, "components/talispros/mapsite/MapSiteApplication.tsx"),
      "utf8",
    );
    expect(app).toContain("PersonalHomeNav");
    expect(app).toContain("showOwnerClaimMarket");
    const migration = readFileSync(
      join(root, "supabase/migrations/113_mapsite_personal_home.sql"),
      "utf8",
    );
    expect(migration).toContain("ENABLE ROW LEVEL SECURITY");
    const editor = readFileSync(
      join(root, "components/talispros/personal-home/PersonalHomeEditor.tsx"),
      "utf8",
    );
    expect(editor).toContain('data-testid="personal-home-close"');
    expect(editor).toContain("personal-home-save");
    // Close sits to the right of Save changes in the bottom bar, not the header.
    expect(editor.indexOf('data-testid="personal-home-save"')).toBeLessThan(
      editor.indexOf('data-testid="personal-home-close"'),
    );
    expect(editor).toContain("saved.contactName?.trim() || defaults.contactName");
    // Save must not stay pending on a hanging router.refresh().
    expect(editor).not.toContain("useTransition");
    expect(editor).toContain("setSaving(false)");
    expect(editor).toMatch(/setSaving\(false\);\s*\}\s*router\.refresh\(\)/);
    // Close reloads the page after a successful save so the public name updates.
    expect(editor).toContain("function handleClose()");
    expect(editor).toContain("window.location.reload()");
    expect(editor).toContain("onClick={handleClose}");
    const service = readFileSync(
      join(root, "lib/talispros/personal-home-service.ts"),
      "utf8",
    );
    expect(service).toContain("packPersonalHomeButtonsForContact");
    expect(service).toContain("contactNameFromPersonalHomeRow");
    expect(service).not.toMatch(/content\.contactName = input\.contactName/);
  });
});

describe("personal home v2: entry points, account pill, logo", () => {
  const read = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

  it("opens the personal home page first from every FAST Code entry", () => {
    expect(read("app/partner-access/page-client.tsx")).toContain(
      "personalHomePath(normalized)",
    );
    expect(read("lib/talispros/mapsite-url-gate-actions.ts")).toContain(
      "personalHomePath(mapsite.fastCode)",
    );
    expect(read("app/talispros/start/samcart-return-actions.ts")).toContain(
      "base.href = personalHomePath(resolved.fastCode)",
    );
    expect(read("app/talispros/mapsites/actions.ts")).toContain("personalHomePath");
    // The Bookshelf "Already have a FAST Code?" unlock still opens the shelf.
    expect(read("app/talisbooks/fast/actions.ts")).toContain("connectedBookshelfPath");
  });

  it("shows the account pill before Home for owners only and opens the editor", () => {
    const nav = read("components/talispros/personal-home/PersonalHomeNav.tsx");
    expect(nav).toContain('data-testid="personal-home-nav-owner"');
    expect(nav.indexOf("{ownerPill}")).toBeLessThan(nav.indexOf('key: "home"'));
    expect(nav).toContain("rounded-xl bg-white/20");
    const page = read("app/home/[fastCode]/page.tsx");
    expect(page).toContain("canEdit\n            ? {");
    expect(page).toContain('initialOpen={query.edit === "1"}');
    const helper = read("lib/talispros/personal-home-page.ts");
    expect(helper).toContain("if (!(await canEditPersonalHome(code))) return null;");
  });

  it("uses Tsplits™ in the navbar logo and on the homepage hero", () => {
    expect(read("components/talisu/TalisBrandMark.tsx")).toContain("Tsplits™\n");
    expect(read("components/talisu/TalisBrandMark.tsx")).not.toMatch(/>\s*Talispros/);
    expect(read("components/talispros/TalisprosHomeGate.tsx")).toContain("Tsplits™\n");
  });

  it("puts Home, Mapsite, Dashboard and Talk to us in the main Mapsite nav, without a lower bar", () => {
    const app = read("components/talispros/mapsite/MapSiteApplication.tsx");
    expect(app).toContain('variant="full"');
    expect(app).not.toContain('variant={claimed ? "sub" : "full"}');
    expect(app).toContain("canManageDashboard");
    expect(app).toContain("MARKETING_PARTNER_WHATSAPP_HREF");
    expect(app).not.toContain("personal-home-subnav");
    const nav = read("components/talispros/personal-home/PersonalHomeNav.tsx");
    expect(nav).toContain('data-testid="personal-home-nav-dashboard"');
    expect(nav).toContain('data-testid="personal-home-nav-talk"');
    expect(nav).toContain("navTalk");
  });
});
