export type ShelfValueTier = "standard" | "premium";

export interface ShelfMonetizationProfile {
  productCode: "TEB" | "TTV";
  productName: string;
  shelfLabel: string;
  unitLabel: string;
  capacity: number;
  unitValueUsd: number;
  monthlyCapacityUsd: number;
  valueTier: ShelfValueTier;
}

function createShelfProfile(input: {
  productCode: "TEB" | "TTV";
  productName: string;
  shelfLabel: string;
  unitLabel: string;
  capacity: number;
  unitValueUsd: number;
  valueTier: ShelfValueTier;
}): ShelfMonetizationProfile {
  return {
    ...input,
    monthlyCapacityUsd: Math.round(input.capacity * input.unitValueUsd * 100) / 100,
  };
}

export const TALISBOOKS_SHELF_PROFILE = createShelfProfile({
  productCode: "TEB",
  productName: "TalisBooks™",
  shelfLabel: "Bookshelf",
  unitLabel: "books",
  capacity: 25,
  unitValueUsd: 19.95,
  valueTier: "standard",
});

export const TALISTV_VIDEO_SHELF_PROFILE = createShelfProfile({
  productCode: "TTV",
  productName: "TalisTV™",
  shelfLabel: "Video Shelf",
  unitLabel: "videos",
  capacity: 25,
  unitValueUsd: 49.95,
  valueTier: "premium",
});
