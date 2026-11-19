"use client";

import Image from "next/image";
import { useState } from "react";

const PHOTOS = [
  { src: "/images/talishouse/residential/hero.jpg", alt: "Front of the sample home" },
  { src: "/images/mapsites/lrg1-gallery/01.png", alt: "Living room in the sample home" },
  { src: "/images/mapsites/lrg1-gallery/03.png", alt: "Another room in the sample home" },
  { src: "/images/kitchen/KC01.png", alt: "Kitchen in the sample home" },
  { src: "/images/bath/TL01.png", alt: "Bathroom in the sample home" },
];

const HIGHLIGHTS = [
  "Quiet residential street, 2 km from downtown Halifax.",
  "186 m² on one level, with a bright kitchen and two baths.",
  "Listed in CAD through Tsplits™, then posted to Properstar with a voice pitch.",
];

export default function FsboSampleListing() {
  const [photo, setPhoto] = useState(0);
  const [pitchOpen, setPitchOpen] = useState(false);
  const [contactNote, setContactNote] = useState("");
  const current = PHOTOS[photo] ?? PHOTOS[0];

  return (
    <div className="mx-auto grid max-w-6xl gap-8 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:py-10">
      <div>
        <div className="overflow-hidden rounded-3xl bg-neutral-200">
          <Image
            src={current.src}
            alt={current.alt}
            width={1200}
            height={800}
            className="h-[280px] w-full object-cover sm:h-[420px]"
            priority
          />
        </div>
        <div className="mt-3 flex gap-2 overflow-x-auto">
          {PHOTOS.map((item, index) => (
            <button
              key={item.src}
              type="button"
              aria-label={item.alt}
              onClick={() => setPhoto(index)}
              className={`h-16 w-20 shrink-0 overflow-hidden rounded-xl ring-2 ${
                index === photo ? "ring-[#046BD9]" : "ring-transparent"
              }`}
            >
              <Image src={item.src} alt="" width={160} height={120} className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      </div>

      <article>
        <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-[#046BD9]">Sample listing</p>
        <h1 className="mt-2 text-[32px] font-semibold leading-tight tracking-[-0.03em] text-neutral-950">
          Sample home in Halifax
        </h1>
        <p className="mt-2 text-[28px] font-semibold text-neutral-950">$649,000 CAD</p>
        <dl className="mt-4 grid grid-cols-2 gap-3 text-[14px] text-neutral-800">
          <Detail term="Type" value="Residential" />
          <Detail term="Size" value="186 m²" />
          <Detail term="Beds" value="3" />
          <Detail term="Baths" value="2" />
          <Detail term="Location" value="Halifax, Nova Scotia, Canada" />
          <Detail term="Distance" value="2 km from downtown" />
        </dl>
        <h2 className="mt-6 text-[18px] font-semibold text-neutral-950">Description</h2>
        <p className="mt-2 text-[15px] leading-relaxed text-neutral-800">
          A one-level home on a quiet street in Halifax. The owner is selling it directly through Tsplits™.
          A Listings Manager reviews the listing and posts it to Properstar with a voice pitch.
        </p>
        <h2 className="mt-6 text-[18px] font-semibold text-neutral-950">Highlights for the voice pitch</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-[15px] leading-relaxed text-neutral-800">
          {HIGHLIGHTS.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
        <div className="mt-6 flex flex-wrap gap-2">
          <button
            type="button"
            className="inline-flex min-h-11 items-center rounded-full bg-neutral-950 px-4 text-[14px] font-semibold text-white"
            onClick={() => setContactNote("Sample WhatsApp link. It is not connected.")}
          >
            WhatsApp
          </button>
          <button
            type="button"
            className="inline-flex min-h-11 items-center rounded-full bg-white px-4 text-[14px] font-semibold text-neutral-950 ring-1 ring-black/10"
            onClick={() => setContactNote("Sample Telegram link. It is not connected.")}
          >
            Telegram
          </button>
        </div>
        {contactNote ? (
          <p className="mt-3 text-[14px] text-neutral-700" data-testid="fsbo-contact-note">
            {contactNote}
          </p>
        ) : null}
      </article>

      <div className="fixed bottom-4 left-4 z-30 max-w-[min(22rem,calc(100vw-2rem))] sm:bottom-6 sm:left-6">
        {pitchOpen ? (
          <div
            className="rounded-2xl bg-white p-4 text-[14px] leading-relaxed text-neutral-900 shadow-[0_12px_28px_rgba(0,0,0,0.18)]"
            data-testid="fsbo-voice-preview"
          >
            <p className="font-semibold">Voice pitch preview</p>
            <p className="mt-2">
              This sample home in Halifax is 186 m², with 3 beds and 2 baths, 2 km from downtown. The asking price is $649,000 CAD.
            </p>
            <button
              type="button"
              className="mt-3 text-[13px] font-semibold text-[#046BD9]"
              onClick={() => setPitchOpen(false)}
            >
              Close
            </button>
          </div>
        ) : (
          <button
            type="button"
            className="flex items-end gap-2 text-left"
            data-testid="fsbo-voice-bubble"
            onClick={() => setPitchOpen(true)}
          >
            <span className="max-w-[16rem] rounded-2xl bg-white px-3 py-2 text-[14px] leading-snug text-neutral-900 shadow-[0_12px_28px_rgba(0,0,0,0.16)]">
              I can walk you through this listing. Start a call.
            </span>
            <Image
              src="/images/mapsites/aisha-c.webp"
              alt="Aisha"
              width={56}
              height={56}
              className="h-14 w-14 rounded-full object-cover ring-2 ring-white"
            />
          </button>
        )}
      </div>
    </div>
  );
}

function Detail({ term, value }: { term: string; value: string }) {
  return (
    <div className="rounded-xl bg-neutral-50 px-3 py-2">
      <dt className="text-[11px] font-semibold uppercase tracking-wide text-neutral-500">{term}</dt>
      <dd className="mt-0.5 text-[15px] font-medium text-neutral-950">{value}</dd>
    </div>
  );
}
