/**
 * Local previews of the standard system Talisbook™.
 * These slugs are not published rows. They do not replace dw01 or km01.
 *
 * Listing visuals are Talismaps™ stills (office pin, listing pin, 80 km market).
 * The brokerage listing photos on these two sites carry a board watermark.
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
  logoUrl: "/system-ebook-preview/dw01/logo-mark.svg",
  logoPlate: "light",
  areas: ["Moncton", "Noonan", "Waasis"],
  areaPhotoUrl: "/system-ebook-preview/dw01/fredericton.jpg",
  areaPhotoFit: "contain",
  marketMapUrl: "/system-ebook-preview/dw01/market.png",
  latitude: 45.974092,
  longitude: -66.642588,
  listings: [
    {
      street: "242 Highland Avenue",
      town: "Fredericton",
      priceCad: 419900,
      facts: ["6 bedrooms", "2 bathrooms", "2,559 sq ft"],
      latitude: 45.975843,
      longitude: -66.632754,
      mapImageUrl: "/system-ebook-preview/dw01/listing-highland.png",
    },
    {
      street: "185 Reynolds Street, Unit 33",
      town: "Fredericton",
      priceCad: 234900,
      facts: ["2 bedrooms", "1 bathroom", "1,200 sq ft"],
      latitude: 45.99527,
      longitude: -66.655973,
      mapImageUrl: "/system-ebook-preview/dw01/listing-reynolds.png",
    },
    {
      street: "764 Route 10",
      town: "Noonan",
      priceCad: 749900,
      facts: ["4 bedrooms", "5 bathrooms", "2,733 sq ft"],
      latitude: 45.967637,
      longitude: -66.483294,
      mapImageUrl: "/system-ebook-preview/dw01/listing-noonan.png",
    },
    {
      street: "37 Luanne Drive",
      town: "Waasis",
      priceCad: 265900,
      facts: ["3 bedrooms", "2 bathrooms", "1,184 sq ft"],
      latitude: 45.828974,
      longitude: -66.572634,
      mapImageUrl: "/system-ebook-preview/dw01/listing-waasis.png",
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
  logoPlate: "none",
  areas: ["Battleford", "Hafford", "St. Walburg"],
  coverMapUrl: "/system-ebook-preview/km01/cover.png",
  areaMapUrl: "/system-ebook-preview/km01/office.png",
  marketMapUrl: "/system-ebook-preview/km01/market.png",
  latitude: 52.780347,
  longitude: -108.299228,
  listings: [
    {
      street: "241 W 30th Street",
      town: "Battleford",
      priceCad: 69900,
      facts: ["Residential"],
      latitude: 52.737697,
      longitude: -108.303901,
      mapImageUrl: "/system-ebook-preview/km01/listing-30th.png",
    },
    {
      street: "351 26th Street",
      town: "Battleford",
      priceCad: 179900,
      facts: ["Residential"],
      latitude: 52.731955,
      longitude: -108.306818,
      mapImageUrl: "/system-ebook-preview/km01/listing-26th.png",
    },
    {
      street: "117 W Hudek Avenue",
      town: "Hafford",
      priceCad: 209900,
      facts: ["Residential"],
      latitude: 52.724359,
      longitude: -107.354523,
      mapImageUrl: "/system-ebook-preview/km01/listing-hafford.png",
    },
    {
      street: "144 E 3 Street",
      town: "St. Walburg",
      priceCad: 12900,
      facts: ["Land"],
      latitude: 53.633807,
      longitude: -109.196861,
      mapImageUrl: "/system-ebook-preview/km01/listing-walburg.png",
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
