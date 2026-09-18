import { describe, expect, it } from "vitest";
import {
  applyRm22SlotHydration,
  buildRm22TemplatePageRows,
  createRm22SlotState,
  createRm22TemplatePayload,
  defaultRm22IntrinsicBody,
  formatRm22CoverAddressHeadline,
  formatRm22CoverLotBlurb,
  formatRm22CoverPriceLine,
  parseRm22TemplatePayload,
  parseRm22SlotHydration,
  planRm22TemplateInteriors,
  productIdsInPlan,
  isRm22PhotoPlaceholderUrl,
  rm22CoverBandFromOnboarding,
  rm22EndingRoles,
  rm22HydrationFromPageContents,
  rm22InteriorRole,
  rm22ProductById,
  RM22_DEFAULT_COPY,
  RM22_DEFAULT_PRODUCT_ID,
  RM22_PHOTO_CAPTION_COUNT,
  RM22_PRODUCTS,
  RM22_PROTECTED_ENDING_SPREADS,
  styleRm22CoverLotBlurb,
} from "../lib/talisbooks/rm22-template";

describe("RM22 Talisbook™ template", () => {
  it("keeps empty photo slots instead of flattened design-comp JPEGs", () => {
    expect(
      isRm22PhotoPlaceholderUrl("/talisbooks/templates/rm22/interiors/caption.jpg"),
    ).toBe(true);
    expect(isRm22PhotoPlaceholderUrl("")).toBe(true);
    expect(isRm22PhotoPlaceholderUrl(rm22ProductById("t-dome").href)).toBe(false);
  });

  it("preserves template text when historical payloads stored flattened design comps", () => {
    const parsed = parseRm22TemplatePayload(
      JSON.stringify({
        version: 1,
        templateId: "rm22",
        productId: "t-dome",
        interiors: [
          {
            role: "product-sheet",
            imageUrl: rm22ProductById("t-dome").href,
          },
          {
            role: "intro",
            imageUrl: "/talisbooks/templates/rm22/interiors/intro.jpg",
            title: "Welcome…!",
            caption: "Intro Page",
          },
          {
            role: "photo-caption",
            imageUrl: "/talisbooks/templates/rm22/interiors/caption.jpg",
            caption: "The lake from the ridge",
          },
          {
            role: "intrinsic",
            imageUrl: "/talisbooks/templates/rm22/interiors/intrinsic.jpg",
            title: "Intrinsic Value",
            body: "Land plus the option of a T-Dome.",
          },
          {
            role: "outro",
            imageUrl: "/talisbooks/templates/rm22/interiors/outro.jpg",
            title: "The Parting Shot…!",
            caption: "Outro Page",
          },
        ],
      }),
    );
    expect(parsed?.interiors.find((item) => item.role === "intro")?.imageUrl).toBe(
      "",
    );
    expect(parsed?.interiors.find((item) => item.role === "intro")?.title).toBe(
      "Welcome…!",
    );
    expect(
      parsed?.interiors.find((item) => item.role === "photo-caption")?.imageUrl,
    ).toBe("");
    expect(
      parsed?.interiors.find((item) => item.role === "photo-caption")?.caption,
    ).toBe("The lake from the ridge");
    expect(
      parsed?.interiors.find((item) => item.role === "intrinsic")?.body,
    ).toContain("T-Dome");
    expect(
      parsed?.interiors.find((item) => item.role === "product-sheet")?.imageUrl,
    ).toContain("/products/");
  });

  it("maps interior leaves to RM22 roles relative to the plan, not book page numbers", () => {
    expect(rm22InteriorRole(1)).toBe("product-sheet");
    expect(rm22InteriorRole(2)).toBe("intro");
    expect(rm22InteriorRole(4)).toBe("photo-caption");
    expect(rm22InteriorRole(8)).toBe("photo-caption");
    expect(rm22InteriorRole(9)).toBe("intrinsic");
    expect(rm22InteriorRole(10)).toBe("outro");
    expect(rm22InteriorRole(11)).toBeNull();
    // Extra photo-captions shift leaf indexes; intrinsic/outro stay last.
    expect(rm22InteriorRole(11, 8)).toBe("intrinsic");
    expect(rm22InteriorRole(12, 8)).toBe("outro");
    expect(rm22InteriorRole(9, 8)).toBe("photo-caption");
  });

  it("defaults the required product picker to T-Dome", () => {
    const slots = createRm22SlotState();
    expect(slots.productId).toBe(RM22_DEFAULT_PRODUCT_ID);
    expect(slots.productId).toBe("t-dome");
    expect(slots.photoCaptions).toHaveLength(RM22_PHOTO_CAPTION_COUNT);
    expect(slots.photoImages).toHaveLength(RM22_PHOTO_CAPTION_COUNT);
    expect(slots.intrinsicBody).toContain("T-Dome");
    expect(slots.introTitle).toBe("Welcome…!");
  });

  it("fills the front-cover caption from address headline, lot blurb, and price", () => {
    const cover = rm22CoverBandFromOnboarding({
      address: "160 Macs Rd, Richmond County, NS B0E 3B0, Canada",
      lotTitle: "A prime Estuary Location",
      priceLine: "Inquire for price per acre.",
    });
    expect(cover.frontTitle).toBe("160 Macs Rd, Richmond County");
    expect(cover.frontSubtitle).toBe("*A prime Estuary Location*");
    expect(cover.frontPriceLine).toBe("Inquire for price per acre.");
    expect(cover.frontTagline).toBe(RM22_DEFAULT_COPY.frontTagline);
    expect(cover.frontTitle).not.toMatch(/property/i);

    const slots = createRm22SlotState({
      address: "S Head Rd, Homeville, NS, Canada",
      lotWriteup: "A prime Estuary Location. Long extra copy ignored.",
      priceLine: "$20,000",
    });
    expect(slots.frontTitle).toBe("S Head Rd, Homeville");
    expect(slots.frontSubtitle).toBe("*A prime Estuary Location*");
    expect(slots.frontPriceLine).toBe("From $20,000 per acre.");
    expect(slots.frontTagline).toBe(
      "Available with or without Tiny Home, turn key optional",
    );
    expect(slots.introTitle).toBe("Welcome…!");
  });

  it("keeps placeholder cover caption copy when onboarding address/price are absent", () => {
    expect(rm22CoverBandFromOnboarding()).toEqual({
      frontTitle: "",
      frontSubtitle: "*A prime location*",
      frontPriceLine: RM22_DEFAULT_COPY.frontPriceLine,
      frontTagline: RM22_DEFAULT_COPY.frontTagline,
    });
  });

  it("formats address headlines, lot blurbs, and price lines for the translucent caption", () => {
    expect(formatRm22CoverAddressHeadline("S Head Rd, Homeville, NS, Canada")).toBe(
      "S Head Rd, Homeville",
    );
    expect(formatRm22CoverAddressHeadline("Property")).toBe("");
    expect(formatRm22CoverLotBlurb({ title: "Lot + optional Tiny Home" })).toBe(
      "*A prime location*",
    );
    expect(formatRm22CoverLotBlurb({ writeup: "Wooded ridge above the cove." })).toBe(
      "*Wooded ridge above the cove*",
    );
    expect(styleRm22CoverLotBlurb("A prime Estuary Location")).toBe(
      "*A prime Estuary Location*",
    );
    expect(formatRm22CoverPriceLine(null)).toBe("Inquire for price per acre.");
    expect(formatRm22CoverPriceLine("From $49,000 per acre.")).toBe(
      "From $49,000 per acre.",
    );
  });

  it("inserts only the chosen product sheet as the first interior", () => {
    const dome = planRm22TemplateInteriors(createRm22SlotState({ productId: "t-dome" }));
    const gHouse = planRm22TemplateInteriors(
      createRm22SlotState({ productId: "g-house" }),
    );
    const tHouse = planRm22TemplateInteriors(
      createRm22SlotState({ productId: "t-house" }),
    );

    expect(dome[0]).toMatchObject({
      role: "product-sheet",
      productId: "t-dome",
      assetHref: rm22ProductById("t-dome").href,
    });
    expect(gHouse[0]?.productId).toBe("g-house");
    expect(gHouse[0]?.assetHref).toBe(RM22_PRODUCTS[1].href);
    expect(tHouse[0]?.productId).toBe("t-house");
    expect(tHouse[0]?.assetHref).toBe(RM22_PRODUCTS[2].href);

    expect(productIdsInPlan(dome)).toEqual(["t-dome"]);
    expect(productIdsInPlan(gHouse)).toEqual(["g-house"]);
    expect(productIdsInPlan(tHouse)).toEqual(["t-house"]);

    const hrefs = (plan: typeof dome) => plan.map((item) => item.assetHref);
    expect(hrefs(gHouse)).not.toContain(rm22ProductById("t-dome").href);
    expect(hrefs(gHouse)).not.toContain(rm22ProductById("t-house").href);
    expect(hrefs(dome)).not.toContain(rm22ProductById("g-house").href);
    expect(hrefs(dome)).not.toContain(rm22ProductById("t-house").href);
  });

  it("always ends interiors with Intrinsic Value then The Parting Shot, relative to the back cover", () => {
    const slots = createRm22SlotState({ productId: "t-dome" });
    const plan = planRm22TemplateInteriors(slots);
    expect(rm22EndingRoles(plan)).toEqual(["intrinsic", "outro"]);
    expect(plan.at(-2)).toMatchObject({
      role: "intrinsic",
      title: "Intrinsic Value",
      signoff: "The Professional Team",
      fileName: "interior-intrinsic.jpg",
    });
    expect(plan.at(-1)).toMatchObject({
      role: "outro",
      title: "The Parting Shot…!",
      fileName: "interior-outro.jpg",
    });
    expect(plan.at(-2)?.body).toContain("T-Dome");
    expect(plan.map((item) => item.role).indexOf("intrinsic")).toBeGreaterThan(
      plan.map((item) => item.role).lastIndexOf("photo-caption"),
    );
  });

  it("still ends intrinsic→outro when photo-caption count grows", () => {
    const slots = createRm22SlotState({ productId: "g-house" });
    slots.photoImages = Array.from({ length: 10 }, () => null);
    slots.photoCaptions = Array.from({ length: 10 }, () => "");
    const plan = planRm22TemplateInteriors(slots);
    expect(plan.filter((item) => item.role === "photo-caption")).toHaveLength(10);
    expect(rm22EndingRoles(plan)).toEqual(["intrinsic", "outro"]);
    expect(plan).toHaveLength(14);
    expect(RM22_PROTECTED_ENDING_SPREADS).toBe(2);
  });

  it("writes lot + chosen product copy when Intrinsic Value body is empty", () => {
    const body = defaultRm22IntrinsicBody({
      productLabel: "T-Dome",
      lotTitle: "*A prime Estuary Location*",
      address: "160 Macs Rd, Richmond County",
    });
    expect(body).toContain("T-Dome");
    expect(body).toContain("160 Macs Rd");
    expect(body).toContain("A prime Estuary Location");
  });

  it("replaces caption and image slots on stub pages without including extra products", () => {
    const photo = new File(["photo"], "lake.jpg", { type: "image/jpeg" });
    const intro = new File(["intro"], "intro.jpg", { type: "image/jpeg" });
    const intrinsic = new File(["value"], "value.jpg", { type: "image/jpeg" });
    const outro = new File(["outro"], "outro.jpg", { type: "image/jpeg" });
    const slots = createRm22SlotState({ productId: "g-house" });
    slots.introImage = intro;
    slots.introCaption = "Trail head at dusk";
    slots.photoImages[2] = photo;
    slots.photoCaptions[2] = "The lake from the ridge";
    slots.intrinsicImage = intrinsic;
    slots.intrinsicBody = "Real copy, not lorem.";
    slots.intrinsicCaption = "Founder";
    slots.outroImage = outro;
    slots.outroCaption = "See you on the mountain";

    const plan = planRm22TemplateInteriors(slots);
    expect(plan).toHaveLength(10);
    expect(plan[0]?.role).toBe("product-sheet");
    expect(plan[0]?.productId).toBe("g-house");
    expect(plan.filter((item) => item.role === "product-sheet")).toHaveLength(1);
    expect(rm22EndingRoles(plan)).toEqual(["intrinsic", "outro"]);

    const introPage = plan.find((item) => item.role === "intro");
    expect(introPage?.image).toBe(intro);
    expect(introPage?.caption).toBe("Trail head at dusk");
    expect(introPage?.title).toBe("Welcome…!");

    const captionPages = plan.filter((item) => item.role === "photo-caption");
    expect(captionPages).toHaveLength(6);
    expect(captionPages[2]?.image).toBe(photo);
    expect(captionPages[2]?.caption).toBe("The lake from the ridge");
    expect(captionPages[0]?.assetHref).toBe("");

    const valuePage = plan.find((item) => item.role === "intrinsic");
    expect(valuePage?.image).toBe(intrinsic);
    expect(valuePage?.body).toBe("Real copy, not lorem.");
    expect(valuePage?.caption).toBe("Founder");

    const outroPage = plan.find((item) => item.role === "outro");
    expect(outroPage?.image).toBe(outro);
    expect(outroPage?.caption).toBe("See you on the mountain");
  });

  it("serializes Intrinsic Value as a split-copy pair with separate image and text slots", () => {
    const slots = createRm22SlotState({ productId: "t-dome" });
    slots.intrinsicBody = "Land plus the option of a T-Dome.";
    slots.intrinsicCaption = "Founder";
    const payload = createRm22TemplatePayload(slots, {
      intro: "https://cdn.example/intro.jpg",
      photos: [],
      intrinsic: "https://cdn.example/intrinsic.jpg",
      outro: "https://cdn.example/outro.jpg",
    });
    expect(payload.templateId).toBe("rm22");
    const intrinsic = payload.interiors.find((item) => item.role === "intrinsic");
    expect(intrinsic?.imageUrl).toBe("https://cdn.example/intrinsic.jpg");
    expect(intrinsic?.title).toBe("Intrinsic Value");
    expect(intrinsic?.body).toContain("T-Dome");
    expect(intrinsic?.caption).toBe("Founder");

    const rows = buildRm22TemplatePageRows({
      coverImageUrl: "https://cdn.example/front.jpg",
      backCoverImageUrl: "https://cdn.example/back.jpg",
      interiors: payload.interiors,
    });
    const left = rows.find((row) => row.slug === "intrinsic-left");
    const right = rows.find((row) => row.slug === "intrinsic-right");
    expect(left?.content.layout).toBe("split_copy_left");
    expect(left?.content.heroImageUrl).toBe("https://cdn.example/intrinsic.jpg");
    expect(left?.content.templateRole).toBe("intrinsic");
    expect(left?.content.title).toBe("Founder");
    expect(right?.content.layout).toBe("split_copy_right");
    expect(right?.content.heroImageUrl).toBeUndefined();
    expect(right?.content.title).toBe("Intrinsic Value");
    expect(right?.content.body).toContain("T-Dome");
    expect(right?.content.signoff).toBe("The Professional Team");
    expect(rows[0]?.content.layout).toBe("cover");
    expect(rows[rows.length - 1]?.content.layout).toBe("cover");
    const product = rows.find((row) => row.slug === "product-left");
    expect(product?.content.spreadImageUrl).toBe(rm22ProductById("t-dome").href);
    expect(product?.content.templateRole).toBe("product-sheet");
  });

  it("round-trips a template payload without flattening image and text", () => {
    const slots = createRm22SlotState();
    const original = createRm22TemplatePayload(slots, { photos: [] });
    const parsed = parseRm22TemplatePayload(JSON.stringify(original));
    expect(parsed?.interiors).toHaveLength(original.interiors.length);
    expect(parsed?.interiors.find((item) => item.role === "intrinsic")?.title).toBe(
      "Intrinsic Value",
    );
    const photos = parsed?.interiors.filter((item) => item.role === "photo-caption") ?? [];
    expect(photos.length).toBeGreaterThan(0);
    expect(photos.every((item) => item.imageUrl === "")).toBe(true);
    expect(photos[0]?.caption).toBe("");
    expect(
      parsed?.interiors.find((item) => item.role === "intro")?.title,
    ).toBe("Welcome…!");
    expect(
      parsed?.interiors.find((item) => item.role === "product-sheet")?.imageUrl,
    ).toContain("/products/");
    expect(JSON.stringify(original)).not.toMatch(/interiors\/caption\.jpg/);
    expect(JSON.stringify(original)).not.toMatch(/interiors\/intro\.jpg/);
    expect(JSON.stringify(original)).not.toMatch(/interiors\/intrinsic\.jpg/);
  });

  it("hydrates template slots from saved page contents for in-place editing", () => {
    const slots = createRm22SlotState({ productId: "g-house" });
    slots.introTitle = "Saved welcome";
    slots.introCaption = "Saved intro caption";
    slots.photoCaptions[1] = "Dock at dusk";
    slots.intrinsicBody = "Saved intrinsic copy.";
    slots.outroCaption = "Saved outro";
    const payload = createRm22TemplatePayload(slots, {
      intro: "https://cdn.example/intro.jpg",
      photos: [null, "https://cdn.example/dock.jpg"],
      intrinsic: "https://cdn.example/intrinsic.jpg",
      outro: "https://cdn.example/outro.jpg",
    });
    const rows = buildRm22TemplatePageRows({
      coverImageUrl: "https://cdn.example/front.jpg",
      backCoverImageUrl: "https://cdn.example/back.jpg",
      interiors: payload.interiors,
    });
    const hydration = rm22HydrationFromPageContents(rows.map((row) => ({
      content: row.content,
      page_number: row.page_number,
    })));
    expect(hydration?.productId).toBe("g-house");
    expect(hydration?.introTitle).toBe("Saved welcome");
    expect(hydration?.introImageUrl).toBe("https://cdn.example/intro.jpg");
    expect(hydration?.photoCaptions[1]).toBe("Dock at dusk");
    expect(hydration?.photoImageUrls[1]).toBe("https://cdn.example/dock.jpg");
    expect(hydration?.intrinsicBody).toBe("Saved intrinsic copy.");
    expect(hydration?.outroImageUrl).toBe("https://cdn.example/outro.jpg");

    const applied = applyRm22SlotHydration(createRm22SlotState(), hydration!);
    expect(applied.introTitle).toBe("Saved welcome");
    expect(applied.introImageUrl).toBe("https://cdn.example/intro.jpg");
    const reused = createRm22TemplatePayload(applied, { photos: [] });
    expect(reused.interiors.find((item) => item.role === "intro")?.imageUrl).toBe(
      "https://cdn.example/intro.jpg",
    );
    expect(
      reused.interiors.filter((item) => item.role === "photo-caption")[1]?.imageUrl,
    ).toBe("https://cdn.example/dock.jpg");
  });

  it("hydrates covers and interiors from a saved book that has no template roles", () => {
    const hydration = rm22HydrationFromPageContents([
      {
        page_number: 1,
        content: {
          pageRole: "cover",
          layout: "cover",
          coverSpreadHalf: "front",
          heroImageUrl: "https://cdn.example/front.jpg",
        },
      },
      {
        page_number: 2,
        content: {
          pageRole: "property_content",
          brochureLeaf: "left",
          spreadImageUrl: "https://cdn.example/spread-a.jpg",
          title: "Dock",
        },
      },
      {
        page_number: 3,
        content: {
          pageRole: "property_content",
          brochureLeaf: "right",
          spreadImageUrl: "https://cdn.example/spread-a.jpg",
        },
      },
      {
        page_number: 4,
        content: {
          pageRole: "property_content",
          brochureLeaf: "left",
          spreadImageUrl: "https://cdn.example/spread-b.jpg",
        },
      },
      {
        page_number: 5,
        content: {
          pageRole: "cover",
          layout: "cover",
          coverSpreadHalf: "back",
          heroImageUrl: "https://cdn.example/back.jpg",
        },
      },
    ]);
    expect(hydration?.frontImageUrl).toBe("https://cdn.example/front.jpg");
    expect(hydration?.backAgentImageUrl).toBe("https://cdn.example/back.jpg");
    expect(hydration?.introImageUrl).toBe("https://cdn.example/spread-a.jpg");
    expect(hydration?.introTitle).toBe("Dock");
    expect(hydration?.outroImageUrl).toBe("https://cdn.example/spread-b.jpg");
    expect(hydration?.introTitle).not.toBe("Welcome…!");
  });

  it("stores the agency logo on back-cover hydration", () => {
    const parsed = parseRm22SlotHydration({
      productId: "t-dome",
      agencyLogoUrl: "https://cdn.example/agency.png",
      backKicker: "Your Marketing Manager",
    });
    expect(parsed?.agencyLogoUrl).toBe("https://cdn.example/agency.png");
    const slots = createRm22SlotState({
      agencyLogoUrl: "https://cdn.example/agency.png",
    });
    expect(slots.agencyLogoUrl).toBe("https://cdn.example/agency.png");
  });
});
