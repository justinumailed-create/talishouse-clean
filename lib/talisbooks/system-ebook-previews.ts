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
      story:
        "Highland Avenue is a six-bedroom house on Fredericton's north side, with two bathrooms and 2,559 sq ft. The street runs near the river and the older North Devon blocks, close to schools and a short drive from the Union Street office.",
      latitude: 45.975843,
      longitude: -66.632754,
      mapImageUrl: "/system-ebook-preview/dw01/listing-highland.png",
    },
    {
      street: "185 Reynolds Street, Unit 33",
      town: "Fredericton",
      priceCad: 234900,
      facts: ["2 bedrooms", "1 bathroom", "1,200 sq ft"],
      story:
        "A smaller house on Reynolds Street: two bedrooms, one bathroom, and 1,200 sq ft. It sits in Fredericton's north end, on a residential block rather than a commercial strip.",
      latitude: 45.99527,
      longitude: -66.655973,
      mapImageUrl: "/system-ebook-preview/dw01/listing-reynolds.png",
    },
    {
      street: "764 Route 10",
      town: "Noonan",
      priceCad: 749900,
      facts: ["4 bedrooms", "5 bathrooms", "2,733 sq ft"],
      story:
        "In Noonan, east of Fredericton, this four-bedroom house has five bathrooms and 2,733 sq ft. Route 10 is a quieter setting than the city, with open land between the community and town.",
      latitude: 45.967637,
      longitude: -66.483294,
      mapImageUrl: "/system-ebook-preview/dw01/listing-noonan.png",
    },
    {
      street: "37 Luanne Drive",
      town: "Waasis",
      priceCad: 265900,
      facts: ["3 bedrooms", "2 bathrooms", "1,184 sq ft"],
      story:
        "Waasis is a small community south of Fredericton. The house on Luanne Drive has three bedrooms, two bathrooms, and 1,184 sq ft, on a residential street rather than a highway lot.",
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
      story:
        "A residential property on 30th Street in Battleford, on the south bank of the North Saskatchewan. The town shares shops and schools with North Battleford, a few kilometres across the river from the office.",
      latitude: 52.737697,
      longitude: -108.303901,
      mapImageUrl: "/system-ebook-preview/km01/listing-30th.png",
    },
    {
      street: "351 26th Street",
      town: "Battleford",
      priceCad: 179900,
      facts: ["Residential"],
      story:
        "26th Street is part of Battleford's older residential grid. Houses here sit between the river and the highway, a short drive from the 100th Street office in North Battleford.",
      latitude: 52.731955,
      longitude: -108.306818,
      mapImageUrl: "/system-ebook-preview/km01/listing-26th.png",
    },
    {
      street: "117 W Hudek Avenue",
      town: "Hafford",
      priceCad: 209900,
      facts: ["Residential"],
      story:
        "Hafford is a prairie town about 64 km east of North Battleford, and this is a house on Hudek Avenue. Grain fields surround a short main street, with homes set on wide lots.",
      latitude: 52.724359,
      longitude: -107.354523,
      mapImageUrl: "/system-ebook-preview/km01/listing-hafford.png",
    },
    {
      street: "144 E 3 Street",
      town: "St. Walburg",
      priceCad: 12900,
      facts: ["Land"],
      story:
        "Land on 3rd Street in St. Walburg, a small service town northwest of the Battlefords. Farm country surrounds the community, more than 100 km from the North Battleford office.",
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

/**
 * dw01 and km01 were approved as these pages. The live sites watermark their
 * listing photos, so the book keeps the Talismaps™ stills and the write-ups
 * from that review instead of swapping in a later crawl.
 */
export function approvedSystemEbookProfile(fastCode: string): SystemEbookProfile | null {
  const code = fastCode.trim().toLowerCase();
  if (code === "dw01") return DW01;
  if (code === "km01") return KM01;
  return null;
}
