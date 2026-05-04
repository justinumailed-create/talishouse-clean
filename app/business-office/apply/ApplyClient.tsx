"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default function ApplyClient() {
  const [formData, setFormData] = useState({
    roleType: "",
    name: "",
    email: "",
    phone: "",
    location: "",
    preferredFastCode: "",
    leadCapture: {
      receiveUpdates: false,
      receiveOffers: false,
      shareWithPartners: false,
    },
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
      participation_level: formData.roleType,
      status: "pending",
      lead_capture: formData.leadCapture,
    };
    console.log("APPLICATION INSERT - Payload:", JSON.stringify(payload, null, 2));

    const { error: insertError } = await supabase.from("applications").insert([payload]);

    if (insertError) {
      console.error("APPLICATION INSERT ERROR:", JSON.stringify(insertError, null, 2));
      setError(insertError.message);
      setIsSubmitting(false);
      return;
    }
    console.log("APPLICATION INSERT SUCCESS");

    setSuccess(true);
    setIsSubmitting(false);
  };

  if (success) {
    return (
      <div className="min-h-screen bg-white py-12 flex items-center justify-center">
        <div className="w-full px-6">
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
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white py-12 flex items-center justify-center">
      <div className="w-full px-6">
        <div className="mx-auto max-w-lg">
          <div className="mb-8 text-center">
            <Link href="/business-office" className="text-sm text-[#1E4ED8] hover:underline">
              ← Back to Business Office
            </Link>
          </div>

          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold mb-2">Propose a Project</h1>
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
                <option value="referral">Referral Partner - upto 10% in Referral Fees and CSI Rewards</option>
                <option value="resale">Resale Partner - upto 20% in Procurement Margin</option>
                <option value="fulfillment">Fulfilment Partner - upto 25% Procurement Margin plus SPLITS profits*</option>
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

            <div className="border-t border-[#e5e5e5] pt-5 mt-5">
              <p className="text-sm font-medium mb-3">Communication Preferences</p>
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.leadCapture.receiveUpdates}
                    onChange={(e) => setFormData({
                      ...formData,
                      leadCapture: { ...formData.leadCapture, receiveUpdates: e.target.checked }
                    })}
                    className="w-4 h-4 rounded border-[#e5e5e5] text-black focus:ring-black cursor-pointer"
                  />
                  <span className="text-sm text-[#1d1d1f]">Receive project updates and newsletters</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.leadCapture.receiveOffers}
                    onChange={(e) => setFormData({
                      ...formData,
                      leadCapture: { ...formData.leadCapture, receiveOffers: e.target.checked }
                    })}
                    className="w-4 h-4 rounded border-[#e5e5e5] text-black focus:ring-black cursor-pointer"
                  />
                  <span className="text-sm text-[#1d1d1f]">Receive exclusive offers and promotions</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.leadCapture.shareWithPartners}
                    onChange={(e) => setFormData({
                      ...formData,
                      leadCapture: { ...formData.leadCapture, shareWithPartners: e.target.checked }
                    })}
                    className="w-4 h-4 rounded border-[#e5e5e5] text-black focus:ring-black cursor-pointer"
                  />
                  <span className="text-sm text-[#1d1d1f]">Allow sharing my information with trusted partners</span>
                </label>
              </div>
            </div>

            {error && (
              <p className="text-red-500 text-sm">{error}</p>
            )}

            <div className="flex flex-col gap-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-black text-white rounded-lg font-medium hover:opacity-90 transition disabled:opacity-50"
              >
                {isSubmitting ? "Submitting..." : "Submit"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
