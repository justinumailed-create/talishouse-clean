"use client";

import { useId, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import MapSitePlaceSearch, {
  getMapSitePlacesApiKey,
} from "@/components/talispros/mapsite/MapSitePlaceSearch";
import {
  OWNERSHIP_CONTACT_LOCATION_MAX,
  OWNERSHIP_CONTACT_MESSAGE_MAX,
  OWNERSHIP_CONTACT_TOPICS,
  type OwnershipContactTopic,
} from "@/lib/talispros/ownership-contact";
import { formatNanpPhoneInput, isValidNanpPhone } from "@/lib/talispros/nanp-phone";
import { en } from "@/lib/i18n/dictionaries/en";
import { useT } from "@/lib/i18n/client";
import { fmt } from "@/lib/i18n/format";
import { ADVISER_METAL_BG } from "@/components/talisu/AdviserLayout";
import {
  METAL_TAB,
  METAL_TAB_LABEL,
  METAL_TAB_SELECTED,
  METAL_TAB_SHEEN,
  METAL_TAB_UNSELECTED,
} from "@/components/talisu/metal-tab";

const FIELD =
  "mt-2 block w-full rounded-2xl border border-black/10 bg-white px-4 py-3.5 text-[17px] text-[#1d1d1f] outline-none transition focus:border-neutral-700 focus:ring-4 focus:ring-neutral-700/15";
const LABEL = "block text-[13px] font-medium text-[#1d1d1f]";

/** Staked-out lakeside lot with a modular cabin (generated for this page, Nov 1). */
export const DISCUSS_VISION_IMAGE = "/talisu/discuss-project-vision.webp";

/**
 * /talisu/discuss — "Share a Project Vision". Split layout like Aisha's
 * /talisu/reg (Arun, Nov 1): a large photo on the left half, the form on the
 * right half on a warm ivory surface; on phones the photo sits above the form.
 * Transaction structure as four metal choices, five fields and a single
 * primary button. Submits to /api/ownership-contact (channel "discuss-page"),
 * which saves the lead and emails the team.
 */
export default function DiscussProjectClient({ topic: initialTopic }: { topic: OwnershipContactTopic }) {
  const t = useT();
  const c = t.contactForm;
  const id = useId();
  const [topic, setTopic] = useState<OwnershipContactTopic>(initialTopic);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [location, setLocation] = useState("");
  const [locationVerified, setLocationVerified] = useState(false);
  const [placesAvailable, setPlacesAvailable] = useState(() => Boolean(getMapSitePlacesApiKey()));
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);

  const phoneInvalid = phoneTouched && !isValidNanpPhone(phone);
  const topicLabel = (c.topics as Record<string, string>)[topic] ?? topic;

  function localize(apiError: string | undefined): string {
    const s = en.contactForm;
    if (apiError === s.apiErrors.required) return c.apiErrors.required;
    if (apiError === s.apiErrors.email) return c.apiErrors.email;
    if (apiError === s.apiErrors.save) return c.apiErrors.save;
    if (apiError === s.apiErrors.tooLong) return c.apiErrors.tooLong;
    if (apiError === s.phoneError) return c.phoneError;
    if (apiError === s.locationRequired) return c.locationRequired;
    return c.genericError;
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setPhoneTouched(true);
    setError(null);
    if (!isValidNanpPhone(phone)) return;
    if (!location.trim()) {
      setError(c.locationRequired);
      return;
    }
    setSending(true);
    try {
      const res = await fetch("/api/ownership-contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          phone,
          message,
          topic,
          location: location.trim(),
          locationVerified,
          channel: "discuss-page",
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setError(localize(data.error));
        return;
      }
      setDone(true);
    } catch {
      setError(c.networkError);
    } finally {
      setSending(false);
    }
  }

  return (
    <div
      className="talis-discuss-surface text-[#1d1d1f] antialiased"
      style={{ minHeight: "calc(100dvh - 68px)" }}
      data-testid="talisu-discuss"
    >
      <article className="grid w-full lg:grid-cols-2">
        <div
          className="relative h-64 overflow-hidden bg-[#2a2a2a] sm:h-80 lg:sticky lg:top-[68px] lg:h-[calc(100dvh-68px)]"
          data-testid="talisu-discuss-photo"
        >
          <Image
            src={DISCUSS_VISION_IMAGE}
            alt={c.pageImageAlt}
            fill
            priority
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="object-cover"
            style={{ objectPosition: "center 60%" }}
          />
        </div>
        <div className="min-w-0 px-6 pb-24 pt-12 sm:px-10 sm:pt-16 lg:px-14 lg:pb-28 lg:pt-20">
          <div className="mx-auto w-full max-w-[560px]" style={{ maxWidth: 560 }} data-testid="talisu-discuss-content">
            {done ? (
              <div className="py-16 text-center" data-testid="discuss-done">
                <h1 className="text-[40px] font-semibold leading-[1.08] tracking-[-0.03em] sm:text-[48px]">
                  {c.thanks}
                </h1>
                <p className="mt-5 text-[19px] leading-relaxed text-neutral-600">
                  {fmt(c.advisor, { topic: topicLabel })}
                </p>
                <Link href="/" className="mt-10 inline-block text-[17px] text-neutral-900 underline-offset-2 hover:underline">
                  {c.pageDoneBack} ›
                </Link>
              </div>
            ) : (
              <>
                <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-neutral-600">{c.pageKicker}</p>
                <h1 className="mt-3 text-[40px] font-semibold leading-[1.05] tracking-[-0.035em] sm:text-[52px]">
                  {c.pageTitle}.
                </h1>
                <p className="mt-5 text-[19px] leading-relaxed text-neutral-600">{c.pageLead}</p>

                <form onSubmit={submit} noValidate={false} className="mt-14 space-y-7">
                  <fieldset data-testid="discuss-topic" data-topic={topic}>
                    <legend className={LABEL}>{c.topic}</legend>
                    <div className="mt-2 grid grid-cols-2 gap-2.5">
                      {OWNERSHIP_CONTACT_TOPICS.map((option) => {
                        const on = option === topic;
                        return (
                          <button
                            key={option}
                            type="button"
                            aria-pressed={on}
                            onClick={() => setTopic(option)}
                            data-testid={`discuss-topic-${option.toLowerCase()}`}
                            className={`${METAL_TAB} ${on ? METAL_TAB_SELECTED : METAL_TAB_UNSELECTED} cursor-pointer`}
                            style={{ backgroundImage: ADVISER_METAL_BG }}
                          >
                            <span className={METAL_TAB_SHEEN} aria-hidden />
                            <span className={`${METAL_TAB_LABEL} whitespace-nowrap`}>
                              {(c.topics as Record<string, string>)[option] ?? option}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </fieldset>

                  <div>
                    <label htmlFor={`${id}-name`} className={LABEL}>{c.name}</label>
                    <input id={`${id}-name`} data-testid="discuss-name" type="text" required autoComplete="name"
                      value={name} onChange={(e) => setName(e.target.value)} className={FIELD} />
                  </div>
                  <div>
                    <label htmlFor={`${id}-email`} className={LABEL}>{c.email}</label>
                    <input id={`${id}-email`} data-testid="discuss-email" type="email" required autoComplete="email"
                      value={email} onChange={(e) => setEmail(e.target.value)} className={FIELD} />
                  </div>
                  <div>
                    <label htmlFor={`${id}-phone`} className={LABEL}>{c.phone}</label>
                    <input id={`${id}-phone`} data-testid="discuss-phone" type="tel" required inputMode="tel"
                      autoComplete="tel-national" value={phone}
                      onChange={(e) => setPhone(formatNanpPhoneInput(e.target.value))}
                      onBlur={() => setPhoneTouched(true)} aria-invalid={phoneInvalid}
                      className={`${FIELD} ${phoneInvalid ? "border-red-500" : ""}`} />
                    {phoneInvalid ? (
                      <p className="mt-2 text-[13px] text-red-600" role="alert">{c.phoneError}</p>
                    ) : null}
                  </div>
                  <div data-testid="discuss-location">
                    <p className={LABEL}>{c.location}</p>
                    {location && locationVerified ? (
                      <div className="mt-2 flex items-start justify-between gap-3 rounded-2xl border border-black/10 bg-white/80 px-4 py-3.5">
                        <div className="min-w-0">
                          <p className="text-[17px] font-medium" data-testid="discuss-location-value">{location}</p>
                          <p className="text-[12px] text-neutral-900 underline-offset-2">{c.locationVerified}</p>
                        </div>
                        <button type="button" className="shrink-0 text-[15px] text-neutral-900 underline-offset-2 hover:underline"
                          onClick={() => { setLocation(""); setLocationVerified(false); }}>
                          {c.locationChange}
                        </button>
                      </div>
                    ) : placesAvailable ? (
                      <div className="mt-2">
                        <MapSitePlaceSearch
                          label={c.location}
                          placeholder=""
                          noResults={c.locationNoResults}
                          inputClassName={FIELD.replace("mt-2 ", "")}
                          onAvailabilityChange={setPlacesAvailable}
                          onSelect={(place) => {
                            setLocation(place.formattedAddress.slice(0, OWNERSHIP_CONTACT_LOCATION_MAX));
                            setLocationVerified(true);
                          }}
                        />
                      </div>
                    ) : (
                      <input type="text" data-testid="discuss-location-input" aria-label={c.location} required
                        maxLength={OWNERSHIP_CONTACT_LOCATION_MAX} value={location}
                        onChange={(e) => { setLocation(e.target.value); setLocationVerified(false); }}
                        className={FIELD} />
                    )}
                  </div>
                  <div>
                    <label htmlFor={`${id}-message`} className={LABEL}>{c.pageVision}</label>
                    <textarea id={`${id}-message`} data-testid="discuss-message" required rows={4}
                      maxLength={OWNERSHIP_CONTACT_MESSAGE_MAX} value={message}
                      onChange={(e) => setMessage(e.target.value.slice(0, OWNERSHIP_CONTACT_MESSAGE_MAX))}
                      className={`${FIELD} resize-none leading-relaxed`} />
                    <p className="mt-1.5 text-right text-[12px] tabular-nums text-neutral-600" aria-live="polite">
                      {fmt(c.projectCounter, { count: message.length, max: OWNERSHIP_CONTACT_MESSAGE_MAX })}
                    </p>
                  </div>

                  {error ? (
                    <p className="text-[15px] text-red-600" role="alert" data-testid="discuss-error">{error}</p>
                  ) : null}

                  <button
                    type="submit"
                    disabled={sending}
                    data-testid="discuss-submit"
                    className={`${METAL_TAB} ${METAL_TAB_UNSELECTED} cursor-pointer disabled:opacity-60`}
                    style={{ backgroundImage: ADVISER_METAL_BG }}
                  >
                    <span className={METAL_TAB_SHEEN} aria-hidden />
                    <span className={`${METAL_TAB_LABEL} whitespace-nowrap`}>
                      {sending ? c.sending : c.pageSubmit}
                    </span>
                  </button>
                  <p className="text-center text-[13px] text-neutral-600">{c.pageNote}</p>
                </form>
              </>
            )}
          </div>
        </div>
      </article>
    </div>
  );
}
