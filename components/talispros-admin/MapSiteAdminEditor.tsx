"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ExternalLink, Loader2, Upload } from "lucide-react";
import type { MapSiteView } from "@/lib/mapsite-service";
import { buildClaimedMapSiteHref } from "@/lib/mapsite-service";
import {
  publishMapSite,
  saveMapSiteDraft,
  unpublishMapSite,
  uploadMapSiteAsset,
  type MapSiteAdminActionResult,
  type MapSiteAdminInput,
} from "@/lib/mapsite-admin-service";
import MapSiteGalleryEditor from "@/components/admin/MapSiteGalleryEditor";
import HomePinLocationSection, {
  validateHomePinLocation,
} from "@/components/build-mapsite/HomePinLocationSection";
import {
  defaultHomePinLocationValues,
  type HomePinLocationValues,
} from "@/components/build-mapsite/home-pin-types";
import { MAPSITE_PIN_DEFAULT_BORDER, MAPSITE_PIN_DEFAULT_COLOR, MAPSITE_PIN_DEFAULT_ICON } from "@/lib/mapsite-pin-style";
import MapSiteAdminShareLinks from "@/components/talispros-admin/MapSiteAdminShareLinks";
import MapSiteAdminEbookPanel from "@/components/talispros-admin/MapSiteAdminEbookPanel";
import {
  OFFERED_SUBSCRIPTION_TIER_LABELS,
  type OfferedSubscriptionTier,
} from "@/lib/mapsite-subscription";
import type { MapSiteEbookDraft } from "@/lib/talisbooks/mapsite-ebook-service";

interface MapSiteAdminEditorProps {
  mapsite: MapSiteView;
  adminWritesEnabled?: boolean;
  adminWritesMessage?: string | null;
  backHref?: string;
  showVisitorSubscriptionPanel?: boolean;
  /** Completed PayPal payment on file for this claim. */
  paymentReceived?: boolean;
  ebook?: MapSiteEbookDraft | null;
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

const BRANDING_IMAGE_FIELDS = [
  {
    key: "logoUrl",
    label: "Logo",
    hint: "Shown in the Mapsite™ header.",
    previewClassName: "object-contain p-1",
  },
  {
    key: "headerImageUrl",
    label: "Header image",
    hint: "Optional hero or banner image.",
    previewClassName: "object-cover",
  },
  {
    key: "profileImageUrl",
    label: "Agent profile photo",
    hint: "Shown in the header contact area.",
    previewClassName: "object-cover object-top",
  },
] as const;

type BrandingImageKey = (typeof BRANDING_IMAGE_FIELDS)[number]["key"];

export default function MapSiteAdminEditor({
  mapsite,
  adminWritesEnabled = true,
  adminWritesMessage = null,
  backHref,
  showVisitorSubscriptionPanel = false,
  paymentReceived = false,
  ebook = null,
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
    offeredSubscriptionTier: (mapsite.offeredSubscriptionTier || "root") as OfferedSubscriptionTier,
    interestFormEnabled: mapsite.interestFormEnabled ?? true,
    status: mapsite.status,
    mlsUrl: mapsite.mlsUrl || "",
    brokerUrl: mapsite.brokerUrl || "",
    tebUrl: mapsite.tebUrl || "",
    ttvUrl: mapsite.ttvUrl || "",
    pinIcon: mapsite.pinIcon || defaultHomePinLocationValues.futurePinIcon || MAPSITE_PIN_DEFAULT_ICON,
    pinColor: mapsite.pinColor || defaultHomePinLocationValues.futurePinColor || MAPSITE_PIN_DEFAULT_COLOR,
    pinBorder: mapsite.pinBorder || defaultHomePinLocationValues.futurePinBorder || MAPSITE_PIN_DEFAULT_BORDER,
    pinWhiteCenter: mapsite.pinWhiteCenter ?? defaultHomePinLocationValues.futurePinWhiteCenter,
    pinAnimated: mapsite.pinAnimated ?? defaultHomePinLocationValues.futurePinAnimated,
    pinCategoryBadge: mapsite.pinCategoryBadge || "",
    pinLabel: mapsite.propertyTitle || mapsite.fastCode,
  });
  const [pinImage, setPinImage] = useState<File | null>(null);
  const [mapHref, setMapHref] = useState(mapsite.atlistMapUrl || "");
  const [galleryItems, setGalleryItems] = useState(mapsite.galleryItems);
  const [uploadingBrandingField, setUploadingBrandingField] =
    useState<BrandingImageKey | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function toInput(): MapSiteAdminInput {
    return {
      fastCode: mapsite.fastCode,
      ...form,
      galleryItems,
      offeredSubscriptionTier: showVisitorSubscriptionPanel
        ? form.offeredSubscriptionTier
        : mapsite.offeredSubscriptionTier || "root",
      interestFormEnabled: showVisitorSubscriptionPanel
        ? form.interestFormEnabled
        : mapsite.interestFormEnabled ?? true,
    };
  }

