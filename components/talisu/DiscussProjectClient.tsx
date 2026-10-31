"use client";

import { useId, useState } from "react";
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

const FIELD =
  "mt-2 block w-full rounded-2xl border border-black/10 bg-white px-4 py-3.5 text-[17px] text-[#1d1d1f] outline-none transition focus:border-[#0071e3] focus:ring-4 focus:ring-[#0071e3]/15";
const LABEL = "block text-[13px] font-medium text-[#1d1d1f]";

/**
 * /talisu/discuss — "Share a Project Vision" (Arun, Oct 31 redesign): one calm
 * column, a large headline, the transaction structure as four quiet choices,
 * five fields and a single primary button. Submits to /api/ownership-contact
 * (channel "discuss-page"), which saves the lead and emails the team.
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
    <div className="bg-[#fbfbfd] px-6 pb-28 pt-20 text-[#1d1d1f] antialiased sm:pt-28" data-testid="talisu-discuss">
      <div className="mx-auto w-full max-w-[560px]" data-testid="talisu-discuss-content">
        {done ? (
          <div className="py-16 text-center" data-testid="discuss-done">
            <h1 className="text-[40px] font-semibold leading-[1.08] tracking-[-0.03em] sm:text-[48px]">
              {c.thanks}
            </h1>
            <p className="mt-5 text-[19px] leading-relaxed text-[#6e6e73]">
              {fmt(c.advisor, { topic: topicLabel })}
            </p>
            <Link href="/" className="mt-10 inline-block text-[17px] text-[#0066cc] hover:underline">
              {c.pageDoneBack} ›
            </Link>
          </div>
        ) : (
          <>
            <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#6e6e73]">{c.pageKicker}</p>
            <h1 className="mt-3 text-[44px] font-semibold leading-[1.05] tracking-[-0.035em] sm:text-[56px]">
              {c.pageTitle}.
            </h1>
            <p className="mt-5 text-[19px] leading-relaxed text-[#6e6e73]">{c.pageLead}</p>

            <form onSubmit={submit} noValidate={false} className="mt-14 space-y-7">
              <fieldset data-testid="discuss-topic" data-topic={topic}>
                <legend className={LABEL}>{c.topic}</legend>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {OWNERSHIP_CONTACT_TOPICS.map((option) => {
                    const on = option === topic;
                    return (
                      <button
                        key={option}
                        type="button"
                        aria-pressed={on}
                        onClick={() => setTopic(option)}
                        data-testid={`discuss-topic-${option.toLowerCase()}`}
                        className={`rounded-2xl border px-4 py-3.5 text-left text-[15px] font-medium transition ${
                          on
                            ? "border-[#0071e3] bg-[#0071e3]/[0.06] text-[#1d1d1f] ring-1 ring-[#0071e3]"
                            : "border-black/10 bg-white text-[#1d1d1f] hover:border-black/25"
                        }`}
                      >
                        {(c.topics as Record<string, string>)[option] ?? option}
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
                  <div className="mt-2 flex items-start justify-between gap-3 rounded-2xl border border-[#0071e3]/30 bg-[#0071e3]/[0.05] px-4 py-3.5">
                    <div className="min-w-0">
                      <p className="text-[17px] font-medium" data-testid="discuss-location-value">{location}</p>
                      <p className="text-[12px] text-[#0066cc]">{c.locationVerified}</p>
                    </div>
                    <button type="button" className="shrink-0 text-[15px] text-[#0066cc] hover:underline"
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
                <p className="mt-1.5 text-right text-[12px] tabular-nums text-[#86868b]" aria-live="polite">
                  {fmt(c.projectCounter, { count: message.length, max: OWNERSHIP_CONTACT_MESSAGE_MAX })}
                </p>
              </div>

              {error ? (
                <p className="text-[15px] text-red-600" role="alert" data-testid="discuss-error">{error}</p>
              ) : null}

              <button type="submit" disabled={sending} data-testid="discuss-submit"
                className="w-full rounded-full bg-[#0071e3] px-6 py-4 text-[17px] font-medium text-white transition hover:bg-[#0077ed] disabled:opacity-60">
                {sending ? c.sending : c.pageSubmit}
              </button>
              <p className="text-center text-[13px] text-[#86868b]">{c.pageNote}</p>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
