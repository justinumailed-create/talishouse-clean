"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, useTransition } from "react";
import {
  listMarketingDemoMapSites,
  marketingDeleteDemoMapSite,
  marketingUpdateDemoMapSite,
} from "../actions";
import type { DemoMapSiteRecord } from "@/lib/talispros/demo-mapsite-service";
import { DEMO_MAPSITE_BUILD_PATH } from "@/lib/talispros/demo-mapsite";
import { MAPSITE_APP_PATH, publishedMapSitePath } from "@/lib/talispros/mapsite-state";

export default function MarketingAdminDemosClient() {
  const [rows, setRows] = useState<DemoMapSiteRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState({
    propertyTitle: "",
    propertyAddress: "",
    latitude: "",
    longitude: "",
  });

  const refresh = useCallback(async () => {
    const result = await listMarketingDemoMapSites();
    if (!result.ok) {
      setError("Unable to load demo Mapsites™");
      setRows([]);
    } else {
      setError(null);
      setRows(result.data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  function startEdit(row: DemoMapSiteRecord) {
    setEditingId(row.id);
    setDraft({
      propertyTitle: row.propertyTitle,
      propertyAddress: row.propertyAddress || "",
      latitude: row.latitude == null ? "" : String(row.latitude),
      longitude: row.longitude == null ? "" : String(row.longitude),
    });
  }

  function run(action: () => Promise<{ ok: boolean; error?: string }>) {
    startTransition(async () => {
      const result = await action();
      if (!result.ok) {
        setError(result.error || "Action failed");
        return;
      }
      setEditingId(null);
      await refresh();
    });
  }

  return (
    <section className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200 bg-neutral-50 px-4 py-3">
        <div>
          <h2 className="text-sm font-semibold text-neutral-900">
            Demo Mapsites™
          </h2>
          <p className="text-xs text-neutral-500">
            Demonstration pins with the pinned Talispros eBook. No FAST Codes.
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href={DEMO_MAPSITE_BUILD_PATH}
            className="rounded-lg bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white"
          >
            New demo
          </Link>
          <button
            type="button"
            onClick={() => void refresh()}
            disabled={pending}
            className="rounded border border-neutral-300 bg-white px-3 py-1.5 text-xs hover:bg-neutral-100 disabled:opacity-50"
          >
            Refresh
          </button>
        </div>
      </div>

      {error ? (
        <div className="border-b border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="p-6 text-sm text-neutral-500">Loading demo Mapsites™…</div>
      ) : rows.length === 0 ? (
        <div className="p-8 text-center text-sm text-neutral-500">
          No demonstration Mapsites™ yet.
        </div>
      ) : (
        <ul className="divide-y divide-neutral-200">
          {rows.map((row) => {
            const mapsiteHref = `${MAPSITE_APP_PATH}?view=pin&mapsiteId=${encodeURIComponent(row.id)}`;
            const publishedHref = publishedMapSitePath(row.fastCode);
            const editing = editingId === row.id;
            return (
              <li key={row.id} className="px-4 py-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-neutral-900">
                      {row.propertyTitle}
                      {row.isPlatformSeed ? (
                        <span className="ml-2 rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-neutral-500">
                          Platform pin
                        </span>
                      ) : null}
                    </p>
                    <p className="mt-1 text-xs text-neutral-500">
                      {row.fastCode} · {row.status}
                      {row.propertyAddress ? ` · ${row.propertyAddress}` : ""}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={mapsiteHref}
                      className="rounded border border-neutral-300 px-2.5 py-1 text-xs text-neutral-700"
                    >
                      Open map
                    </Link>
                    <Link
                      href={publishedHref}
                      className="rounded border border-neutral-300 px-2.5 py-1 text-xs text-neutral-700"
                    >
                      Published
                    </Link>
                    {row.tebUrl ? (
                      <Link
                        href={row.tebUrl}
                        className="rounded border border-neutral-300 px-2.5 py-1 text-xs text-neutral-700"
                      >
                        eBook
                      </Link>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => startEdit(row)}
                      className="rounded border border-neutral-300 px-2.5 py-1 text-xs text-neutral-700"
                    >
                      Edit
                    </button>
                    {row.isPlatformSeed ? null : (
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => {
                          if (
                            !window.confirm(
                              "Delete this demo Mapsite™? The pinned eBook is not deleted.",
                            )
                          ) {
                            return;
                          }
                          run(() => marketingDeleteDemoMapSite(row.id));
                        }}
                        className="rounded border border-red-200 px-2.5 py-1 text-xs text-red-700"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
                {editing ? (
                  <div className="mt-3 grid gap-3 rounded-lg border border-neutral-200 bg-neutral-50 p-3 sm:grid-cols-2">
                    <label className="text-xs font-medium text-neutral-600">
                      Title
                      <input
                        value={draft.propertyTitle}
                        onChange={(event) =>
                          setDraft((current) => ({
                            ...current,
                            propertyTitle: event.target.value,
                          }))
                        }
                        className="mt-1 w-full rounded border border-neutral-300 px-2 py-1.5 text-sm"
                      />
                    </label>
                    <label className="text-xs font-medium text-neutral-600">
                      Address
                      <input
                        value={draft.propertyAddress}
                        onChange={(event) =>
                          setDraft((current) => ({
                            ...current,
                            propertyAddress: event.target.value,
                          }))
                        }
                        className="mt-1 w-full rounded border border-neutral-300 px-2 py-1.5 text-sm"
                      />
                    </label>
                    <label className="text-xs font-medium text-neutral-600">
                      Latitude
                      <input
                        value={draft.latitude}
                        onChange={(event) =>
                          setDraft((current) => ({
                            ...current,
                            latitude: event.target.value,
                          }))
                        }
                        className="mt-1 w-full rounded border border-neutral-300 px-2 py-1.5 text-sm"
                      />
                    </label>
                    <label className="text-xs font-medium text-neutral-600">
                      Longitude
                      <input
                        value={draft.longitude}
                        onChange={(event) =>
                          setDraft((current) => ({
                            ...current,
                            longitude: event.target.value,
                          }))
                        }
                        className="mt-1 w-full rounded border border-neutral-300 px-2 py-1.5 text-sm"
                      />
                    </label>
                    <div className="flex gap-2 sm:col-span-2">
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() =>
                          run(() =>
                            marketingUpdateDemoMapSite({
                              mapsiteId: row.id,
                              propertyTitle: draft.propertyTitle,
                              propertyAddress: draft.propertyAddress,
                              latitude: Number.parseFloat(draft.latitude),
                              longitude: Number.parseFloat(draft.longitude),
                            }),
                          )
                        }
                        className="rounded bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="rounded border border-neutral-300 px-3 py-1.5 text-xs"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