  async function handleBrandingUpload(
    fieldName: BrandingImageKey,
    file: File
  ) {
    setUploadingBrandingField(fieldName);
    try {
      await handleUpload(fieldName, file, fieldName);
    } finally {
      setUploadingBrandingField(null);
    }
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
    action: (input: MapSiteAdminInput) => Promise<MapSiteAdminActionResult>
  ) {
    setSaving(true);
    setMessage("");
    setError("");
    const result = await action(toInput());
    if (result.success) {
      setMessage("Saved successfully");
      if (result.mapHref) setMapHref(result.mapHref);
    } else {
      setError(result.error || "Save failed");
    }
    setSaving(false);
  }

  const pinValues: HomePinLocationValues = {
    streetAddress: form.propertyAddress,
    latitude: form.latitude,
    longitude: form.longitude,
    manualPlacement: true,
    reverseGeocodedAddress: "",
    mapZoom: Number.parseInt(form.mapZoom, 10) || 15,
    mlsUrl: form.mlsUrl,
    brokerUrl: form.brokerUrl,
    pinWriteup: form.propertyDescription,
    futurePinColor: form.pinColor,
    futurePinIcon: form.pinIcon,
    futurePinBorder: form.pinBorder,
    futurePinLabel: form.pinLabel,
    futurePinWhiteCenter: form.pinWhiteCenter,
    futurePinAnimated: form.pinAnimated,
    futurePinCategoryBadge: form.pinCategoryBadge || null,
  };

  async function handleCreateMap() {
    const pinErrors = validateHomePinLocation(pinValues);
    if (Object.keys(pinErrors).length > 0) {
      setError("Place a pin or enter an address to create the Talismaps™.");
      return;
    }
    await runAction(saveMapSiteDraft);
  }

  return (
    <div className="space-y-8">
      {!adminWritesEnabled && adminWritesMessage ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {adminWritesMessage}
        </div>
      ) : null}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          {backHref ? (
            <Link
              href={backHref}
              className="text-sm text-neutral-500 hover:text-neutral-900 mb-2 inline-block"
            >
              ← Back to live page
            </Link>
          ) : null}
          <h1 className="text-2xl font-semibold text-neutral-900 tracking-tight">
            Talispros™ Mapsite™ Admin
          </h1>
          <p className="text-sm text-neutral-500 mt-1 font-mono">{mapsite.fastCode}</p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <Link
            href={buildClaimedMapSiteHref({
              mapsiteId: mapsite.id,
              fastCode: mapsite.fastCode,
              requestId: mapsite.requestId,
              audience: mapsite.claimAudience || "listings",
            })}
            target="_blank"
            className="inline-flex items-center gap-2 rounded-full bg-orange-50 px-3 py-1.5 text-[13px] font-medium text-orange-600 ring-1 ring-orange-200/80 transition hover:bg-orange-100"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-orange-500" aria-hidden="true" />
            Open claimed Mapsite™
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
          <Link
            href={`/talispros/mapsites/${mapsite.fastCode}`}
            target="_blank"
            className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1.5 text-[13px] font-medium text-blue-600 ring-1 ring-blue-200/80 transition hover:bg-blue-100"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500" aria-hidden="true" />
            View published page
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </div>
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

