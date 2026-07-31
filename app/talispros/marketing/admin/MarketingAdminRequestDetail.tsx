"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  getMarketingRegistrationDetails,
  marketingActivateMapSite,
  marketingApproveBuildRequest,
  marketingAssignFastCode,
  marketingGenerateDraftMapSite,
  marketingSendRegistration,
  marketingSetPaymentLink,
  marketingUpdateBuildRequestAssets,
  marketingUpdateBuildRequestDetails,
  marketingUpdateLinkedMapSite,
} from "./actions";
import {
  CLIENT_LOGIN_PATH,
  MARKETING_ADMIN_PATH,
} from "@/lib/mapsite-account-session";
import {
  ADPRO_CATEGORY_OPTIONS,
  adproCategoryLabel,
} from "@/lib/talispros/adpro-categories";

type BuildRequest = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  company: string | null;
  market_type: string | null;
  requested_account_type: string | null;
  adpro_category: string | null;
  requested_fast_code: string | null;
  street_address: string | null;
  latitude: number | null;
  longitude: number | null;
  pin_writeup: string | null;
  property_title: string | null;
  future_pin_label: string | null;
  description: string | null;
  logo: string | null;
  gallery_images: string[] | null;
  video: string | null;
  notes: string | null;
  status: string;
  registration_link: string | null;
  linked_mapsite_id: string | null;
};

type MapSiteAsset = {
  profile_image: string | null;
  logo_image: string | null;
  pin_image: string | null;
  monologue_pdf: string | null;
  ebook_pdf: string | null;
};

type LinkedMapSite = {
  id: string;
  fast_code: string;
  status: string;
  property_title: string | null;
  cover_image: string | null;
  header_image_url: string | null;
  mls_url: string | null;
  broker_url: string | null;
  teb_url: string | null;
  ttv_url: string | null;
  assigned_marketing_manager: string | null;
};

