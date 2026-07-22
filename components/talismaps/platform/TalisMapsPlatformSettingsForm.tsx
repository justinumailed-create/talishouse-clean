"use client";

import { useMemo, useState, useTransition, type FormEvent } from "react";
import {
  MAP_BASEMAP_VIEW_OPTIONS,
  listMapProviders,
  type MapBasemapView,
  type MapProviderId,
} from "@/lib/talismaps/map-engine";
import type { TalisMapsPlatformSettings } from "@/lib/talismaps/platform-settings";
import { saveTalisMapsSettingsAction } from "@/app/talismaps/settings/actions";

interface TalisMapsPlatformSettingsFormProps {
  initialSettings: TalisMapsPlatformSettings;
}

export default function TalisMapsPlatformSettingsForm({
  initialSettings,
}: TalisMapsPlatformSettingsFormProps) {
  const providers = useMemo(() => listMapProviders(), []);
  const [providerId, setProviderId] = useState<MapProviderId>(
    initialSettings.defaultProviderId
  );
  const [basemapView, setBasemapView] = useState<MapBasemapView>(
    initialSettings.defaultBasemapView
  );
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  const selectedProvider = providers.find((provider) => provider.id === providerId);
  const viewOptions = MAP_BASEMAP_VIEW_OPTIONS.map((option) => {
    const supported = selectedProvider?.supportedBasemapViews.includes(option.id) ?? false;
    const future = option.availability === "future";
    return {
      ...option,
      disabled: future || !supported,
      hint: future
        ? "Coming soon"
        : !supported
          ? "Not supported by this provider yet"
          : null,
    };
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");

    const formData = new FormData();
    formData.set("defaultProviderId", providerId);
    formData.set("defaultBasemapView", basemapView);

    startTransition(async () => {
      const result = await saveTalisMapsSettingsAction(formData);
      if (!result.ok) {
        setError(result.error || "Failed to save settings.");
        return;
      }
      setMessage("Settings saved. New maps and embeds will use these defaults.");
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}
      {message ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {message}
        </div>
      ) : null}

      <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <h2 className="text-base font-semibold text-neutral-900">Default Provider</h2>
        <p className="mt-1 text-sm text-neutral-500">
          TalisMaps™ renders with MapLibre GL JS. Tile styles come from interchangeable
          vendors (MapTiler by default). Google Maps is not supported.
        </p>

        <div className="mt-5 space-y-3">
          {providers.map((provider) => (
            <label
              key={provider.id}
              className={`flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 transition-colors ${
                providerId === provider.id
                  ? "border-neutral-900 bg-neutral-50"
                  : "border-neutral-200 hover:border-neutral-300"
              }`}
            >
              <input
                type="radio"
                name="defaultProviderId"
                value={provider.id}
                checked={providerId === provider.id}
                onChange={() => {
                  setProviderId(provider.id);
                  if (!provider.supportedBasemapViews.includes(basemapView)) {
                    setBasemapView(
                      provider.supportedBasemapViews.includes("satellite")
                        ? "satellite"
                        : provider.supportedBasemapViews[0] ?? "satellite"
                    );
                  }
                }}
                className="mt-1"
              />
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium text-neutral-900">
                    {provider.label}
                  </span>
                  {provider.isAvailable ? (
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-800">
                      Available
                    </span>
                  ) : (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-800">
                      Needs credentials
                    </span>
                  )}
                </span>
                <span className="mt-1 block text-xs leading-relaxed text-neutral-500">
                  {provider.description}
                </span>
              </span>
            </label>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <h2 className="text-base font-semibold text-neutral-900">Default Map Style</h2>
        <p className="mt-1 text-sm text-neutral-500">
          Satellite is the production default (MapTiler Satellite via MapLibre). Streets,
          Terrain, Light, and Dark are interchangeable through the Style Manager.
        </p>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {viewOptions.map((option) => (
            <label
              key={option.id}
              className={`flex items-start gap-3 rounded-xl border px-4 py-3 ${
                option.disabled
                  ? "cursor-not-allowed border-neutral-100 bg-neutral-50 opacity-60"
                  : basemapView === option.id
                    ? "cursor-pointer border-neutral-900 bg-neutral-50"
                    : "cursor-pointer border-neutral-200 hover:border-neutral-300"
              }`}
            >
              <input
                type="radio"
                name="defaultBasemapView"
                value={option.id}
                checked={basemapView === option.id}
                disabled={option.disabled}
                onChange={() => setBasemapView(option.id)}
                className="mt-1"
              />
              <span className="min-w-0">
                <span className="block text-sm font-medium text-neutral-900">
                  {option.label}
                </span>
                <span className="mt-0.5 block text-xs text-neutral-500">
                  {option.description}
                </span>
                {option.hint ? (
                  <span className="mt-1 block text-[11px] font-medium text-amber-700">
                    {option.hint}
                  </span>
                ) : null}
              </span>
            </label>
          ))}
        </div>
      </section>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-60"
        >
          {pending ? "Saving…" : "Save Settings"}
        </button>
        {initialSettings.updatedAt ? (
          <p className="text-xs text-neutral-400">
            Last updated {new Date(initialSettings.updatedAt).toLocaleString()}
          </p>
        ) : null}
      </div>
    </form>
  );
}
