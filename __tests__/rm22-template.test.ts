import { describe, expect, it } from "vitest";
import {
  createRm22SlotState,
  planRm22TemplateInteriors,
  productIdsInPlan,
  rm22InteriorRole,
  rm22ProductById,
  RM22_ASSETS,
  RM22_DEFAULT_PRODUCT_ID,
  RM22_PHOTO_CAPTION_COUNT,
  RM22_PRODUCTS,
} from "../lib/talisbooks/rm22-template";

describe("RM22 Talisbook™ template", () => {
  it("maps interior pages to RM22 roles, not Jarlberg roles", () => {
    expect(rm22InteriorRole(1)).toBe("product-sheet");
    expect(rm22InteriorRole(2)).toBe("intro");
    expect(rm22InteriorRole(4)).toBe("photo-caption");
    expect(rm22InteriorRole(8)).toBe("photo-caption");
    expect(rm22InteriorRole(9)).toBe("intrinsic");
    expect(rm22InteriorRole(10)).toBe("outro");
    expect(rm22InteriorRole(11)).toBeNull();
  });

  it("defaults the required product picker to T-Dome", () => {
    const slots = createRm22SlotState();
    expect(slots.productId).toBe(RM22_DEFAULT_PRODUCT_ID);
    expect(slots.productId).toBe("t-dome");
    expect(slots.photoCaptions).toHaveLength(RM22_PHOTO_CAPTION_COUNT);
    expect(slots.photoImages).toHaveLength(RM22_PHOTO_CAPTION_COUNT);
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

    const introPage = plan.find((item) => item.role === "intro");
    expect(introPage?.image).toBe(intro);
    expect(introPage?.caption).toBe("Trail head at dusk");

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
