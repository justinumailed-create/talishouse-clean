"use client";

import { useState, useEffect } from "react";
import { supabase, Application } from "@/lib/supabase";
import Link from "next/link";

function generateFastCode(name: string): string {
  const cleaned = name.replace(/[^a-zA-Z]/g, "").toUpperCase();
  const prefix = cleaned.substring(0, 3) || "ASS";
  const random = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}${random}`;
}

function generateMapsiteSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .substring(0, 50);
}

async function checkFastCodeUnique(code: string): Promise<boolean> {
  const { data } = await supabase
    .from("associates")
    .select("fast_code")
    .eq("fast_code", code)
    .maybeSingle();
  return !data;
}

async function checkSlugUnique(slug: string): Promise<boolean> {
  const { data } = await supabase
    .from("associates")
    .select("mapsite_slug")
    .eq("mapsite_slug", slug)
    .maybeSingle();
  return !data;
}

async function findUniqueFastCode(name: string): Promise<string> {
  let code = generateFastCode(name);
  let attempts = 0;
  while (!(await checkFastCodeUnique(code)) && attempts < 10) {
    code = generateFastCode(name);
    attempts++;
  }
  return code;
}

async function findUniqueSlug(name: string): Promise<string> {
  let slug = generateMapsiteSlug(name);
  let attempts = 0;
  while (!(await checkSlugUnique(slug)) && attempts < 10) {
    slug = `${generateMapsiteSlug(name)}-${Math.floor(1000 + Math.random() * 9000)}`;
    attempts++;
  }
  return slug;
}

export default function ProjectApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState<{ fastCode: string; mapsiteSlug: string; name: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const { data, error } = await supabase
        .from("applications")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setApplications(data || []);
    } catch (err) {
      console.error("Fetch applications error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (app: Application) => {
    setProcessingId(app.id);
    setError(null);

    try {
      const fastCode = await findUniqueFastCode(app.name);
      const mapsiteSlug = await findUniqueSlug(app.name);

      const associatePayload = {
        name: app.name,
        email: app.email,
        phone: app.phone,
        fast_code: fastCode,
        mapsite_slug: mapsiteSlug,
        is_page_enabled: true,
        created_at: new Date().toISOString(),
      };

      console.log("APPROVE - ASSOCIATE INSERT PAYLOAD:", JSON.stringify(associatePayload, null, 2));

      const { error: associateError } = await supabase.from("associates").insert([associatePayload]);

      if (associateError) {
        console.error("ASSOCIATE INSERT ERROR FULL:", JSON.stringify(associateError, null, 2));
        throw new Error(`Failed to create associate: ${associateError.message}`);
      }

      // Also create a entry in fast_codes for legacy support
      const fastCodePayload = {
        code: fastCode,
        name: app.name,
        email: app.email,
        phone: app.phone,
      };
      
      console.log("APPROVE - FAST_CODE INSERT PAYLOAD:", JSON.stringify(fastCodePayload, null, 2));

      const { error: fcError } = await supabase.from("fast_codes").insert([fastCodePayload]);
      if (fcError) {
        console.warn("FAST CODE INSERT ERROR FULL:", JSON.stringify(fcError, null, 2));
        // We don't throw here to avoid blocking the main flow if legacy support fails
      }

      const { error: updateError } = await supabase
        .from("applications")
        .update({ status: "approved" })
        .eq("id", app.id);

      if (updateError) {
        console.error("APPLICATION UPDATE ERROR FULL:", JSON.stringify(updateError, null, 2));
        throw new Error(`Failed to update status: ${updateError.message}`);
      }

      setShowSuccess({ fastCode, mapsiteSlug, name: app.name });
      fetchApplications();
    } catch (err: any) {
      console.error("APPROVE PROCESS ERROR FULL:", JSON.stringify(err, null, 2));
      setError(err instanceof Error ? err.message : "Failed to approve application");
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id: string) => {
    setProcessingId(id);
    setError(null);

    try {
      const { error } = await supabase
        .from("applications")
        .update({ status: "rejected" })
        .eq("id", id);

      if (error) {
        console.error("REJECT ERROR FULL:", JSON.stringify(error, null, 2));
        throw error;
      }
      fetchApplications();
    } catch (err) {
      console.error("REJECT HANDLER ERROR FULL:", JSON.stringify(err, null, 2));
      setError("Failed to reject application");
    } finally {
      setProcessingId(null);
    }
  };

  const getRoleLabel = (type: string) => {
    switch (type) {
      case "referral": return "Referral Partner";
      case "resale": return "Resale Partner";
      case "fulfillment": return "Fulfillment Partner";
      default: return type;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full">Pending</span>;
      case "approved":
        return <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">Approved</span>;
      case "rejected":
        return <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full">Rejected</span>;
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-[#6e6e73]">Loading...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Project Applications</h1>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {showSuccess && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-xl p-4">
          <p className="text-green-800 font-medium">
            {showSuccess.name} has been approved!
          </p>
          <p className="text-sm text-green-700 mt-1">
            FAST Code: <span className="font-mono font-bold">{showSuccess.fastCode}</span>
          </p>
          <p className="text-sm text-green-700">
            Mapsite: <Link href={`/mapsite/${showSuccess.mapsiteSlug}`} className="underline hover:text-green-900">
              talishouse.com/mapsite/{showSuccess.mapsiteSlug}
            </Link>
          </p>
          <button
            onClick={() => setShowSuccess(null)}
            className="mt-2 text-sm text-green-600 hover:text-green-800"
          >
            Dismiss
          </button>
        </div>
      )}

      {applications.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#e5e5e5] p-12 text-center">
          <p className="text-[#6e6e73]">No applications yet.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-[#e5e5e5] overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#e5e5e5]">
                <th className="text-left px-4 py-3 text-xs font-medium text-[#6e6e73] uppercase">Name</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[#6e6e73] uppercase">Participation</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[#6e6e73] uppercase">Location</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[#6e6e73] uppercase">Status</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[#6e6e73] uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((app) => (
                <tr key={app.id} className="border-b border-[#e5e5e5] last:border-0">
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-sm">{app.name}</p>
                      <p className="text-xs text-[#6e6e73]">{app.email}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm">{getRoleLabel(app.participation_level)}</td>
                  <td className="px-4 py-3 text-sm">{app.location}</td>
                  <td className="px-4 py-3">{getStatusBadge(app.status)}</td>
                  <td className="px-4 py-3">
                    {app.status === "pending" && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApprove(app)}
                          disabled={processingId === app.id}
                          className="px-3 py-1.5 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700 disabled:opacity-50"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleReject(app.id)}
                          disabled={processingId === app.id}
                          className="px-3 py-1.5 bg-red-500 text-white text-xs rounded-lg hover:bg-red-600 disabled:opacity-50"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-8 bg-white rounded-xl border border-[#e5e5e5] p-5">
        <h3 className="font-semibold text-sm mb-3">How the Application System Works</h3>
        <p className="text-sm text-[#6e6e73] leading-relaxed mb-4">
          Users submit applications through the Propose a Project page. Each submission creates an application record with "pending" status.
        </p>
        <p className="text-sm text-[#6e6e73] leading-relaxed mb-4">
          When you approve an application, the system automatically:
        </p>
        <ul className="text-sm text-[#6e6e73] leading-relaxed list-disc list-inside mb-4">
          <li>Generates a unique FAST Code (first 3 letters of name + 4 random digits)</li>
          <li>Generates a unique Mapsite slug (URL-friendly name)</li>
          <li>Creates an associate record in the associates table</li>
          <li>Updates the application status to "approved"</li>
        </ul>
        <p className="text-sm text-[#6e6e73] leading-relaxed">
          Associates are only created after admin approval - not at submission time.
        </p>
      </div>
    </div>
  );
}