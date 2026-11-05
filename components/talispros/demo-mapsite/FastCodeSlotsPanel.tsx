"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { useLocale, useT } from "@/lib/i18n/client";
import {
  addFastCodeSlotAction,
  openProspectMapsiteAction,
  removeFastCodeSlotAction,
} from "@/app/talispros/demo-mapsite/slots-actions";
import {
  formatSlotAddedDate,
  slotPlaceLabel,
  type FastCodeSlotsPanelData,
  type OwnSlotList,
  type SlotEntry,
} from "@/lib/talispros/fast-code-slots";

type SlotsCopy = ReturnType<typeof useT>["demo"]["slots"];

/** Prospect logo, or a two-letter badge when the image is missing or broken. */
function SlotMark({ entry }: { entry: SlotEntry }) {
  const [broken, setBroken] = useState(false);
  if (!entry.logoUrl || broken) {
    return (
      <span
        aria-hidden
        data-testid="fast-code-slot-initials"
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#e8f1fc] text-[10px] font-semibold tracking-wide text-[#046BD9] ring-1 ring-[#046BD9]/15"
      >
        {entry.initials}
      </span>
    );
  }
  return (
    <span className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white ring-1 ring-black/10">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={entry.logoUrl}
        alt=""
        className="h-full w-full object-contain"
        data-testid="fast-code-slot-logo"
        onError={() => setBroken(true)}
      />
    </span>
  );
}

/** One compact strip: logo, FAST Code, realty name, date. Town only when the rail is wide. */
function SlotIdentity({ entry }: { entry: SlotEntry }) {
  const added = formatSlotAddedDate(entry.addedAt, useLocale());
  const place = slotPlaceLabel(entry.town, entry.province);
  const showPlace = Boolean(place) && place !== entry.brokerage;
  return (
    <>
      <SlotMark entry={entry} />
      <span className="shrink-0 font-mono text-[13px] font-semibold tracking-wide text-[#046BD9] group-hover:underline">
        {entry.fastCode}
      </span>
      <span className="flex min-w-0 flex-1 items-baseline gap-2">
        <span className="truncate text-[14px] font-medium text-neutral-950" data-testid="fast-code-slot-brokerage">
          {entry.brokerage}
        </span>
        {showPlace ? (
          <span className="hidden shrink-0 truncate text-[12px] text-neutral-500 lg:inline" data-testid="fast-code-slot-place">
            {place}
          </span>
        ) : null}
      </span>
      {added ? (
        <time
          dateTime={entry.addedAt ?? undefined}
          className="ml-auto shrink-0 pl-2 text-[12px] tabular-nums text-neutral-500"
          data-testid="fast-code-slot-added"
        >
          {added}
        </time>
      ) : null}
    </>
  );
}

/** Signed-in agent's own code: opens straight through, same row as the public list. */
function CodeLink({ entry, testId }: { entry: SlotEntry; testId: string }) {
  return (
    <Link
      href={entry.href}
      prefetch={false}
      className="group flex h-12 min-w-0 flex-1 items-center gap-2.5 border-b border-neutral-100 px-1 text-left transition hover:bg-[#046BD9]/[0.05]"
      data-testid={testId}
    >
      <SlotIdentity entry={entry} />
    </Link>
  );
}

/**
 * Agent password sits above the list so the other FAST Codes stay visible
 * and the list can still scroll. The signed cookie, rate limit and redirect
 * stay in openProspectMapsiteAction.
 */
