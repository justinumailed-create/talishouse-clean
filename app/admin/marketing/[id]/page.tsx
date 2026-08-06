"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  getBuildRequestDetails,
  updateBuildRequestAssets,
  updateBuildRequestDetails,
} from "../actions";

type BuildRequest = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  company: string | null;
  market_type: string | null;
  requested_account_type: string | null;
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
};

type MapSiteAsset = {
  profile_image: string | null;
  logo_image: string | null;
  pin_image: string | null;
  monologue_pdf: string | null;
  ebook_pdf: string | null;
};

export default function MarketingBuildRequestDetailsPage() {
  const params = useParams<{ id: string }>();
  const requestId = params.id;

  const [request, setRequest] = useState<BuildRequest | null>(null);
  const [assets, setAssets] = useState<MapSiteAsset | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const { request: req, assets: asset } = await getBuildRequestDetails(requestId);
      setRequest((req as BuildRequest) || null);
      setAssets((asset as MapSiteAsset) || null);
    }
    void load();
  }, [requestId]);

  async function saveDetails() {
    if (!request) return;
    setSaving(true);
    setError(null);
    const result = await updateBuildRequestDetails(request.id, {
      company: request.company,
      phone: request.phone,
      market_type: request.market_type,
      requested_account_type: request.requested_account_type,
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
    await updateBuildRequestDetails(request.id, { [field]: url });
  }

  async function replaceMapSiteAsset(
    field: keyof MapSiteAsset,
    file: File
  ) {
    const url = await uploadAndAttach(String(field), file);
    if (!url) return;
    const next = { ...(assets || {}), [field]: url } as MapSiteAsset;
    setAssets(next);
    await updateBuildRequestAssets(requestId, next);
  }

  if (!request) {
    return <div className="p-6 text-sm text-neutral-500">Loading request details...</div>;
  }

  const galleryCsv = (request.gallery_images || []).join("\n");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Build Request Details</h1>
          <p className="text-sm text-neutral-500 mt-1">
            {request.first_name} {request.last_name} · {request.status}
          </p>
        </div>
        <Link className="px-3 py-2 rounded bg-neutral-100 text-sm" href="/admin/marketing">
          Back to Build Requests
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <label className="text-sm">Client Name
          <input className="mt-1 w-full border rounded px-3 py-2" value={`${request.first_name} ${request.last_name}`} readOnly />
        </label>
        <label className="text-sm">Email
          <input className="mt-1 w-full border rounded px-3 py-2" value={request.email} readOnly />
        </label>
        <label className="text-sm">Phone
          <input className="mt-1 w-full border rounded px-3 py-2" value={request.phone || ""} onChange={(e) => setRequest({ ...request, phone: e.target.value })} />
        </label>
        <label className="text-sm">Company
          <input className="mt-1 w-full border rounded px-3 py-2" value={request.company || ""} onChange={(e) => setRequest({ ...request, company: e.target.value })} />
        </label>
        <label className="text-sm">Requested Account Type
          <input className="mt-1 w-full border rounded px-3 py-2" value={request.requested_account_type || ""} onChange={(e) => setRequest({ ...request, requested_account_type: e.target.value })} />
        </label>
        <label className="text-sm">Requested Market
          <input className="mt-1 w-full border rounded px-3 py-2" value={request.market_type || ""} onChange={(e) => setRequest({ ...request, market_type: e.target.value })} />
        </label>
        <label className="text-sm">FAST Code
          <input className="mt-1 w-full border rounded px-3 py-2" value={request.requested_fast_code || ""} readOnly />
        </label>
        <label className="text-sm">Property Title
          <input className="mt-1 w-full border rounded px-3 py-2" value={request.property_title || ""} onChange={(e) => setRequest({ ...request, property_title: e.target.value })} />
        </label>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <label className="text-sm">Street Address
          <input className="mt-1 w-full border rounded px-3 py-2" value={request.street_address || ""} onChange={(e) => setRequest({ ...request, street_address: e.target.value })} />
        </label>
        <label className="text-sm">PIN Label
          <input className="mt-1 w-full border rounded px-3 py-2" value={request.future_pin_label || ""} onChange={(e) => setRequest({ ...request, future_pin_label: e.target.value })} />
        </label>
        <label className="text-sm">Latitude
          <input className="mt-1 w-full border rounded px-3 py-2" value={request.latitude ?? ""} onChange={(e) => setRequest({ ...request, latitude: e.target.value ? Number(e.target.value) : null })} />
        </label>
        <label className="text-sm">Longitude
          <input className="mt-1 w-full border rounded px-3 py-2" value={request.longitude ?? ""} onChange={(e) => setRequest({ ...request, longitude: e.target.value ? Number(e.target.value) : null })} />
        </label>
      </div>

      <label className="block text-sm">Description
        <textarea className="mt-1 w-full border rounded px-3 py-2 min-h-24" value={request.description || ""} onChange={(e) => setRequest({ ...request, description: e.target.value })} />
      </label>
      <label className="block text-sm">PIN Writeup
        <textarea className="mt-1 w-full border rounded px-3 py-2 min-h-24" value={request.pin_writeup || ""} onChange={(e) => setRequest({ ...request, pin_writeup: e.target.value })} />
      </label>
      <label className="block text-sm">Notes
        <textarea className="mt-1 w-full border rounded px-3 py-2 min-h-24" value={request.notes || ""} onChange={(e) => setRequest({ ...request, notes: e.target.value })} />
      </label>

      <div className="rounded-xl border border-neutral-200 p-4 space-y-3">
        <h2 className="font-semibold text-neutral-900">Assets</h2>
        <AssetRow label="Logo" url={request.logo} />
        <input type="file" onChange={(e) => e.target.files?.[0] && void replaceBuildRequestAsset("logo", e.target.files[0])} />
        <AssetRow label="Header / Video" url={request.video} />
        <input type="file" onChange={(e) => e.target.files?.[0] && void replaceBuildRequestAsset("video", e.target.files[0])} />
        <AssetRow label="Profile Image" url={assets?.profile_image || null} />
        <input type="file" onChange={(e) => e.target.files?.[0] && void replaceMapSiteAsset("profile_image", e.target.files[0])} />
        <AssetRow label="PIN Image" url={assets?.pin_image || null} />
        <input type="file" onChange={(e) => e.target.files?.[0] && void replaceMapSiteAsset("pin_image", e.target.files[0])} />
        <AssetRow label="Monologue PDF" url={assets?.monologue_pdf || null} />
        <input type="file" onChange={(e) => e.target.files?.[0] && void replaceMapSiteAsset("monologue_pdf", e.target.files[0])} />
        <AssetRow label="EBook PDF" url={assets?.ebook_pdf || null} />
        <input type="file" onChange={(e) => e.target.files?.[0] && void replaceMapSiteAsset("ebook_pdf", e.target.files[0])} />
        <label className="block text-sm">Gallery Images (one URL per line)
          <textarea
            className="mt-1 w-full border rounded px-3 py-2 min-h-24"
            value={galleryCsv}
            onChange={(e) =>
              setRequest({
                ...request,
                gallery_images: e.target.value
                  .split("\n")
                  .map((url) => url.trim())
                  .filter(Boolean),
              })
            }
          />
        </label>
      </div>

      {uploading ? <p className="text-sm text-blue-700">Uploading {uploading}…</p> : null}
      {error ? <p className="text-sm text-red-700">{error}</p> : null}

      <button
        type="button"
        onClick={() => void saveDetails()}
        disabled={saving}
        className="px-4 py-2 rounded bg-black text-white text-sm disabled:opacity-60"
      >
        {saving ? "Saving..." : "Save Build Request"}
      </button>
    </div>
  );
}

function AssetRow({ label, url }: { label: string; url: string | null }) {
  return (
    <div className="flex items-center justify-between text-sm gap-3">
      <span className="font-medium">{label}</span>
      {url ? (
        <a href={url} target="_blank" rel="noreferrer" className="text-blue-700 underline break-all">
          Download / Open
        </a>
      ) : (
        <span className="text-neutral-400">No file</span>
      )}
    </div>
  );
}