export default function MarketingAdminRequestDetail({
  requestId,
}: {
  requestId: string;
}) {
  const [request, setRequest] = useState<BuildRequest | null>(null);
  const [assets, setAssets] = useState<MapSiteAsset | null>(null);
  const [mapsite, setMapSite] = useState<LinkedMapSite | null>(null);
  const [paymentLink, setPaymentLink] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState<string | null>(null);
  const [actionPending, setActionPending] = useState(false);

  useEffect(() => {
    async function load() {
      const { request: req, assets: asset, mapsite: linked } =
        await getMarketingRegistrationDetails(requestId);
      const typedRequest = (req as BuildRequest) || null;
      setRequest(typedRequest);
      setAssets((asset as MapSiteAsset) || null);
      setMapSite((linked as LinkedMapSite) || null);
      setPaymentLink(typedRequest?.registration_link || "");
    }
    void load();
  }, [requestId]);

  async function saveDetails() {
    if (!request) return;
    setSaving(true);
    setError(null);
    const result = await marketingUpdateBuildRequestDetails(request.id, {
      company: request.company,
      phone: request.phone,
      market_type: request.market_type,
      requested_account_type: request.requested_account_type,
      adpro_category: request.adpro_category,
      street_address: request.street_address,
      latitude: request.latitude,
      longitude: request.longitude,
      property_title: request.property_title,
      description: request.description,
      pin_writeup: request.pin_writeup,
      future_pin_label: request.future_pin_label,
      notes: request.notes,
      logo: request.logo,
      gallery_images: request.gallery_images || [],
      video: request.video,
    });
    if (!result.ok) setError(result.error || "Save failed");
    setSaving(false);
  }

  async function uploadAndAttach(fieldName: string, file: File) {
    setUploading(fieldName);
    const body = new FormData();
    body.append("requestId", requestId);
    body.append("fieldName", fieldName);
    body.append("file", file);
    const response = await fetch("/api/talispros/build-mapsite/upload", {
      method: "POST",
      body,
    });
    const payload = (await response.json()) as { url?: string; error?: string };
    setUploading(null);
    if (!response.ok || !payload.url) {
      setError(payload.error || "Upload failed");
      return null;
    }
    return payload.url;
  }

  async function replaceBuildRequestAsset(field: "logo" | "video", file: File) {
    const url = await uploadAndAttach(field, file);
    if (!url || !request) return;
    const next = { ...request, [field]: url };
    setRequest(next);
    await marketingUpdateBuildRequestDetails(request.id, { [field]: url });
  }

  async function replaceMapsiteAsset(field: keyof MapSiteAsset, file: File) {
    const url = await uploadAndAttach(String(field), file);
    if (!url) return;
    const next = { ...(assets || {}), [field]: url } as MapSiteAsset;
    setAssets(next);
    await marketingUpdateBuildRequestAssets(requestId, next);
  }

  async function runWorkflowAction(
    action: () => Promise<{ ok: boolean; error?: string }>
  ) {
    setActionPending(true);
    setError(null);
    const result = await action();
    if (!result.ok) {
      setError(result.error || "Action failed");
      setActionPending(false);
      return;
    }
    const { request: req, assets: asset, mapsite: linked } =
      await getMarketingRegistrationDetails(requestId);
    const typedRequest = (req as BuildRequest) || null;
    setRequest(typedRequest);
    setAssets((asset as MapSiteAsset) || null);
    setMapSite((linked as LinkedMapSite) || null);
    setPaymentLink(typedRequest?.registration_link || "");
    setActionPending(false);
  }

  async function savePaymentLink() {
    if (!request) return;
    const defaultLink = `/talispros/register?request=${request.id}`;
    const link = paymentLink.trim() || defaultLink;
    await runWorkflowAction(() => marketingSetPaymentLink(request.id, link));
  }

  if (!request) {
    return <div className="p-6 text-sm text-neutral-500">Loading registration...</div>;
  }

  const fastCode = request.requested_fast_code?.toLowerCase() || "";
  const galleryCsv = (request.gallery_images || []).join("\n");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Registration Review</h1>
          <p className="mt-1 text-sm text-neutral-500">
            {request.first_name} {request.last_name} · {request.status}
          </p>
        </div>
        <Link
          href={MARKETING_ADMIN_PATH}
          className="rounded bg-neutral-100 px-3 py-2 text-sm"
        >
          Back to Registrations
        </Link>
      </div>

      <section className="rounded-xl border border-neutral-200 bg-white p-4">
        <h2 className="mb-3 font-semibold text-neutral-900">Workflow</h2>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={actionPending}
            onClick={() =>
              runWorkflowAction(() => marketingApproveBuildRequest(request.id))
            }
            className="rounded bg-emerald-100 px-3 py-2 text-sm text-emerald-800 disabled:opacity-50"
          >
            Approve
          </button>
          <button
            type="button"
            disabled={actionPending}
            onClick={() => runWorkflowAction(() => marketingAssignFastCode(request.id))}
            className="rounded bg-indigo-100 px-3 py-2 text-sm text-indigo-800 disabled:opacity-50"
          >
            Assign FAST Code
          </button>
          <button
            type="button"
            disabled={actionPending}
            onClick={() =>
              runWorkflowAction(() => marketingGenerateDraftMapSite(request.id))
            }
            className="rounded bg-green-100 px-3 py-2 text-sm text-green-800 disabled:opacity-50"
          >
            Convert to Active MapSite
          </button>
          <button
            type="button"
            disabled={actionPending}
            onClick={() =>
              runWorkflowAction(() => marketingActivateMapSite(request.id))
            }
            className="rounded bg-teal-100 px-3 py-2 text-sm text-teal-900 disabled:opacity-50"
          >
            Activate MapSite
          </button>
          <button
            type="button"
            disabled={actionPending}
            onClick={() =>
              runWorkflowAction(() => marketingSendRegistration(request.id))
            }
            className="rounded bg-blue-100 px-3 py-2 text-sm text-blue-800 disabled:opacity-50"
          >
            Generate Payment Link
          </button>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]">
          <input
            type="text"
            value={paymentLink}
            onChange={(event) => setPaymentLink(event.target.value)}
            placeholder={`/talispros/register?request=${request.id}`}
            className="w-full rounded border border-neutral-300 px-3 py-2 text-sm"
          />
          <button
            type="button"
            disabled={actionPending}
            onClick={() => void savePaymentLink()}
            className="rounded bg-neutral-900 px-4 py-2 text-sm text-white disabled:opacity-50"
          >
            Save Payment Link
          </button>
        </div>

        {request.registration_link ? (
          <p className="mt-3 text-sm text-neutral-600">
            Payment link:{" "}
            <Link href={request.registration_link} className="text-blue-700 underline">
              {request.registration_link}
            </Link>
          </p>
        ) : null}

        {fastCode ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3 text-sm">
              <p className="font-medium text-neutral-900">Client access</p>
              <p className="mt-1 text-neutral-600">
                Email: {request.email}
                <br />
                FAST Code: {fastCode.toUpperCase()}
              </p>
              <Link href={CLIENT_LOGIN_PATH} className="mt-2 inline-block text-blue-700 underline">
                Open client login
              </Link>
            </div>
            {fastCode ? (
              <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3 text-sm">
                <p className="font-medium text-neutral-900">MapSite tools</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Link
                    href={`/talispros/mapsites/${fastCode}`}
                    className="rounded bg-white px-2 py-1 text-blue-700 underline"
                  >
                    Preview MapSite
                  </Link>
                  <Link
                    href={`/talispros/mapsites/${fastCode}/edit`}
                    className="rounded bg-white px-2 py-1 text-blue-700 underline"
                  >
                    Edit MapSite
                  </Link>
                </div>
              </div>
            ) : null}
          </div>
        ) : null}
      </section>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <label className="text-sm">
          Client Name
          <input
            className="mt-1 w-full rounded border px-3 py-2"
            value={`${request.first_name} ${request.last_name}`}
            readOnly
          />
        </label>
        <label className="text-sm">
          Email
          <input className="mt-1 w-full rounded border px-3 py-2" value={request.email} readOnly />
        </label>
        <label className="text-sm">
          Phone
          <input
            className="mt-1 w-full rounded border px-3 py-2"
            value={request.phone || ""}
            onChange={(event) => setRequest({ ...request, phone: event.target.value })}
          />
        </label>
        <label className="text-sm">
          Company
          <input
            className="mt-1 w-full rounded border px-3 py-2"
            value={request.company || ""}
            onChange={(event) => setRequest({ ...request, company: event.target.value })}
          />
        </label>
        <label className="text-sm">
          Requested Account Type
          <input
            className="mt-1 w-full rounded border px-3 py-2"
            value={request.requested_account_type || ""}
            onChange={(event) =>
              setRequest({ ...request, requested_account_type: event.target.value })
            }
          />
        </label>
        <label className="text-sm">
          Adpros Category
          <select
            className="mt-1 w-full rounded border px-3 py-2"
            value={request.adpro_category || ""}
            onChange={(event) =>
              setRequest({
                ...request,
                adpro_category: event.target.value || null,
              })
            }
          >
            <option value="">None</option>
            {ADPRO_CATEGORY_OPTIONS.map((option) => (
              <option key={option.code} value={option.code}>
                {option.label}
              </option>
            ))}
          </select>
          {request.adpro_category ? (
            <p className="mt-1 text-xs text-neutral-500">
              Selected: {adproCategoryLabel(request.adpro_category)}
            </p>
          ) : null}
        </label>
        <label className="text-sm">
          Market
          <input
            className="mt-1 w-full rounded border px-3 py-2"
            value={request.market_type || ""}
            onChange={(event) =>
              setRequest({ ...request, market_type: event.target.value })
            }
          />
        </label>
        <label className="text-sm">
          FAST Code
          <input
            className="mt-1 w-full rounded border px-3 py-2"
            value={request.requested_fast_code || ""}
            readOnly
          />
        </label>
        <label className="text-sm">
          Property Title
          <input
            className="mt-1 w-full rounded border px-3 py-2"
            value={request.property_title || ""}
            onChange={(event) =>
              setRequest({ ...request, property_title: event.target.value })
            }
          />
        </label>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <label className="text-sm">
          Street Address
          <input
            className="mt-1 w-full rounded border px-3 py-2"
            value={request.street_address || ""}
            onChange={(event) =>
              setRequest({ ...request, street_address: event.target.value })
            }
          />
        </label>
        <label className="text-sm">
          PIN Label
          <input
            className="mt-1 w-full rounded border px-3 py-2"
            value={request.future_pin_label || ""}
            onChange={(event) =>
              setRequest({ ...request, future_pin_label: event.target.value })
            }
          />
        </label>
        <label className="text-sm">
          Latitude
          <input
            className="mt-1 w-full rounded border px-3 py-2"
            value={request.latitude ?? ""}
            onChange={(event) =>
              setRequest({
                ...request,
                latitude: event.target.value ? Number(event.target.value) : null,
              })
            }
          />
        </label>
        <label className="text-sm">
          Longitude
          <input
            className="mt-1 w-full rounded border px-3 py-2"
            value={request.longitude ?? ""}
            onChange={(event) =>
              setRequest({
                ...request,
                longitude: event.target.value ? Number(event.target.value) : null,
              })
            }
          />
        </label>
      </div>

      <label className="block text-sm">
        Description
        <textarea
          className="mt-1 min-h-24 w-full rounded border px-3 py-2"
          value={request.description || ""}
          onChange={(event) =>
            setRequest({ ...request, description: event.target.value })
          }
        />
      </label>

      <div className="space-y-3 rounded-xl border border-neutral-200 p-4">
        <h2 className="font-semibold text-neutral-900">Assets</h2>
        <AssetRow label="Logo" url={request.logo} />
        <input
          type="file"
          onChange={(event) =>
            event.target.files?.[0] &&
            void replaceBuildRequestAsset("logo", event.target.files[0])
          }
        />
        <AssetRow label="Profile Image" url={assets?.profile_image || null} />
        <input
          type="file"
          onChange={(event) =>
            event.target.files?.[0] &&
            void replaceMapsiteAsset("profile_image", event.target.files[0])
          }
        />
        <label className="block text-sm">
          Gallery Images (one URL per line)
          <textarea
            className="mt-1 min-h-24 w-full rounded border px-3 py-2"
            value={galleryCsv}
            onChange={(event) =>
              setRequest({
                ...request,
                gallery_images: event.target.value
                  .split("\n")
                  .map((url) => url.trim())
                  .filter(Boolean),
              })
            }
          />
        </label>
      </div>

      {mapsite ? (
        <section className="space-y-4 rounded-xl border border-neutral-200 bg-white p-4">
          <div>
            <h2 className="font-semibold text-neutral-900">MapSite™ Configuration</h2>
            <p className="mt-1 text-xs text-neutral-500">
              Status: {mapsite.status} · FAST Code: {mapsite.fast_code || "—"}
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <label className="text-sm">
              Assign FAST Code
              <input
                className="mt-1 w-full rounded border px-3 py-2 uppercase"
                value={mapsite.fast_code || ""}
                onChange={(event) =>
                  setMapSite({
                    ...mapsite,
                    fast_code: event.target.value.toUpperCase(),
                  })
                }
              />
            </label>
            <label className="text-sm">
              Assigned Marketing Manager
              <input
                className="mt-1 w-full rounded border px-3 py-2"
                value={mapsite.assigned_marketing_manager || ""}
                onChange={(event) =>
                  setMapSite({
                    ...mapsite,
                    assigned_marketing_manager: event.target.value,
                  })
                }
              />
            </label>
            <label className="text-sm lg:col-span-2">
              Cover Image URL
              <input
                className="mt-1 w-full rounded border px-3 py-2"
                value={mapsite.cover_image || mapsite.header_image_url || ""}
                onChange={(event) =>
                  setMapSite({ ...mapsite, cover_image: event.target.value })
                }
              />
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={async (event) => {
                const file = event.target.files?.[0];
                if (!file) return;
                const url = await uploadAndAttach("cover_image", file);
                if (!url) return;
                setMapSite({ ...mapsite, cover_image: url });
                await marketingUpdateLinkedMapSite(request.id, { cover_image: url });
              }}
            />
            <label className="text-sm">
              MLS URL
              <input
                className="mt-1 w-full rounded border px-3 py-2"
                value={mapsite.mls_url || ""}
                onChange={(event) =>
                  setMapSite({ ...mapsite, mls_url: event.target.value })
                }
              />
            </label>
            <label className="text-sm">
              Broker URL
              <input
                className="mt-1 w-full rounded border px-3 py-2"
                value={mapsite.broker_url || ""}
                onChange={(event) =>
                  setMapSite({ ...mapsite, broker_url: event.target.value })
                }
              />
            </label>
            <label className="text-sm">
              TEB™ URL
              <input
                className="mt-1 w-full rounded border px-3 py-2"
                value={mapsite.teb_url || ""}
                onChange={(event) =>
                  setMapSite({ ...mapsite, teb_url: event.target.value })
                }
              />
            </label>
            {mapsite.fast_code ? (
              <a
                href={`/talispros/admin/mapsites/${encodeURIComponent(mapsite.fast_code)}`}
                className="inline-flex text-sm font-medium text-neutral-900 underline underline-offset-2"
              >
                Open TalisBooks™ manager (create, images, reorder, publish, attach)
              </a>
            ) : null}
            <label className="text-sm">
              TTV™ URL
              <input
                className="mt-1 w-full rounded border px-3 py-2"
                value={mapsite.ttv_url || ""}
                onChange={(event) =>
                  setMapSite({ ...mapsite, ttv_url: event.target.value })
                }
              />
            </label>
          </div>
          <button
            type="button"
            disabled={actionPending}
            onClick={() =>
              runWorkflowAction(() =>
                marketingUpdateLinkedMapSite(request.id, {
                  fast_code: mapsite.fast_code,
                  cover_image: mapsite.cover_image,
                  mls_url: mapsite.mls_url,
                  broker_url: mapsite.broker_url,
                  teb_url: mapsite.teb_url,
                  ttv_url: mapsite.ttv_url,
                  assigned_marketing_manager: mapsite.assigned_marketing_manager,
                })
              )
            }
            className="rounded bg-neutral-800 px-4 py-2 text-sm text-white disabled:opacity-50"
          >
            Save MapSite Configuration
          </button>
        </section>
      ) : (
        <p className="rounded-xl border border-dashed border-neutral-300 bg-neutral-50 px-4 py-3 text-sm text-neutral-600">
          No linked MapSite™ yet. Claims from the fullscreen map associate
          automatically; otherwise use Convert to Active MapSite.
        </p>
      )}

      {uploading ? <p className="text-sm text-blue-700">Uploading {uploading}…</p> : null}
      {error ? <p className="text-sm text-red-700">{error}</p> : null}

      <button
        type="button"
        onClick={() => void saveDetails()}
        disabled={saving}
        className="rounded bg-black px-4 py-2 text-sm text-white disabled:opacity-60"
      >
        {saving ? "Saving..." : "Save Registration"}
      </button>
    </div>
  );
}

function AssetRow({ label, url }: { label: string; url: string | null }) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="font-medium">{label}</span>
      {url ? (
        <a href={url} target="_blank" rel="noreferrer" className="break-all text-blue-700 underline">
          Open
        </a>
      ) : (
        <span className="text-neutral-400">No file</span>
      )}
    </div>
  );
}
