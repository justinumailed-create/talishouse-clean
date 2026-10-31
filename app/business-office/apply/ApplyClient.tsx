"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useT } from "@/lib/i18n/client";
import { submitProposalAction, type ProposeRole } from "./actions";

const ROLES: readonly ProposeRole[] = ["referral", "resale", "fulfillment"];

const field =
  "mt-2 w-full rounded-2xl border border-black/10 bg-white px-4 py-3.5 text-[17px] text-[#1d1d1f] outline-none transition focus:border-[#0071e3] focus:ring-4 focus:ring-[#0071e3]/15";

/**
 * Propose a Project (Oct 31 redesign): one calm column, a large headline,
 * four fields and a single primary button.
 */
export default function ApplyClient() {
  const t = useT().propose;
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [role, setRole] = useState<ProposeRole | "">("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, start] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim() || !email.trim() || !location.trim() || !role) {
      setError(t.required);
      return;
    }
    start(async () => {
      const res = await submitProposalAction({ name, email, phone, location, role });
      if (res.ok) setDone(true);
      else setError(t[res.error]);
    });
  }

  return (
    <main data-testid="propose-project" className="min-h-screen bg-[#fbfbfd] text-[#1d1d1f]">
      <div className="mx-auto w-full max-w-[560px] px-6 pb-28 pt-20 sm:pt-28" style={{ maxWidth: 608 }}>
        {done ? (
          <div data-testid="propose-project-done" className="text-center">
            <h1 className="text-[44px] font-semibold leading-[1.05] tracking-[-0.02em] sm:text-[56px]">{t.doneTitle}</h1>
            <p className="mx-auto mt-5 max-w-[440px] text-[19px] leading-relaxed text-[#6e6e73]">{t.doneBody}</p>
            <Link
              href="/talisu/value-added"
              className="mt-10 inline-flex text-[17px] font-medium text-[#0071e3] hover:underline"
            >
              {t.doneBack} ›
            </Link>
          </div>
        ) : (
          <>
            <p className="text-[14px] font-semibold uppercase tracking-[0.18em] text-[#6e6e73]">{t.kicker}</p>
            <h1 className="mt-3 text-[44px] font-semibold leading-[1.05] tracking-[-0.02em] sm:text-[56px]">{t.title}</h1>
            <p className="mt-5 text-[19px] leading-relaxed text-[#6e6e73]">{t.lead}</p>

            <form onSubmit={submit} className="mt-14 space-y-7" noValidate>
              <label className="block text-[15px] font-medium">
                {t.name}
                <input className={field} value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" maxLength={120} data-testid="propose-name" />
              </label>
              <label className="block text-[15px] font-medium">
                {t.email}
                <input className={field} type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" maxLength={254} data-testid="propose-email" />
              </label>
              <label className="block text-[15px] font-medium">
                {t.location}
                <input className={field} value={location} onChange={(e) => setLocation(e.target.value)} autoComplete="address-level2" maxLength={200} data-testid="propose-location" />
              </label>
              <label className="block text-[15px] font-medium">
                {t.phone}
                <input className={field} type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" maxLength={40} data-testid="propose-phone" />
              </label>

              <fieldset>
                <legend className="text-[15px] font-medium">{t.role}</legend>
                <div className="mt-3 space-y-3" role="radiogroup">
                  {ROLES.map((id) => {
                    const on = role === id;
                    return (
                      <button
                        key={id}
                        type="button"
                        role="radio"
                        aria-checked={on}
                        data-testid={`propose-role-${id}`}
                        onClick={() => setRole(id)}
                        className={`block w-full rounded-2xl border px-5 py-4 text-left transition ${
                          on ? "border-[#0071e3] bg-white ring-4 ring-[#0071e3]/15" : "border-black/10 bg-white hover:border-black/25"
                        }`}
                      >
                        <span className="block text-[17px] font-semibold">{t.roles[id].title}</span>
                        <span className="mt-0.5 block text-[15px] text-[#6e6e73]">{t.roles[id].body}</span>
                      </button>
                    );
                  })}
                </div>
              </fieldset>

              {error ? (
                <p role="alert" data-testid="propose-error" className="text-[15px] text-[#d70015]">{error}</p>
              ) : null}

              <button
                type="submit"
                disabled={pending}
                data-testid="propose-submit"
                className="w-full rounded-full bg-[#0071e3] py-4 text-[17px] font-medium text-white transition hover:bg-[#0077ed] disabled:opacity-60"
              >
                {pending ? t.sending : t.submit}
              </button>
              <p className="text-center text-[13px] text-[#86868b]">{t.note}</p>
            </form>
          </>
        )}
      </div>
    </main>
  );
}
