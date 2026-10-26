import { loadCataloguePages } from "@/lib/talisu/catalogue-pages";
import {
  CATALOGUE_DEFAULT_PRODUCT_TITLE,
  CATALOGUE_PRODUCTS,
  type CatalogueRect,
} from "@/lib/talisu/catalogue-products";

/**
 * One design in the /talisu/engage gallery: a P-code unit cropped out of the
 * catalogue page image it sits on (the same visible pages /catalogue shows;
 * hidden pages 2–19 are not in the page list, so never here).
 */
export type EngageDesign = {
  code: string;
  /** Catalogue page image the design is cropped from. */
  src: string;
  /** Crop, % of the page image. */
  rect: CatalogueRect;
  /** Catalogue page number the design is on. */
  page: number;
  /** Real design name, or null when the catalogue has none (generic label shown). */
  name: string | null;
};

export function loadEngageDesigns(): EngageDesign[] {
  const titles = new Map(CATALOGUE_PRODUCTS.map((p) => [p.code, p.title]));
  return loadCataloguePages().flatMap((page) => {
    if (page.role !== "content" || !page.src || page.face) return [];
    return (page.hotspots ?? []).map((spot) => {
      const title = titles.get(spot.code);
      return {
        code: spot.code,
        src: page.src as string,
        rect: spot.rect,
        page: page.number,
        name: title && title !== CATALOGUE_DEFAULT_PRODUCT_TITLE ? title : null,
      };
    });
  });
}
