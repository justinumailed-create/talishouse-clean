"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { FSBO_SAMPLE_PATH } from "@/lib/fsbo/mock-paths";

const CURRENCIES = ["CAD", "USD", "EUR", "GBP"] as const;

type Contact = "whatsapp" | "telegram" | "email";
type Kind = "residential" | "commercial";
type Registrant = "registrant" | "non-registrant";
type SizeUnit = "sqft" | "m2";

const field =
  "mt-1 w-full rounded-xl border border-neutral-300 bg-white px-3 py-2.5 text-[15px] text-neutral-950 outline-none focus:border-[#046BD9]";
const label = "block text-[13px] font-medium text-neutral-800";

export default function FsboIntakeForm() {
  const [sent, setSent] = useState(false);
  const [contact, setContact] = useState<Contact>("whatsapp");
  const [kind, setKind] = useState<Kind>("residential");
  const [registrant, setRegistrant] = useState<Registrant>("non-registrant");
  const [currency, setCurrency] = useState<(typeof CURRENCIES)[number]>("CAD");
  const [sizeUnit, setSizeUnit] = useState<SizeUnit>("m2");
  const [photoNote, setPhotoNote] = useState("");

  function submit(event: FormEvent) {
    event.preventDefault();
    setSent(true);
  }

  if (sent) {
    return (
      <section
        className="rounded-3xl border border-neutral-200 bg-white px-6 py-10 text-center shadow-sm sm:px-10"
        data-testid="fsbo-confirmation"
      >
        <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-[#046BD9]">
          Sample confirmation
        </p>
        <h2 className="mt-3 text-[28px] font-semibold tracking-[-0.03em] text-neutral-950">
          Thank you. A Listings Manager will review this listing.
        </h2>
        <p className="mx-auto mt-3 max-w-md text-[16px] leading-relaxed text-neutral-700">
          When it is approved, Tsplits™ posts it to Properstar with a voice pitch. These details were not saved.
        </p>
        <button
          type="button"
          className="mt-6 inline-flex min-h-11 items-center rounded-full bg-[#046BD9] px-5 text-[15px] font-semibold text-white"
          onClick={() => setSent(false)}
        >
          Back to the form
        </button>
      </section>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-6" data-testid="fsbo-intake">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className={label}>
          Owner name
          <input required name="owner" className={field} autoComplete="name" />
        </label>
        <fieldset>
          <legend className={label}>Preferred contact</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {(
              [
                ["whatsapp", "WhatsApp"],
                ["telegram", "Telegram"],
                ["email", "Email"],
              ] as const
            ).map(([value, text]) => (
              <label key={value} className="inline-flex items-center gap-2 text-[14px]">
                <input
                  type="radio"
                  name="contact"
                  checked={contact === value}
                  onChange={() => setContact(value)}
                />
                {text}
              </label>
            ))}
          </div>
          <input
            required
            name="contactValue"
            className={field}
            placeholder={contact === "email" ? "name@email.com" : "Number or username"}
            aria-label="Contact value"
          />
        </fieldset>
      </div>

      <fieldset>
        <legend className={label}>Property type</legend>
        <div className="mt-2 flex gap-4 text-[14px]">
          {(
            [
              ["residential", "Residential"],
              ["commercial", "Commercial"],
            ] as const
          ).map(([value, text]) => (
            <label key={value} className="inline-flex items-center gap-2">
              <input type="radio" name="kind" checked={kind === value} onChange={() => setKind(value)} />
              {text}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className={label}>
          Address
          <input required name="address" className={field} />
        </label>
        <label className={label}>
          City
          <input required name="city" className={field} />
        </label>
        <label className={label}>
          Country
          <input required name="country" className={field} defaultValue="Canada" />
        </label>
        <div>
          <span className={label}>Asking price</span>
          <div className="mt-1 flex gap-2">
            <input required name="price" inputMode="decimal" className={`${field} mt-0`} />
            <select
              name="currency"
              aria-label="Currency"
              value={currency}
              onChange={(event) => setCurrency(event.target.value as (typeof CURRENCIES)[number])}
              className="rounded-xl border border-neutral-300 bg-white px-3 text-[15px]"
            >
              {CURRENCIES.map((code) => (
                <option key={code} value={code}>
                  {code}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <span className={label}>Size</span>
          <div className="mt-1 flex gap-2">
            <input required name="size" inputMode="decimal" className={`${field} mt-0`} />
            <select
              aria-label="Size unit"
              value={sizeUnit}
              onChange={(event) => setSizeUnit(event.target.value as SizeUnit)}
              className="rounded-xl border border-neutral-300 bg-white px-2 text-[15px]"
            >
              <option value="m2">m²</option>
              <option value="sqft">sq ft</option>
            </select>
          </div>
        </div>
        <label className={label}>
          Beds (optional)
          <input name="beds" inputMode="numeric" className={field} />
        </label>
        <label className={label}>
          Baths (optional)
          <input name="baths" inputMode="numeric" className={field} />
        </label>
      </div>

      <label className={label}>
        Short description
        <textarea required name="description" rows={4} className={field} />
      </label>
      <label className={label}>
        Highlights for the voice pitch
        <textarea required name="highlights" rows={3} className={field} />
      </label>

      <div className="rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 px-4 py-5">
        <p className={label}>Photo</p>
        <p className="mt-1 text-[13px] text-neutral-600">Add a photo of the property. This preview does not upload it.</p>
        <button
          type="button"
          className="mt-3 inline-flex min-h-10 items-center rounded-full border border-neutral-300 bg-white px-4 text-[14px] font-semibold"
          onClick={() => setPhotoNote(photoNote ? "" : "Photo marked for this preview. It was not uploaded.")}
        >
          Add a photo
        </button>
        {photoNote ? <p className="mt-2 text-[13px] text-neutral-700">{photoNote}</p> : null}
      </div>

      <fieldset className="rounded-2xl border border-neutral-200 p-4">
        <legend className="px-1 text-[12px] font-semibold uppercase tracking-[0.14em] text-neutral-500">
          Example pricing
        </legend>
        <div className="mt-2 grid gap-3 sm:grid-cols-2">
          <PriceChoice
            value="non-registrant"
            current={registrant}
            onChange={setRegistrant}
            title="Non-Registrant"
            price="$200 CAD setup plus $100 CAD a month"
          />
          <PriceChoice
            value="registrant"
            current={registrant}
            onChange={setRegistrant}
            title="Registrant"
            price="$100 CAD setup plus $50 CAD a month"
          />
        </div>
      </fieldset>

      <p className="text-[14px] leading-relaxed text-neutral-700">
        A Listings Manager reviews the listing and posts it to Properstar with a voice pitch.
      </p>

      <div className="flex flex-wrap items-center gap-4">
        <button
          type="submit"
          className="inline-flex min-h-12 items-center rounded-full bg-[#046BD9] px-6 text-[16px] font-semibold text-white"
        >
          Submit listing
        </button>
        <Link href={FSBO_SAMPLE_PATH} className="text-[14px] font-semibold text-[#046BD9]">
          View a sample listing
        </Link>
      </div>
    </form>
  );
}

function PriceChoice({
  value,
  current,
  onChange,
  title,
  price,
}: {
  value: Registrant;
  current: Registrant;
  onChange: (value: Registrant) => void;
  title: string;
  price: string;
}) {
  const selected = current === value;
  return (
    <label
      className={`block cursor-pointer rounded-2xl border px-4 py-3 ${
        selected ? "border-[#046BD9] bg-[#046BD9]/5" : "border-neutral-200 bg-white"
      }`}
    >
      <span className="flex items-center gap-2 text-[15px] font-semibold text-neutral-950">
        <input type="radio" name="registrant" checked={selected} onChange={() => onChange(value)} />
        {title}
      </span>
      <span className="mt-1 block text-[14px] text-neutral-700">{price}</span>
    </label>
  );
}
