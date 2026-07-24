"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import type { PmcRegionalPin } from "@/lib/talispros/pmc-regional-pins";
import { savePmcRegionalPinAction } from "@/app/talispros/admin/pmc/actions";

interface PmcPinsAdminEditorProps {
  initialPins: PmcRegionalPin[];
}

export default function PmcPinsAdminEditor({
  initialPins,
}: PmcPinsAdminEditorProps) {
  const [pins, setPins] = useState(initialPins);
  const [activeId, setActiveId] = useState(initialPins[0]?.id ?? "");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const active = pins.find((pin) => pin.id === activeId) ?? pins[0] ?? null;

  const updateActive = (patch: Partial<PmcRegionalPin>) => {
    if (!active) return;
    setPins((current) =>
      current.map((pin) => (pin.id === active.id ? { ...pin, ...patch } : pin))
    );
  };

  const saveActive = () => {
    if (!active) return;
    setMessage(null);
    startTransition(async () => {
      const result = await savePmcRegionalPinAction({
        id: active.id,
        label: active.label,
        latitude: active.latitude,
        longitude: active.longitude,
        mapZoom: active.mapZoom,
        pinColor: active.pinColor,
        logoUrl: active.logoUrl,
        visible: active.visible,
        sortOrder: active.sortOrder,
        description: active.description,
      });
      if (!result.ok) {
        setMessage(result.error);
        return;
      }
      setMessage("Saved.");
    });
  };

  if (!active) {
    return <p className="text-sm text-neutral-600">No PMC pins configured.</p>;
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[16rem_minmax(0,1fr)]">
      <aside className="rounded-2xl border border-neutral-200 bg-white p-3">
        <p className="mb-2 px-2 text-xs font-medium uppercase tracking-wide text-neutral-500">
          Regional pins
        </p>
        <ul className="max-h-[70vh] space-y-0.5 overflow-y-auto">
          {pins.map((pin) => (
            <li key={pin.id}>
              <button
                type="button"
                onClick={() => setActiveId(pin.id)}
                className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-sm ${
                  pin.id === active.id
                    ? "bg-neutral-900 text-white"
                    : "text-neutral-800 hover:bg-neutral-50"
                }`}
              >
                <span className="truncate">{pin.label}</span>
                {!pin.visible ? (
                  <span className="ml-2 shrink-0 text-[10px] opacity-70">hidden</span>
                ) : null}
              </button>
            </li>
          ))}
        </ul>
      </aside>

      <section className="rounded-2xl border border-neutral-200 bg-white p-5">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-neutral-900">{active.label}</h2>
            <p className="mt-1 text-sm text-neutral-500">
              Customize location, visibility, and pin branding for Talispros™ PMC.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/talispros/mapsite?audience=brokers"
              className="rounded-xl border border-neutral-200 px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
            >
              Open MapSite
            </Link>
            <button
              type="button"
              onClick={saveActive}
              disabled={pending}
              className="rounded-xl bg-neutral-950 px-3.5 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-60"
            >
              {pending ? "Saving…" : "Save pin"}
            </button>
          </div>
        </div>

        {message ? (
          <p className="mb-4 rounded-xl bg-neutral-50 px-3 py-2 text-sm text-neutral-700">
            {message}
          </p>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Label">
            <input
              className={inputClass}
              value={active.label}
              onChange={(event) => updateActive({ label: event.target.value })}
            />
          </Field>
          <Field label="Logo URL">
            <input
              className={inputClass}
              value={active.logoUrl}
              onChange={(event) => updateActive({ logoUrl: event.target.value })}
            />
          </Field>
          <Field label="Latitude">
            <input
              className={inputClass}
              type="number"
              step="any"
              value={active.latitude}
              onChange={(event) =>
                updateActive({ latitude: Number(event.target.value) })
              }
            />
          </Field>
          <Field label="Longitude">
            <input
              className={inputClass}
              type="number"
              step="any"
              value={active.longitude}
              onChange={(event) =>
                updateActive({ longitude: Number(event.target.value) })
              }
            />
          </Field>
          <Field label="Focus zoom">
            <input
              className={inputClass}
              type="number"
              min={1}
              max={21}
              value={active.mapZoom}
              onChange={(event) =>
                updateActive({ mapZoom: Number(event.target.value) })
              }
            />
          </Field>
          <Field label="Pin color">
            <input
              className={inputClass}
              value={active.pinColor}
              onChange={(event) => updateActive({ pinColor: event.target.value })}
            />
          </Field>
          <Field label="Sort order">
            <input
              className={inputClass}
              type="number"
              value={active.sortOrder}
              onChange={(event) =>
                updateActive({ sortOrder: Number(event.target.value) })
              }
            />
          </Field>
          <Field label="Visible">
            <label className="flex h-11 items-center gap-2 text-sm text-neutral-800">
              <input
                type="checkbox"
                checked={active.visible}
                onChange={(event) =>
                  updateActive({ visible: event.target.checked })
                }
              />
              Show on MapSite
            </label>
          </Field>
          <div className="sm:col-span-2">
            <Field label="Description">
              <textarea
                className={textareaClass}
                rows={3}
                value={active.description}
                onChange={(event) =>
                  updateActive({ description: event.target.value })
                }
              />
            </Field>
          </div>
        </div>
      </section>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-neutral-500">
        {label}
      </span>
      {children}
    </label>
  );
}

const inputClass =
  "w-full h-11 px-4 bg-white border border-neutral-200 text-sm text-neutral-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900/20";

const textareaClass =
  "w-full px-4 py-3 bg-white border border-neutral-200 text-sm text-neutral-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900/20 resize-y";
