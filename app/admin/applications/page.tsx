"use client";

import { useState, useEffect } from "react";
import { supabase, AssociateApplication } from "@/lib/supabase";
import Link from "next/link";

function generateFastCode(name: string): string {
  const initial = name.trim() ? name[0].toUpperCase() : "A";
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${initial}${random}`;
}

async function checkFastCodeUnique(code: string): Promise<boolean> {
  const { data } = await supabase
    .from("users")
    .select("fast_code")
    .eq("fast_code", code)
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

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<AssociateApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState<{ fastCode: string; name: string } | null>(null);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    const { data, error } = await supabase
      .from("associate_applications")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setApplications(data);
    }
    setLoading(false);
  };

  const handleApprove = async (app: AssociateApplication) => {
    setProcessingId(app.id);

    let fastCode = app.preferred_fast_code?.toUpperCase().trim() || "";
    
    if (!fastCode) {
      fastCode = await findUniqueFastCode(app.name);
    } else {
      const isUnique = await checkFastCodeUnique(fastCode);
      if (!isUnique) {
        fastCode = await findUniqueFastCode(app.name);
      }
    }

    const payload = {
      name: app.name,
      email: app.email,
      phone: app.phone,
      fast_code: fastCode,
      role: "associate",
      role_type: app.role_type,
      location: app.location,
    };
    console.log("USER INSERT - Payload:", JSON.stringify(payload, null, 2));

    const { error: insertError } = await supabase.from("users").insert([payload]);

    if (insertError) {
      console.error("USER INSERT ERROR:", JSON.stringify(insertError, null, 2));
      setProcessingId(null);
      return;
    }
    console.log("USER INSERT SUCCESS");

    await supabase
      .from("associate_applications")
      .update({ status: "approved" })
      .eq("id", app.id);
    
    setShowSuccess({ fastCode, name: app.name });
    fetchApplications();
    setProcessingId(null);
  };

  const handleReject = async (id: string) => {
    setProcessingId(id);
    await supabase
      .from("associate_applications")
      .update({ status: "rejected" })
      .eq("id", id);
    fetchApplications();
    setProcessingId(null);
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
        <h1 className="text-2xl font-semibold">Associate Applications</h1>
      </div>

      {showSuccess && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-xl p-4">
          <p className="text-green-800 font-medium">
            {showSuccess.name} has been approved!
          </p>
          <p className="text-sm text-green-700 mt-1">
            FAST Code: <span className="font-mono font-bold">{showSuccess.fastCode}</span>
          </p>
          <p className="text-sm text-green-700">
            Page: <Link href={`/a/${showSuccess.fastCode}`} className="underline hover:text-green-900">
              talishouse.com/a/{showSuccess.fastCode}
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
                <th className="text-left px-4 py-3 text-xs font-medium text-[#6e6e73] uppercase">Role</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[#6e6e73] uppercase">Location</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[#6e6e73] uppercase">Preferred Code</th>
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
                  <td className="px-4 py-3 text-sm">{getRoleLabel(app.role_type)}</td>
                  <td className="px-4 py-3 text-sm">{app.location}</td>
                  <td className="px-4 py-3 text-sm font-mono">
                    {app.preferred_fast_code || "—"}
                  </td>
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
        <h3 className="font-semibold text-sm mb-3">How the Associate System Works</h3>
        <p className="text-sm text-[#6e6e73] leading-relaxed mb-4">
          Associates are onboarded through the Business Office application process.
        </p>
        <p className="text-sm text-[#6e6e73] leading-relaxed mb-4">
          Each approved associate is assigned a FAST Code (Fast Access Standard Tracking Code), which acts as their unique identity within the Talishouse ecosystem. This FAST Code powers a personalized, white-labeled associate page where prospects can engage directly.
        </p>
        <p className="text-sm text-[#6e6e73] leading-relaxed">
          When a prospect submits a project or expresses interest through this page, the system automatically tags the lead with the associate's FAST Code. This ensures accurate lead attribution, commission eligibility, and full pipeline tracking.
        </p>
      </div>
    </div>
  );
}
