"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useT } from "@/lib/i18n/client";
import {
  addFastCodeSlotAction,
  removeFastCodeSlotAction,
} from "@/app/talispros/demo-mapsite/slots-actions";
import {
  demoMapsiteSlotOpenHref,
  type FastCodeSlotsPanelData,
  type OwnSlotList,
} from "@/lib/talispros/fast-code-slots";

type SlotsCopy = ReturnType<typeof useT>["demo"]["slots"];

function countLabel(copy: SlotsCopy, count: number): string {
  if (count === 0) return copy.empty;
  if (count === 1) return copy.countOne;
  return copy.countMany.replace("{count}", String(count));
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
      <p className="m-0 mt-0.5 text-[13px] text-neutral-600">{list.name}</p>
      {list.entries.length ? (
        <ul className="m-0 mt-3 list-none space-y-1.5 p-0">
          {list.entries.map((entry) => (
            <li key={entry.slotId} className="flex items-center gap-2">
              <Link
                href={entry.href}
                className="flex min-w-0 flex-1 flex-col rounded-lg bg-white px-3 py-2 text-[13px] leading-snug ring-1 ring-black/5 transition hover:ring-[#046BD9]/40"
                data-testid="fast-code-slot-own-link"
              >
                <span className="truncate font-medium text-neutral-900">{entry.town}</span>
                <span className="truncate font-mono text-[12px] tracking-wide text-[#046BD9]">{entry.fastCode}</span>
              </Link>
              <button
                type="button"
                disabled={pending}
                onClick={() => run(() => removeFastCodeSlotAction({ slotId: entry.slotId }))}
                className="shrink-0 rounded-full px-2.5 py-1.5 text-[12px] font-medium text-neutral-500 transition hover:bg-neutral-200 hover:text-neutral-900 disabled:opacity-40"
                aria-label={`${copy.remove}: ${entry.town}`}
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
 * Right-hand panel on the demo Mapsite page: one list per sales associate.
 * The public view gets names, towns and counts only (no FAST Codes); the
 * signed-in agent also gets their own list with codes and can edit it.
 */
export default function FastCodeSlotsPanel({ data }: { data: FastCodeSlotsPanelData }) {
  const copy = useT().demo.slots;
  return (
    <aside
      className="flex flex-col gap-4 rounded-[20px] bg-white px-5 py-6 shadow-[0_1px_2px_rgba(0,0,0,0.05),0_18px_48px_rgba(0,0,0,0.10)] sm:px-6"
      data-testid="fast-code-slots"
      aria-labelledby="fast-code-slots-title"
    >
      <h2
        id="fast-code-slots-title"
        className="m-0 text-[12px]! font-semibold uppercase tracking-[0.16em] text-neutral-500 sm:text-[13px]!"
      >
        {copy.title}
      </h2>
      {data.own ? <OwnList initial={data.own} copy={copy} /> : null}
      {data.associates.map((associate) => (
        <section key={associate.name} data-testid="fast-code-slots-associate">
          <h3 className="m-0 text-[16px]! font-semibold text-neutral-950">{associate.name}</h3>
          <p className="m-0 mt-0.5 text-[13px] text-neutral-600" data-testid="fast-code-slots-count">
            {countLabel(copy, associate.count)}
          </p>
          {associate.entries.length ? (
            <ul className="m-0 mt-2.5 flex list-none flex-wrap gap-1.5 p-0">
              {associate.entries.map((entry) => (
                <li key={entry.slotId}>
                  <Link
                    href={demoMapsiteSlotOpenHref(entry.slotId)}
                    prefetch={false}
                    className="inline-flex items-center rounded-full bg-neutral-100 px-3 py-1.5 text-[13px] font-medium text-neutral-800 ring-1 ring-black/5 transition hover:bg-[#046BD9] hover:text-white"
                    data-testid="fast-code-slot-town"
                  >
                    {entry.town}
                  </Link>
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      ))}
    </aside>
  );
}
