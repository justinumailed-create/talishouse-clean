import type { Metadata } from "next";
import TopBoundFlipbook from "@/components/product-flipbook/TopBoundFlipbook";
import { loadProductFlipbookPages } from "@/lib/product-flipbook/load-pages";

export const metadata: Metadata = {
  title: "T-All Catalogue | Talispros",
  description:
    "Top-bound T-All product catalogue. Pages turn one at a time from the top edge.",
};

export default async function CataloguePage() {
  const pages = loadProductFlipbookPages();
  return <TopBoundFlipbook pages={pages} />;
}
