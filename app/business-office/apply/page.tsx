"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default function ApplyPage() {
  const [formData, setFormData] = useState({
    roleType: "",
    name: "",
    email: "",
    phone: "",
    location: "",
    preferredFastCode: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    if (!formData.roleType || !formData.name || !formData.email || !formData.phone || !formData.location) {
      setError("Please fill in all required fields.");
      setIsSubmitting(false);
      return;
    }

    const payload = {
      name: formData.name.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim(),
      location: formData.location.trim(),
      preferred_fast_code: formData.preferredFastCode.trim() || null,
      role_type: formData.roleType,
      status: "pending",
    };
    console.log("ASSOCIATE APPLICATION INSERT - Payload:", JSON.stringify(payload, null, 2));

    const { error: insertError } = await supabase.from("associate_applications").insert([payload]);

    if (insertError) {
      console.error("ASSOCIATE APPLICATION INSERT ERROR:", JSON.stringify(insertError, null, 2));
      setError(insertError.message);
      setIsSubmitting(false);
      return;
    }
    console.log("ASSOCIATE APPLICATION INSERT SUCCESS");

    setSuccess(true);
    setIsSubmitting(false);
  };

  if (success) {
    return (
      <div className="min-h-screen bg-white py-12">
        <div className="mx-auto max-w-md">
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            
            <h1 className="text-2xl font-bold mb-2">Application Submitted</h1>
            <p className="text-[#6e6e73] mb-6">
              Thank you for applying to become a Talishouse Associate. 
              We will review your application and get back to you within 2-3 business days.
            </p>
            
            <Link
              href="/business-office"
              className="inline-block px-8 py-4 bg-black text-white rounded-xl font-semibold hover:bg-gray-900 transition-all"
            >
              Back to Business Office
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white py-12">
      <div className="mx-auto max-w-lg">
        <div className="mb-8">
          <Link href="/business-office" className="text-sm text-[#1E4ED8] hover:underline">
            ← Back to Business Office
          </Link>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Apply for Associate Status</h1>
          <p className="text-[#6e6e73]">
            Join the Talishouse partner network
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium mb-2">
              Participation Level <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.roleType}
              onChange={(e) => setFormData({ ...formData, roleType: e.target.value })}
              className="w-full px-4 py-3 border border-[#e5e5e5] rounded-xl text-sm outline-none focus:border-[#1E4ED8]"
              required
            >
              <option value="">Select level...</option>
              <option value="referral">Referral Partner</option>
              <option value="resale">Resale Partner</option>
              <option value="fulfillment">Fulfillment Partner</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 border border-[#e5e5e5] rounded-xl text-sm outline-none focus:border-[#1E4ED8]"
              placeholder="John Doe"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-3 border border-[#e5e5e5] rounded-xl text-sm outline-none focus:border-[#1E4ED8]"
              placeholder="john@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Mobile Phone <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-4 py-3 border border-[#e5e5e5] rounded-xl text-sm outline-none focus:border-[#1E4ED8]"
              placeholder="+1 (555) 123-4567"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Location <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full px-4 py-3 border border-[#e5e5e5] rounded-xl text-sm outline-none focus:border-[#1E4ED8]"
              placeholder="City, Province/State"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Preferred FAST Code <span className="text-[#6e6e73]">(optional)</span>
            </label>
            <input
              type="text"
              value={formData.preferredFastCode}
              onChange={(e) => setFormData({ ...formData, preferredFastCode: e.target.value.toUpperCase() })}
              className="w-full px-4 py-3 border border-[#e5e5e5] rounded-xl text-sm outline-none focus:border-[#1E4ED8] font-mono"
              placeholder="e.g., JOHN"
              maxLength={6}
            />
            <p className="text-xs text-[#6e6e73] mt-1">
              If not available, we'll generate one for you
            </p>
          </div>

          {error && (
            <p className="text-red-500 text-sm">{error}</p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 bg-[#1E4ED8] text-white rounded-xl font-medium hover:bg-[#1d4ed8] transition-colors disabled:opacity-50"
          >
            {isSubmitting ? "Submitting..." : "Submit Application"}
          </button>
        </form>

        <div className="mt-12 p-6 bg-[#f5f5f7] rounded-xl">
          <h3 className="font-semibold text-sm mb-3">How the Associate System Works</h3>
          <p className="text-sm text-[#6e6e73] leading-relaxed mb-4">
            Associates are onboarded through the Business Office application process.
          </p>
          <p className="text-sm text-[#6e6e73] leading-relaxed mb-4">
            Each approved associate is assigned a FAST Code (Fast Access Standard Tracking Code), which acts as their unique identity within the Talishouse ecosystem.
          </p>
          <p className="text-sm text-[#6e6e73] leading-relaxed">
            This FAST Code powers a personalized, white-labeled associate page where prospects can engage directly. When a prospect submits a project or expresses interest, the lead is automatically tagged with the associate's FAST Code, ensuring accurate attribution and commission eligibility.
          </p>
        </div>
      </div>
    </div>
  );
}