      <MapSiteAdminShareLinks
        mapsiteId={mapsite.id}
        fastCode={mapsite.fastCode}
        audience={mapsite.claimAudience}
        accountType={mapsite.accountType}
        paymentReceived={paymentReceived}
      />

      <div id="ebook-editor">
        <MapSiteAdminEbookPanel
          fastCode={mapsite.fastCode}
          mapsiteId={mapsite.id}
          requestId={mapsite.requestId}
          accountType={mapsite.accountType}
          initialEbook={ebook}
          adminWritesEnabled={adminWritesEnabled}
          initialAgentName={
            mapsite.agentName ||
            `${mapsite.ownerFirstName} ${mapsite.ownerLastName}`.trim()
          }
          initialAgentEmail={mapsite.email}
          initialAgentPhone={mapsite.phone}
          pinLatitude={mapsite.latitude}
          pinLongitude={mapsite.longitude}
          initialPropertyAddress={mapsite.propertyAddress}
          initialListingTitle={mapsite.propertyTitle}
          initialPinWriteup={mapsite.propertyDescription}
          initialPriceLine={mapsite.price}
          initialAgencyLogoUrl={mapsite.logoUrl}
        />
      </div>

      {showVisitorSubscriptionPanel ? (
        <section className="rounded-2xl border border-neutral-200 bg-white p-6 space-y-4">
          <h2 className="text-lg font-semibold text-neutral-900">
            Visitor Subscription Panel
          </h2>
          <p className="text-sm text-neutral-500">
            Control which subscription visitors see on this Mapsite™ and whether the
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
      ) : null}

