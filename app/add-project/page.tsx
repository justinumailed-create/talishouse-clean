"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAssociate } from "@/context/AssociateContext";
import { UI } from "@/styles/design-system";

export default function AddProjectPage() {
  const router = useRouter();
  const { fastCode, associateId } = useAssociate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [deliveryAcknowledgement, setDeliveryAcknowledgement] = useState(true);
  const [smsConsent, setSmsConsent] = useState(true);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    
    if (!deliveryAcknowledgement) {
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
      email: "", // email not collected in this form version
      phone,
      location: location || "unknown",
      participation_level: "referral",
      status: "pending",
      created_at: new Date().toISOString(),
    };

    try {
      const { error: insertError } = await supabase.from("applications").insert([payload]);
      if (insertError) throw insertError;
      
      setStatus("success");
      router.push("/project-received");
      router.refresh();
    } catch (err) {
      console.error("APPLICATION FAIL FULL:", JSON.stringify(err, null, 2));
      setStatus("error");
      setLoading(false);
    }
  }

  const isFormValid = deliveryAcknowledgement;

  return (
    <div className="container py-12 px-4">
      <div className="mx-auto max-w-md px-4 w-full">
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-bold tracking-tighter uppercase text-gray-900">
            PROPOSE A PROJECT
          </h1>
          <p className="text-sm text-gray-500 mt-4">
            Tell us about your project and we will help you bring it to life. Our placement team will guide you through the entire process, from inception to completion. Thank you for working with us.
          </p>
        </div>

        <section className="overflow-hidden rounded-[2rem] border border-gray-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.12)] w-full max-w-full">
          <div className="flex items-center justify-between bg-black px-6 py-5 text-white">
            <p className="text-sm font-bold uppercase tracking-[0.25em] self-center">
              SUBMIT DETAILS
            </p>
            <Link
              href="/"
              className="text-xl leading-none text-white/70 transition hover:text-white self-center"
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
                    placeholder="Enter location"
                    className={UI.input}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    a Google recognized street address, or geo-coordinates.
                  </p>
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
                  <p className="text-xs text-gray-500 mt-1">
                    FAST Code stands for "Fast Access - Standard Tracking". It is a means to allocate discounts or rewards to projects you propose. Some conditions apply.
                  </p>
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
                    I agree to the <a href="/terms-of-service" className="underline">Terms of Service</a> and <a href="/privacy-policy" className="underline">Privacy Policy</a> of Talishouse Homes & Cottages.
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
                    I agree to receive messages from Talishouse™, including tech and product bulletins and project updates or introductions near me. Message & Data Rates may apply. Text STOP to opt out anytime. Text Help for more information. Agreement to this option is not a condition of purchase.
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
      </div>
    </div>
  );
}