"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase, safeInsertLead } from "@/lib/supabase";
import { useAssociate } from "@/context/AssociateContext";
import { UI } from "@/styles/design-system";
import { formatCAD } from "@/utils/currency";

export default function AddProjectPage() {
  const router = useRouter();
  const { fastCode, associateId } = useAssociate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [deliveryAcknowledgement, setDeliveryAcknowledgement] = useState(false);
  const [smsConsent, setSmsConsent] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    
    if (!deliveryAcknowledgement || !smsConsent) {
      setError("You must accept the terms to continue");
      return;
    }

    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const phone = formData.get("phone") as string;
    const location = formData.get("location") as string;
    const preferredFastCode = formData.get("preferredFastCode") as string;

    if (!name || !phone || !location) {
      setError("All fields are required");
      setLoading(false);
      return;
    }

    const payload = {
      name,
      phone,
      location: location || "unknown",
      source: "add-project",
      status: "new",
      deal_status: "pending",
      fast_code: fastCode || "DIRECT",
      created_at: new Date().toISOString(),
      project_value: null,
      commission_rate: null,
      split_percentage: null,
    };

    try {
      await safeInsertLead(payload);
      setStatus("success");
      router.push("/project-received");
    } catch (err) {
      console.error("LEAD FAIL FULL:", JSON.stringify(err, null, 2));
      setStatus("error");
      setLoading(false);
    }
  }

  const isFormValid = deliveryAcknowledgement && smsConsent;

  return (
    <div className="container py-12 px-4">
      <div className="mx-auto max-w-md px-4 w-full">
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-bold tracking-tighter uppercase text-gray-900">
            JOIN US
          </h1>
        </div>

        <section className="overflow-hidden rounded-[2rem] border border-gray-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.12)] w-full max-w-full">
          <div className="flex items-center justify-between bg-black px-6 py-5 text-white">
            <p className="text-sm font-bold uppercase tracking-[0.25em]">
              SUBMIT DETAILS
            </p>
            <Link
              href="/"
              className="text-xl leading-none text-white/70 transition hover:text-white"
              aria-label="Close join us"
            >
              ×
            </Link>
          </div>

          <div className="p-6 sm:p-8">
            <p className="text-sm text-gray-500 mb-6 italic">
              Projects must be non-political and in good taste by generally accepted standards. We look forward to working with you.
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-3">
                <label className="block">
                  <span className={UI.label}>Name</span>
                  <input
                    required
                    type="text"
                    name="name"
                    placeholder="Full Name"
                    className={UI.input}
                  />
                </label>

                <label className="block">
                  <span className={UI.label}>Location</span>
                  <input
                    required
                    type="text"
                    name="location"
                    placeholder="City, State"
                    className={UI.input}
                  />
                </label>

                <label className="block">
                  <span className={UI.label}>Mobile Phone</span>
                  <input
                    required
                    type="tel"
                    name="phone"
                    placeholder="(555) 000-0000"
                    className={UI.input}
                  />
                </label>

                <label className="block">
                  <span className={UI.label}>Request Preferred FAST Code (optional)</span>
                  <input
                    type="text"
                    name="preferredFastCode"
                    placeholder="Enter preferred FAST code"
                    className={UI.input}
                  />
                </label>
              </div>

              {status === "success" && (
                <p className="text-green-600 text-xs mt-2">✓ Saved successfully</p>
              )}

              {status === "error" && (
                <p className="text-red-600 text-xs mt-2">{error}</p>
              )}

              <div className="space-y-4 pt-4 acknowledgement-container w-full max-w-full overflow-hidden">
                <label className="flex items-start gap-3 cursor-pointer acknowledgement w-full max-w-full">
                  <input
                    type="checkbox"
                    checked={deliveryAcknowledgement}
                    onChange={(e) => {
                      setDeliveryAcknowledgement(e.target.checked);
                      if (error === "You must accept the terms to continue") {
                        setError("");
                      }
                    }}
                    className="mt-1 w-5 h-5 rounded border-gray-300 text-[#1279c9] focus:ring-[#1279c9] cursor-pointer flex-shrink-0"
                  />
                  <span className="text-sm text-gray-600 leading-relaxed acknowledgement-text flex-1 min-w-0 break-words">
                    I acknowledge and accept that not every location will be suitable for delivery right to a building site. I understand that pricing is to the nearest suitable location at our sole discretion.
                  </span>
                </label>

                <label className="flex items-start gap-3 cursor-pointer acknowledgement w-full max-w-full">
                  <input
                    type="checkbox"
                    checked={smsConsent}
                    onChange={(e) => {
                      setSmsConsent(e.target.checked);
                      if (error === "You must accept the terms to continue") {
                        setError("");
                      }
                    }}
                    className="mt-1 w-5 h-5 rounded border-gray-300 text-[#1279c9] focus:ring-[#1279c9] cursor-pointer flex-shrink-0"
                  />
                  <span className="text-sm text-gray-600 leading-relaxed acknowledgement-text flex-1 min-w-0 break-words">
                    I agree to receive promotional messages sent via an autodialer - 4 Msgs/Month. Msg & Data Rates may apply. Text STOP to opt out anytime. Text Help for more information. Agreement to this feature is not a condition of purchase. I also agree to the Terms of Service and Privacy Policy of Talishouse Homes & Cottages.
                  </span>
                </label>
              </div>

              <button
                type="submit"
                disabled={loading || !isFormValid}
                className={UI.button}
                style={{ backgroundColor: isFormValid ? undefined : '#d1d5db', color: isFormValid ? undefined : '#6b7280' }}
              >
                {loading ? "Submitting..." : "SUBMIT"}
              </button>
            </form>
          </div>
        </section>

        <p className="text-center text-xs text-gray-500 mt-6">
          Talishouse Homes & Cottages start at {formatCAD(58.50)} per sq.ft.. Typically they are up in a day and move-in ready in a week. Lease-To-Own is available, OAC.
        </p>
      </div>
    </div>
  );
}