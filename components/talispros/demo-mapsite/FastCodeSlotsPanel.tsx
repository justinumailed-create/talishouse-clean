"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useLocale, useT } from "@/lib/i18n/client";
import {
  addFastCodeSlotAction,
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

/** FAST Code, "Town, PR", then the date it was added. Opens the Mapsite with Aisha's four buttons. */
function CodeLink({ entry, testId }: { entry: SlotEntry; testId: string }) {
  const added = formatSlotAddedDate(entry.addedAt, useLocale());
  return (
    <Link
      href={entry.href}
      prefetch={false}
      className="group flex min-w-0 flex-1 items-baseline gap-2 rounded-lg px-2 py-1.5 -mx-2 text-[14px] leading-snug transition hover:bg-[#046BD9]/[0.06] sm:text-[15px]"
      data-testid={testId}
    >
      <span className="shrink-0 font-mono text-[13px] font-semibold tracking-wide text-[#046BD9] group-hover:underline sm:text-[14px]">
        {entry.fastCode}
      </span>
      <span className="min-w-0 truncate text-neutral-700">{slotPlaceLabel(entry.town, entry.province)}</span>
      {added ? (
        <time
          dateTime={entry.addedAt ?? undefined}
          className="ml-auto shrink-0 pl-2 text-[12px] tabular-nums text-neutral-500 sm:text-[13px]"
          data-testid="fast-code-slot-added"
        >
          {added}
        </time>
      ) : null}
    </Link>
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
 * FAST Codes under the demo write-up (Arun, Nov 4): each code with its town
 * and province, linking straight to the Mapsite. One unlabeled group per
 * sales associate, so the public page never says who prepared a code. The
 * signed-in agent also gets their own list, which they can add to and trim.
 */
export default function FastCodeSlotsPanel({ data }: { data: FastCodeSlotsPanelData }) {
  const copy = useT().demo.slots;
  const groups = data.associates.filter((g) => g.entries.length > 0);
  if (!data.own && !groups.length) return null;
  return (
    <div className="mt-5 flex flex-col gap-4 border-t border-neutral-200 pt-5" data-testid="fast-code-slots">
      <p className="m-0 text-[12px] font-semibold uppercase tracking-[0.16em] text-neutral-500 sm:text-[13px]" id="fast-code-slots-title">
        {copy.title}
      </p>
      {data.own ? <OwnList initial={data.own} copy={copy} /> : null}
      {groups.map((group, index) => (
        <ul
          key={index}
          className="m-0 list-none space-y-0.5 p-0"
          aria-labelledby="fast-code-slots-title"
          data-testid="fast-code-slots-group"
        >
          {group.entries.map((entry) => (
            <li key={entry.slotId} className="flex">
              <CodeLink entry={entry} testId="fast-code-slot-code" />
            </li>
          ))}
        </ul>
      ))}
    </div>
  );
}