function GateForm({
  entry,
  copy,
  notice,
  onClose,
}: {
  entry: SlotEntry;
  copy: SlotsCopy;
  notice: boolean;
  onClose: () => void;
}) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const fieldId = `gate-${entry.slotId}`;
  return (
    <form
      id={fieldId}
      className="shrink-0 rounded-xl bg-neutral-50 px-3 py-2.5 ring-1 ring-black/5"
      data-testid="fast-code-gate"
      onSubmit={(e) => {
        e.preventDefault();
        if (!password) return;
        setError(null);
        start(async () => {
          const res = await openProspectMapsiteAction({ code: entry.fastCode, password });
          if (res.ok) {
            setPassword("");
            window.location.assign(res.href);
          } else {
            setError(res.error === "limited" ? copy.gateLimited : res.error === "wrong" ? copy.gateWrong : copy.errFailed);
          }
        });
      }}
    >
      <div className="mb-1.5 flex items-start justify-between gap-2">
        <p className="m-0 text-[12px] leading-snug text-neutral-600">
          <span className="font-mono font-semibold text-[#046BD9]">{entry.fastCode}</span>
          {" · "}
          {notice ? copy.gateRequired : copy.gateHint}
        </p>
        <button
          type="button"
          onClick={onClose}
          aria-label={copy.gateClose}
          className="-mr-1 -mt-0.5 rounded-full px-2 text-[18px] leading-none text-neutral-500 hover:bg-black/5 hover:text-neutral-900"
          data-testid="fast-code-gate-close"
        >
          ×
        </button>
      </div>
      <label className="sr-only" htmlFor={`${fieldId}-pw`}>
        {copy.gateLabel}
      </label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          id={`${fieldId}-pw`}
          type="password"
          autoFocus
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={copy.gateLabel}
          className="h-10 min-w-0 flex-1 rounded-full border border-neutral-300 bg-white px-4 text-[14px] text-neutral-900 outline-none focus:border-[#046BD9]"
          data-testid="fast-code-gate-input"
        />
        <button
          type="submit"
          disabled={pending || !password}
          className="h-10 shrink-0 rounded-full bg-[#046BD9] px-5 text-[14px] font-semibold text-white shadow-[0_6px_14px_rgba(4,107,217,0.3)] disabled:opacity-40"
          data-testid="fast-code-gate-submit"
        >
          {pending ? copy.gateChecking : copy.gateOpen}
        </button>
      </div>
      {error ? (
        <p role="alert" className="m-0 mt-2 text-[12px] text-amber-800" data-testid="fast-code-gate-error">
          {error}
        </p>
      ) : null}
    </form>
  );
}

const ERRORS: Record<string, keyof SlotsCopy> = {
  invalid: "errInvalid",
  notFound: "errNotFound",
  duplicate: "errDuplicate",
  full: "errFull",
  signin: "errSignin",
  failed: "errFailed",
};

