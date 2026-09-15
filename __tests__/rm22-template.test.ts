import { describe, expect, it } from "vitest";
import {
  createRm22SlotState,
  defaultRm22IntrinsicBody,
  formatRm22CoverAddressHeadline,
  formatRm22CoverLotBlurb,
  formatRm22CoverPriceLine,
  planRm22TemplateInteriors,
  productIdsInPlan,
  rm22CoverBandFromOnboarding,
  rm22EndingRoles,
  rm22InteriorRole,
  rm22ProductById,
  RM22_ASSETS,
  RM22_DEFAULT_COPY,
  RM22_DEFAULT_PRODUCT_ID,
  RM22_PHOTO_CAPTION_COUNT,
  RM22_PRODUCTS,
  RM22_PROTECTED_ENDING_SPREADS,
  styleRm22CoverLotBlurb,
} from "../lib/talisbooks/rm22-template";

describe("RM22 Talisbook™ template", () => {
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
    expect(captionPages[0]?.assetHref).toBe(RM22_ASSETS.caption);

    const valuePage = plan.find((item) => item.role === "intrinsic");
    expect(valuePage?.image).toBe(intrinsic);
    expect(valuePage?.body).toBe("Real copy, not lorem.");
    expect(valuePage?.caption).toBe("Founder");

    const outroPage = plan.find((item) => item.role === "outro");
    expect(outroPage?.image).toBe(outro);
    expect(outroPage?.caption).toBe("See you on the mountain");
  });
});