      <section className="rounded-2xl border border-neutral-200 bg-white p-6 space-y-4">
        <h2 className="text-lg font-semibold text-neutral-900">Property</h2>
        <Field label="Title">
          <input
            className={inputClass}
            value={form.propertyTitle}
            onChange={(e) => setForm((p) => ({ ...p, propertyTitle: e.target.value }))}
          />
        </Field>
        <Field label="Price">
          <input
            className={inputClass}
            value={form.price}
            onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))}
          />
        </Field>
      </section>

      <section className="rounded-2xl border border-neutral-200 bg-white p-6 space-y-4">
        <h2 className="text-lg font-semibold text-neutral-900">
          Pin resource buttons
        </h2>
        <p className="text-sm text-neutral-500">
          MLS® and URL stay greyed out on the Mapsite™ until these are set. TEB™ and
          TTV™ use platform defaults when empty.
        </p>
        <Field label="MLS® URL">
          <input
            className={inputClass}
            value={form.mlsUrl}
            onChange={(e) => setForm((p) => ({ ...p, mlsUrl: e.target.value }))}
            placeholder="https://"
          />
        </Field>
        <Field label="URL (broker / listing)">
          <input
            className={inputClass}
            value={form.brokerUrl}
            onChange={(e) => setForm((p) => ({ ...p, brokerUrl: e.target.value }))}
            placeholder="https://"
          />
        </Field>
        <Field label="TEB™ URL (optional override)">
          <input
            className={inputClass}
            value={form.tebUrl}
            onChange={(e) => setForm((p) => ({ ...p, tebUrl: e.target.value }))}
            placeholder="Leave blank for this FAST Code shelf"
          />
        </Field>
        <Field label="TTV™ URL (optional override)">
          <input
            className={inputClass}
            value={form.ttvUrl}
            onChange={(e) => setForm((p) => ({ ...p, ttvUrl: e.target.value }))}
            placeholder="/talistv"
          />
        </Field>
      </section>

      <section className="rounded-2xl border border-neutral-200 bg-white p-6 space-y-4">
        <h2 className="text-lg font-semibold text-neutral-900">Branding</h2>
        {BRANDING_IMAGE_FIELDS.map(({ key, label, hint, previewClassName }) => {
          const imageUrl = form[key];
          const isUploading = uploadingBrandingField === key;

          return (
            <div
              key={key}
              className="rounded-xl border border-neutral-200 p-4 space-y-3"
            >
              <div>
                <p className="text-sm font-medium text-neutral-900">{label}</p>
                <p className="text-xs text-neutral-500 mt-0.5">{hint}</p>
              </div>

              <div className="flex flex-wrap items-center gap-4">
                {imageUrl ? (
                  <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-neutral-200 bg-neutral-100">
                    <Image
                      src={imageUrl}
                      alt={label}
                      fill
                      className={previewClassName}
                      unoptimized
                    />
                  </div>
                ) : (
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg border border-dashed border-neutral-300 bg-neutral-50 text-xs text-neutral-400">
                    No image
                  </div>
                )}

                <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-neutral-300 px-4 py-2 text-sm text-neutral-600 hover:bg-neutral-50">
                  <Upload className="h-4 w-4" />
                  {isUploading
                    ? "Uploading..."
                    : imageUrl
                      ? "Replace image"
                      : "Upload image"}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    disabled={uploadingBrandingField !== null}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) void handleBrandingUpload(key, file);
                      e.target.value = "";
                    }}
                  />
                </label>

                {imageUrl ? (
                  <button
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, [key]: "" }))}
                    className="text-sm text-red-600 hover:text-red-700"
                  >
                    Remove
                  </button>
                ) : null}
              </div>
            </div>
          );
        })}
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
            items={galleryItems}
            onChange={setGalleryItems}
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
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-neutral-900">Map</h2>
            <p className="mt-1 text-sm text-neutral-500">
              Same Home PIN flow as Build My Mapsite™ — search an address or drop
              a pin, then create the Talismaps™ for {mapsite.fastCode.toUpperCase()}.
            </p>
          </div>
          {mapHref ? (
            <Link
              href={mapHref}
              target="_blank"
              className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-200 px-3 py-1.5 text-sm text-neutral-700 hover:bg-neutral-50"
            >
              Open map <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          ) : null}
        </div>
        <HomePinLocationSection
          values={pinValues}
          pinImage={pinImage}
          onChange={(values) => {
            setForm((prev) => ({
              ...prev,
              propertyAddress:
                values.streetAddress !== undefined
                  ? values.streetAddress
                  : prev.propertyAddress,
              latitude:
                values.latitude !== undefined ? values.latitude : prev.latitude,
              longitude:
                values.longitude !== undefined ? values.longitude : prev.longitude,
              mapZoom:
                values.mapZoom !== undefined
                  ? String(values.mapZoom)
                  : prev.mapZoom,
              propertyDescription:
                values.pinWriteup !== undefined
                  ? values.pinWriteup
                  : prev.propertyDescription,
              pinColor:
                values.futurePinColor !== undefined
                  ? values.futurePinColor || prev.pinColor
                  : prev.pinColor,
              pinIcon:
                values.futurePinIcon !== undefined
                  ? values.futurePinIcon || prev.pinIcon
                  : prev.pinIcon,
              pinBorder:
                values.futurePinBorder !== undefined
                  ? values.futurePinBorder || prev.pinBorder
                  : prev.pinBorder,
              pinLabel:
                values.futurePinLabel !== undefined
                  ? values.futurePinLabel || prev.pinLabel
                  : prev.pinLabel,
              pinWhiteCenter:
                values.futurePinWhiteCenter !== undefined
                  ? values.futurePinWhiteCenter
                  : prev.pinWhiteCenter,
              pinAnimated:
                values.futurePinAnimated !== undefined
                  ? values.futurePinAnimated
                  : prev.pinAnimated,
              pinCategoryBadge:
                values.futurePinCategoryBadge !== undefined
                  ? values.futurePinCategoryBadge || ""
                  : prev.pinCategoryBadge,
            }));
          }}
          onPinImageChange={setPinImage}
        />
        <button
          type="button"
          disabled={!adminWritesEnabled || saving}
          onClick={() => void handleCreateMap()}
          className="inline-flex h-11 items-center justify-center rounded-xl bg-neutral-900 px-5 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
        >
          {saving
            ? "Creating…"
            : mapHref
              ? "Update Talismaps™"
              : "Create Talismaps™"}
        </button>
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
                setMessage("Mapsite™ unpublished");
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