function OwnList({ initial, copy }: { initial: OwnSlotList; copy: SlotsCopy }) {
  const [list, setList] = useState(initial);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const full = list.count >= list.limit;

  function run(action: () => ReturnType<typeof addFastCodeSlotAction>, onOk?: () => void) {
    setError(null);
    start(async () => {
      const res = await action();
      if (res.ok) {
        setList(res.list);
        onOk?.();
      } else {
        setError(copy[ERRORS[res.error] ?? "errFailed"] as string);
      }
    });
  }

  return (
    <section data-testid="fast-code-slots-own" className="rounded-2xl bg-neutral-50 px-4 py-4 ring-1 ring-black/5">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="m-0 text-[15px]! font-semibold text-neutral-950">{copy.mine}</h3>
        <span className="text-[12px] text-neutral-500" data-testid="fast-code-slots-used">
          {copy.used.replace("{count}", String(list.count)).replace("{limit}", String(list.limit))}
        </span>
      </div>
      {list.entries.length ? (
        <ul className="m-0 mt-2 list-none space-y-0.5 p-0">
          {list.entries.map((entry) => (
            <li key={entry.slotId} className="flex items-center gap-2">
              <CodeLink entry={entry} testId="fast-code-slot-own-link" />
              <button
                type="button"
                disabled={pending}
                onClick={() => run(() => removeFastCodeSlotAction({ slotId: entry.slotId }))}
                className="shrink-0 rounded-full px-2.5 py-1.5 text-[12px] font-medium text-neutral-500 transition hover:bg-neutral-200 hover:text-neutral-900 disabled:opacity-40"
                aria-label={`${copy.remove}: ${entry.fastCode}`}
                data-testid="fast-code-slot-remove"
              >
                {copy.remove}
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="m-0 mt-3 text-[13px] text-neutral-500">{copy.empty}</p>
      )}
      {!full ? (
        <form
          className="mt-3 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            const value = code.trim();
            if (!value) return;
            run(() => addFastCodeSlotAction({ code: value }), () => setCode(""));
          }}
        >
          <label className="sr-only" htmlFor="fast-code-slot-entry">
            {copy.inputLabel}
          </label>
          <input
            id="fast-code-slot-entry"
            name="mapsite-slot-entry"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder={copy.inputLabel}
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            data-1p-ignore
            data-lpignore="true"
            className="h-10 min-w-0 flex-1 rounded-full border border-neutral-300 bg-white px-4 text-[14px] uppercase tracking-wide text-neutral-900 outline-none focus:border-[#046BD9]"
            data-testid="fast-code-slot-input"
          />
          <button
            type="submit"
            disabled={pending || !code.trim()}
            className="h-10 shrink-0 rounded-full bg-[#046BD9] px-5 text-[14px] font-semibold text-white shadow-[0_6px_14px_rgba(4,107,217,0.3)] disabled:opacity-40"
            data-testid="fast-code-slot-add"
          >
            {pending ? copy.adding : copy.add}
          </button>
        </form>
      ) : (
        <p className="m-0 mt-3 text-[12px] text-neutral-500">{copy.errFull}</p>
      )}
      {error ? (
        <p role="alert" className="m-0 mt-2 text-[12px] text-amber-800" data-testid="fast-code-slot-error">
          {error}
        </p>
      ) : null}
    </section>
  );
}

/**
 * FAST Codes under the demo write-up. Each row shows the prospect logo (or
 * initials), the code, town and province, and the date it was added. One
 * unlabeled group per sales associate. The password field opens above the
 * list so the other rows stay reachable.
 */
export default function FastCodeSlotsPanel({ data }: { data: FastCodeSlotsPanelData }) {
  const copy = useT().demo.slots;
  const groups = data.associates.filter((g) => g.entries.length > 0);
  const [openCode, setOpenCode] = useState<string | null>(null);
  const [noticeCode, setNoticeCode] = useState<string | null>(null);
  // A blocked direct link lands here with ?gate=<code>: open that code's password field.
  useEffect(() => {
    const gate = new URLSearchParams(window.location.search).get("gate")?.trim().toLowerCase();
    if (gate && /^[a-z0-9-]{2,40}$/.test(gate)) {
      setOpenCode(gate);
      setNoticeCode(gate);
      document.getElementById("fast-code-slots")?.scrollIntoView({ block: "nearest" });
      document.getElementById(`fast-code-slot-${gate}`)?.scrollIntoView({ block: "nearest" });
    }
  }, []);
  if (!data.own && !groups.length) return null;
  const openEntry =
    groups.flatMap((group) => group.entries).find((entry) => entry.fastCode.toLowerCase() === openCode) ?? null;
  return (
    <div className="mt-4 flex min-h-0 flex-1 flex-col gap-3 border-t border-neutral-200 pt-4" data-testid="fast-code-slots" id="fast-code-slots">
      <p className="m-0 shrink-0 text-[12px] font-semibold uppercase tracking-[0.16em] text-neutral-500 sm:text-[13px]" id="fast-code-slots-title">
        {copy.title}
      </p>
      {openEntry ? (
        <GateForm
          key={openEntry.slotId}
          entry={openEntry}
          copy={copy}
          notice={noticeCode === openEntry.fastCode.toLowerCase()}
          onClose={() => setOpenCode(null)}
        />
      ) : null}
      <div className="demo-hero__list min-h-0 flex-1" data-testid="fast-code-slots-scroll">
        {data.own ? <OwnList initial={data.own} copy={copy} /> : null}
        {groups.map((group, index) => (
          <ul
            key={index}
            className="m-0 list-none space-y-0.5 p-0"
            aria-labelledby="fast-code-slots-title"
            data-testid="fast-code-slots-group"
          >
            {group.entries.map((entry) => {
              const code = entry.fastCode.toLowerCase();
              const open = openCode === code;
              return (
                <li key={entry.slotId} id={`fast-code-slot-${code}`}>
                  <button
                    type="button"
                    onClick={() => setOpenCode((cur) => (cur === code ? null : code))}
                    aria-expanded={open}
                    aria-controls={open ? `gate-${entry.slotId}` : undefined}
                    className={`group flex h-12 w-full min-w-0 items-center gap-2.5 border-b border-neutral-100 px-1 text-left transition hover:bg-[#046BD9]/[0.05] ${
                      open ? "bg-[#046BD9]/[0.08]" : ""
                    }`}
                    data-testid="fast-code-slot-code"
                  >
                    <SlotIdentity entry={entry} />
                  </button>
                </li>
              );
            })}
          </ul>
        ))}
      </div>
    </div>
  );
}
