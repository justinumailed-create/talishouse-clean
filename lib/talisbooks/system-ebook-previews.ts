/**
 * Local previews of the standard system Talisbook™.
 * These slugs are not published rows. They do not replace dw01 or km01.
 */
import {
  buildSystemEbook,
  type SystemEbookProfile,
} from "@/lib/talisbooks/system-ebook-format";
import type { TalisBooksViewerBook } from "@/lib/talisbooks/viewer/types";

const DW01: SystemEbookProfile = {
  fastCode: "dw01",
  brokerageName: "The Right Choice Realty",
  brokerName: "Dave Watt",
  officeAddress: "2B-288 Union Street, Fredericton, NB E3A 1E5",
  town: "Fredericton",
  province: "New Brunswick",
  website: "https://therightchoicerealty.ca/",
  phone: "506-455-1980",
  logoUrl: "/system-ebook-preview/dw01/logo.svg",
  areas: ["Moncton", "Noonan", "Waasis"],
  areaPhotoUrl: "/system-ebook-preview/dw01/fredericton.jpg",
  areaPhotoFit: "contain",
  latitude: 45.974092,
  longitude: -66.642588,
  listings: [
    {
      street: "242 Highland Avenue",
      town: "Fredericton",
      priceCad: 419900,
      facts: ["6 bedrooms", "2 bathrooms", "2,559 sq ft"],
    },
    {
      street: "185 Reynolds Street, Unit 33",
      town: "Fredericton",
      priceCad: 234900,
      facts: ["2 bedrooms", "1 bathroom", "1,200 sq ft"],
    },
    {
      street: "764 Route 10",
      town: "Noonan",
      priceCad: 749900,
      facts: ["4 bedrooms", "5 bathrooms", "2,733 sq ft"],
    },
    {
      street: "37 Luanne Drive",
      town: "Waasis",
      priceCad: 265900,
      facts: ["3 bedrooms", "2 bathrooms", "1,184 sq ft"],
    },
  ],
};

const KM01: SystemEbookProfile = {
  fastCode: "km01",
  brokerageName: "Dream Realty SK",
  brokerName: "Kevin Menssa",
  officeAddress: "1541 100th Street, North Battleford, SK S9A 0W3",
  town: "North Battleford",
  province: "Saskatchewan",
  website: "https://realestatethebattlefords.ca/",
  phone: "306-445-5555",
  logoUrl: "/system-ebook-preview/km01/logo.png",
  areas: ["Battleford", "Hafford", "St. Walburg"],
  latitude: 52.780347,
  longitude: -108.299228,
  listings: [
    {
      street: "241 W 30th Street",
      town: "Battleford",
      priceCad: 69900,
      facts: ["Residential"],
    },
    {
      street: "351 26th Street",
      town: "Battleford",
      priceCad: 179900,
      facts: ["Residential"],
    },
    {
      street: "117 W Hudek Avenue",
      town: "Hafford",
      priceCad: 209900,
      facts: ["Residential"],
    },
    {
      street: "144 E 3 Street",
      town: "St. Walburg",
      priceCad: 12900,
      facts: ["Land"],
    },
  ],
};

const BOOKS: Record<string, TalisBooksViewerBook> = {
  "preview-dw01-system-ebook": {
    ...buildSystemEbook(DW01).book,
    slug: "preview-dw01-system-ebook",
  },
  "preview-km01-system-ebook": {
    ...buildSystemEbook(KM01).book,
    slug: "preview-km01-system-ebook",
  },
};

export function createSystemEbookPreview(slug: string): TalisBooksViewerBook | null {
  return BOOKS[slug.trim()] ?? null;
}
