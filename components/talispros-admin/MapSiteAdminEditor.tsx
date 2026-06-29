"use client";

import { useState } from "react";
import Link from "next/link";
import { ExternalLink, Loader2 } from "lucide-react";
import type { MapSiteView } from "@/lib/mapsite-service";
import {
  publishMapSite,
  saveMapSiteDraft,
  unpublishMapSite,
  uploadMapSiteAsset,
  type MapSiteAdminInput,
} from "@/lib/mapsite-admin-service";
import MapSiteGalleryEditor from "@/components/admin/MapSiteGalleryEditor";
import {
  OFFERED_SUBSCRIPTION_TIER_LABELS,
  type OfferedSubscriptionTier,
} from "@/lib/mapsite-subscription";

interface MapSiteAdminEditorProps {
  mapsite: MapSiteView;
  adminWritesEnabled?: boolean;
  backHref?: string;
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
      <span className="text-xs font-medium text-neutral-500 mb-1.5 block">
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

export default function MapSiteAdminEditor({
  mapsite,
  adminWritesEnabled = true,
  backHref,
}: MapSiteAdminEditorProps) {
  const [form, setForm] = useState({
    propertyTitle: mapsite.propertyTitle || "",
    propertyAddress: mapsite.propertyAddress || "",
    propertyDescription: mapsite.propertyDescription || "",
    latitude: mapsite.latitude?.toString() || "",
    longitude: mapsite.longitude?.toString() || "",
    price: mapsite.price || "",
    logoUrl: mapsite.logoUrl || "",
    headerImageUrl: mapsite.headerImageUrl || "",
    profileImageUrl: mapsite.profileImageUrl || "",
    videoUrl: mapsite.videoUrl || "",
    agentName: mapsite.agentName || "",
    email: mapsite.email || "",
    phone: mapsite.phone || "",
    website: mapsite.website || "",
    mapZoom: mapsite.mapZoom?.toString() || "15",
    metaTitle: mapsite.metaTitle || "",
    metaDescription: mapsite.metaDescription || "",
    ogImageUrl: mapsite.ogImageUrl || "",
    atlistMapUrl: mapsite.atlistMapUrl || "",
    offeredSubscriptionTier: (mapsite.offeredSubscriptionTier || "root") as OfferedSubscriptionTier,
    interestFormEnabled: mapsite.interestFormEnabled ?? true,
    status: mapsite.status,
  });
  const [galleryImages, setGalleryImages] = useState(mapsite.galleryImages);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function toInput(): MapSiteAdminInput {
    return {
      fastCode: mapsite.fastCode,
      ...form,
      galleryImages,
    };
  }

  async function handleUpload(fieldName: string, file: File, formKey: keyof typeof form) {
    const formData = new FormData();
    formData.append("fastCode", mapsite.fastCode);
    formData.append("fieldName", fieldName);
    formData.append("file", file);

    const result = await uploadMapSiteAsset(formData);
    if (result.success && result.url) {
      setForm((prev) => ({ ...prev, [formKey]: result.url! }));
      setMessage(`${fieldName} uploaded`);
    } else {
      setError(result.error || "Upload failed");
    }
  }

  async function runAction(
    action: (input: MapSiteAdminInput) => Promise<{ success: boolean; error?: string }>
  ) {
    setSaving(true);
    setMessage("");
    setError("");
    const result = await action(toInput());
    if (result.success) {
      setMessage("Saved successfully");
    } else {
      setError(result.error || "Save failed");
    }
    setSaving(false);
  }

  return (
    <div className="space-y-8">
      {!adminWritesEnabled ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Read-only mode: add <code className="font-mono text-xs">SUPABASE_SERVICE_ROLE_KEY</code>{" "}
          to <code className="font-mono text-xs">.env.local</code> and restart the dev server to
          save changes.
        </div>
      ) : null}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          {backHref ? (
            <Link
              href={backHref}
              className="text-sm text-neutral-500 hover:text-neutral-900 mb-2 inline-block"
            >
              ← Back to live page
            </Link>
          ) : null}
          <h1 className="text-2xl font-semibold text-neutral-900 tracking-tight">
            Talispros™ MapSite Admin
          </h1>
          <p className="text-sm text-neutral-500 mt-1 font-mono">{mapsite.fastCode}</p>
        </div>
        <Link
          href={`/talispros/mapsites/${mapsite.fastCode}`}
          target="_blank"
          className="inline-flex items-center gap-2 text-sm text-neutral-700 hover:text-neutral-900"
        >
          View live page
          <ExternalLink className="w-4 h-4" />
        </Link>
      </div>

      {message && (
        <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {message}
        </div>
      )}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <section className="rounded-2xl border border-neutral-200 bg-white p-6 space-y-4">
        <h2 className="text-lg font-semibold text-neutral-900">General</h2>
        <Field label="FAST Code (read-only)">
          <input className={inputClass} value={mapsite.fastCode} readOnly />
        </Field>
        <Field label="Status">
          <input className={inputClass} value={form.status} readOnly />
        </Field>
      </section>

      <section className="rounded-2xl border border-neutral-200 bg-white p-6 space-y-4">
        <h2 className="text-lg font-semibold text-neutral-900">
          Visitor Subscription Panel
        </h2>
        <p className="text-sm text-neutral-500">
          Control which subscription visitors see on this MapSite and whether the
          Express an Interest form appears after they subscribe.
        </p>
        <Field label="Offered Subscription">
          <select
            className={inputClass}
            value={form.offeredSubscriptionTier}
            onChange={(e) =>
              setForm((p) => ({
                ...p,
                offeredSubscriptionTier: e.target.value as OfferedSubscriptionTier,
              }))
            }
          >
            {(Object.keys(OFFERED_SUBSCRIPTION_TIER_LABELS) as OfferedSubscriptionTier[]).map(
              (tier) => (
                <option key={tier} value={tier}>
                  {OFFERED_SUBSCRIPTION_TIER_LABELS[tier]}
                </option>
              )
            )}
          </select>
        </Field>
        <label className="flex items-center gap-3 text-sm text-neutral-700">
          <input
            type="checkbox"
            checked={form.interestFormEnabled}
            onChange={(e) =>
              setForm((p) => ({ ...p, interestFormEnabled: e.target.checked }))
            }
            className="h-4 w-4 rounded border-neutral-300"
          />
          Enable Express an Interest form after subscription
        </label>
      </section>

      <section className="rounded-2xl border border-neutral-200 bg-white p-6 space-y-4">
        <h2 className="text-lg font-semibold text-neutral-900">Property</h2>
        <Field label="Title">
          <input
            className={inputClass}
            value={form.propertyTitle}
            onChange={(e) => setForm((p) => ({ ...p, propertyTitle: e.target.value }))}
          />
        </Field>
        <Field label="Address">
          <input
            className={inputClass}
            value={form.propertyAddress}
            onChange={(e) => setForm((p) => ({ ...p, propertyAddress: e.target.value }))}
          />
        </Field>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Latitude">
            <input
              className={inputClass}
              value={form.latitude}
              onChange={(e) => setForm((p) => ({ ...p, latitude: e.target.value }))}
            />
          </Field>
          <Field label="Longitude">
            <input
              className={inputClass}
              value={form.longitude}
              onChange={(e) => setForm((p) => ({ ...p, longitude: e.target.value }))}
            />
          </Field>
        </div>
        <Field label="Price">
          <input
            className={inputClass}
            value={form.price}
            onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))}
          />
        </Field>
        <Field label="Description">
          <textarea
            className={textareaClass}
            rows={5}
            value={form.propertyDescription}
            onChange={(e) =>
              setForm((p) => ({ ...p, propertyDescription: e.target.value }))
            }
          />
        </Field>
      </section>

      <section className="rounded-2xl border border-neutral-200 bg-white p-6 space-y-4">
        <h2 className="text-lg font-semibold text-neutral-900">Branding</h2>
        {(["logoUrl", "headerImageUrl", "profileImageUrl"] as const).map((key) => (
          <div key={key} className="space-y-2">
            <Field label={key}>
              <input
                className={inputClass}
                value={form[key]}
                onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))}
              />
            </Field>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handleUpload(key, file, key);
              }}
            />
          </div>
        ))}
      </section>

      <section className="rounded-2xl border border-neutral-200 bg-white p-6 space-y-4">
        <h2 className="text-lg font-semibold text-neutral-900">Media</h2>
        <Field label="Video URL (MP4 or YouTube)">
          <input
            className={inputClass}
            value={form.videoUrl}
            onChange={(e) => setForm((p) => ({ ...p, videoUrl: e.target.value }))}
            placeholder="https://youtube.com/watch?v=... or https://.../video.mp4"
          />
        </Field>
        <div>
          <h3 className="text-sm font-medium text-neutral-700 mb-3">Gallery</h3>
          <MapSiteGalleryEditor
            fastCode={mapsite.fastCode}
            images={galleryImages}
            onChange={setGalleryImages}
          />
        </div>
      </section>

      <section className="rounded-2xl border border-neutral-200 bg-white p-6 space-y-4">
        <h2 className="text-lg font-semibold text-neutral-900">Contact</h2>
        <Field label="Agent Name">
          <input
            className={inputClass}
            value={form.agentName}
            onChange={(e) => setForm((p) => ({ ...p, agentName: e.target.value }))}
          />
        </Field>
        <Field label="Email">
          <input
            className={inputClass}
            type="email"
            value={form.email}
            onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
          />
        </Field>
        <Field label="Phone">
          <input
            className={inputClass}
            value={form.phone}
            onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
          />
        </Field>
        <Field label="Website">
          <input
            className={inputClass}
            value={form.website}
            onChange={(e) => setForm((p) => ({ ...p, website: e.target.value }))}
          />
        </Field>
      </section>

      <section className="rounded-2xl border border-neutral-200 bg-white p-6 space-y-4">
        <h2 className="text-lg font-semibold text-neutral-900">Map</h2>
        <Field label="Atlist Map URL">
          <input
            className={inputClass}
            value={form.atlistMapUrl}
            onChange={(e) => setForm((p) => ({ ...p, atlistMapUrl: e.target.value }))}
            placeholder="https://my.atlist.com/map/..."
          />
          <p className="text-xs text-neutral-500 mt-1.5">
            Paste the share link from Atlist. This map appears in the centre of the
            public MapSite page.
          </p>
        </Field>
        <Field label="Default Zoom (Google Maps fallback)">
          <input
            className={inputClass}
            value={form.mapZoom}
            onChange={(e) => setForm((p) => ({ ...p, mapZoom: e.target.value }))}
          />
        </Field>
      </section>

      <section className="rounded-2xl border border-neutral-200 bg-white p-6 space-y-4">
        <h2 className="text-lg font-semibold text-neutral-900">SEO</h2>
        <Field label="Meta Title">
          <input
            className={inputClass}
            value={form.metaTitle}
            onChange={(e) => setForm((p) => ({ ...p, metaTitle: e.target.value }))}
          />
        </Field>
        <Field label="Meta Description">
          <textarea
            className={textareaClass}
            rows={3}
            value={form.metaDescription}
            onChange={(e) => setForm((p) => ({ ...p, metaDescription: e.target.value }))}
          />
        </Field>
        <Field label="OpenGraph Image URL">
          <input
            className={inputClass}
            value={form.ogImageUrl}
            onChange={(e) => setForm((p) => ({ ...p, ogImageUrl: e.target.value }))}
          />
        </Field>
      </section>

      <section className="rounded-2xl border border-neutral-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-neutral-900 mb-4">Publishing</h2>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            disabled={saving || !adminWritesEnabled}
            onClick={() => void runAction(saveMapSiteDraft)}
            className="px-4 py-2 rounded-xl border border-neutral-300 text-sm font-medium hover:bg-neutral-50 disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Draft"}
          </button>
          <button
            type="button"
            disabled={saving || !adminWritesEnabled}
            onClick={() =>
              void runAction(async (input) => {
                const result = await publishMapSite(input);
                if (result.success) {
                  setForm((p) => ({ ...p, status: "active" }));
                }
                return result;
              })
            }
            className="px-4 py-2 rounded-xl bg-neutral-900 text-white text-sm font-medium hover:bg-neutral-800 disabled:opacity-50"
          >
            Publish
          </button>
          <button
            type="button"
            disabled={saving || !adminWritesEnabled}
            onClick={async () => {
              setSaving(true);
              const result = await unpublishMapSite(mapsite.fastCode);
              if (result.success) {
                setForm((p) => ({ ...p, status: "inactive" }));
                setMessage("MapSite unpublished");
              } else {
                setError(result.error || "Unpublish failed");
              }
              setSaving(false);
            }}
            className="px-4 py-2 rounded-xl border border-red-200 text-red-600 text-sm font-medium hover:bg-red-50 disabled:opacity-50"
          >
            Unpublish
          </button>
        </div>
      </section>
    </div>
  );
}
