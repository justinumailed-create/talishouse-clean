"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { safeInsertLead } from "@/lib/supabase";
import { useAssociate } from "@/context/AssociateContext";

const termsOptions = [
  { value: "personal", label: "Personal Use" },
  { value: "commercial", label: "Own use or Resale" },
  { value: "installment", label: "SPLITS transaction" },
];

const sizes = ["160", "200", "400", "800", "1600", "2400", "3200"];

const permanentOptions = [
  { value: "screw-piles", label: "Screw piles" },
  { value: "piers", label: "Piers" },
  { value: "slab", label: "Slab" },
];

const mobileOptions = [
  { value: "20-ft-dual-axle", label: "20 ft dual axle" },
  { value: "40-ft-triple-axle", label: "40 ft triple axle" },
];

type FieldErrors = Partial<Record<string, string>>;

export default function ReferProjectPage() {
  const router = useRouter();
  const { fastCode } = useAssociate();

  const [selectedTerms, setSelectedTerms] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedFoundation, setSelectedFoundation] = useState("");
  const [acceptanceChecked, setAcceptanceChecked] = useState(false);
  const [promoChecked, setPromoChecked] = useState(false);
  const [termsChecked, setTermsChecked] = useState(false);

  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitted, setSubmitted] = useState(false);

  const showError = (field: string) => submitted && fieldErrors[field];

  const validate = (formData: FormData): FieldErrors => {
    const errors: FieldErrors = {};

    if (!selectedTerms) errors.terms = "Please select your usage preference.";
    if (!formData.get("firstName")?.toString().trim()) errors.firstName = "First name is required.";
    if (!formData.get("lastName")?.toString().trim()) errors.lastName = "Last name is required.";
    if (!formData.get("email")?.toString().trim()) errors.email = "Email is required.";
    if (!formData.get("phone")?.toString().trim()) errors.phone = "Phone number is required.";
    
    if (!formData.get("address")?.toString().trim()) errors.address = "Location is required.";
    if (!selectedSize) errors.size = "Please select a project size.";
    if (!selectedFoundation) errors.foundation = "Please select a foundation type.";
    if (!termsChecked) errors.terms_consent = "Please agree to the Terms of Service.";
    if (!acceptanceChecked) errors.acceptance = "Please acknowledge the delivery disclaimer.";
    if (!promoChecked) errors.promo_consent = "Please indicate your preference for promotional messages.";

    return errors;
  };

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitted(true);

    const formData = new FormData(e.currentTarget);
    const errors = validate(formData);
    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) return;

    setLoading(true);

    const payload = {
      name: `${formData.get("firstName")} ${formData.get("lastName")}`,
      email: formData.get("email")?.toString().trim() || "",
      phone: formData.get("phone")?.toString().trim() || "",
      location: formData.get("address")?.toString().trim() || "",
      source: "propose",
      status: "new",
      deal_status: "pending",
      fast_code: fastCode || "DIRECT",
      created_at: new Date().toISOString(),
      project_value: selectedSize ? parseInt(selectedSize, 10) : null,
      preferred_terms: selectedTerms,
      installation_type: selectedFoundation,
    };

    try {
      await safeInsertLead(payload);
      router.push("/project-received");
    } catch (err) {
      console.error("Submit error:", err);
      setFieldErrors({ submit: "Failed to submit. Please try again." });
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f5f5f5] py-12">
      <div className="w-full px-6 lg:px-12">
        <div className="grid grid-cols-12 gap-8">
        
        {/* Header */}
        <div className="col-span-12 text-center mb-12">
          <h1 className="text-2xl font-semibold text-gray-900">Refer a Project</h1>
          <p className="text-sm text-gray-500 mt-2">Detailed project specifications for business inquiries</p>
        </div>

        {/* Form - Left Side */}
        <div className="col-span-7">
          <form onSubmit={handleSubmit} noValidate className="space-y-8">
            
            {/* Usage */}
            <div className="space-y-4">
              <h2 className="text-xs font-medium text-gray-500 uppercase tracking-wide">Usage</h2>
              <div className="flex flex-wrap gap-3">
                {termsOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setSelectedTerms(option.value)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    selectedTerms === option.value
                      ? "bg-black text-white"
                      : "border border-gray-200 bg-white text-gray-700 hover:border-gray-400"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
            {showError("terms") && <p className="text-sm text-red-600">{fieldErrors.terms}</p>}
          </div>

          {/* Personal Information */}
          <div className="space-y-4">
            <h2 className="text-xs font-medium text-gray-500 uppercase tracking-wide">Personal Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <input
                  type="text"
                  name="firstName"
                  placeholder="First Name"
                  className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-black transition"
                />
                {showError("firstName") && <p className="text-sm text-red-600 mt-1">{fieldErrors.firstName}</p>}
              </div>
              <div>
                <input
                  type="text"
                  name="lastName"
                  placeholder="Last Name"
                  className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-black transition"
                />
                {showError("lastName") && <p className="text-sm text-red-600 mt-1">{fieldErrors.lastName}</p>}
              </div>
              <div>
                <input
                  type="email"
                  name="email"
                  placeholder="Email"
                  className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-black transition"
                />
                {showError("email") && <p className="text-sm text-red-600 mt-1">{fieldErrors.email}</p>}
              </div>
              <div>
                <input
                  type="tel"
                  name="phone"
                  placeholder="Enter 10-digit mobile number"
                  className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-black transition"
                />
                {showError("phone") && <p className="text-sm text-red-600 mt-1">{fieldErrors.phone}</p>}
              </div>
            </div>
          </div>

          {/* FAST Code Helper */}
          {fastCode && (
            <div className="text-xs text-gray-400">
              FAST Code: <span className="font-mono font-medium">{fastCode}</span>
            </div>
          )}

          {/* Location */}
          <div className="space-y-4">
            <h2 className="text-xs font-medium text-gray-500 uppercase tracking-wide">Location</h2>
            <div>
              <input
                type="text"
                name="address"
                placeholder="Street Address"
                className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-black transition"
              />
              <p className="text-[11px] text-gray-400 mt-1">Google recognised street address</p>
              {showError("address") && <p className="text-sm text-red-600 mt-1">{fieldErrors.address}</p>}
            </div>
          </div>

          {/* Project Configuration */}
          <div className="space-y-4">
            <h2 className="text-xs font-medium text-gray-500 uppercase tracking-wide">Project Configuration</h2>
            <div className="flex flex-wrap gap-3">
              {sizes.map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => setSelectedSize(size)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    selectedSize === size
                      ? "bg-black text-white"
                      : "border border-gray-200 bg-white text-gray-700 hover:border-gray-400"
                  }`}
                >
                  {size} sq.ft.
                </button>
              ))}
            </div>
            {showError("size") && <p className="text-sm text-red-600">{fieldErrors.size}</p>}
          </div>

          {/* Foundation Type */}
          <div className="space-y-4">
            <h2 className="text-xs font-medium text-gray-500 uppercase tracking-wide">Foundation Type</h2>
            
            <div className="space-y-3">
              <h3 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Section 1: Permanent</h3>
              <div className="flex flex-wrap gap-3">
                {permanentOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setSelectedFoundation(option.value)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                      selectedFoundation === option.value
                        ? "bg-black text-white"
                        : "border border-gray-200 bg-white text-gray-700 hover:border-gray-400"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Section 2: Mobile</h3>
              <div className="flex flex-wrap gap-3">
                {mobileOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setSelectedFoundation(option.value)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                      selectedFoundation === option.value
                        ? "bg-black text-white"
                        : "border border-gray-200 bg-white text-gray-700 hover:border-gray-400"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
            {showError("foundation") && <p className="text-sm text-red-600">{fieldErrors.foundation}</p>}
          </div>

          {/* reCAPTCHA Placeholder */}
          <div className="h-12 border border-gray-200 rounded-lg bg-white flex items-center justify-center">
            <span className="text-xs text-gray-400">reCAPTCHA placeholder</span>
          </div>

          {/* Acceptance */}
          <div className="space-y-3">
            {/* Checkbox 3: Terms of Service */}
            <label className="flex items-start gap-3 text-sm text-gray-600">
              <input
                type="checkbox"
                checked={termsChecked}
                onChange={(e) => setTermsChecked(e.target.checked)}
                className="mt-1 accent-black"
              />
              <span>I also agree to the Terms of Service and Privacy Policy.</span>
            </label>
            {showError("terms_consent") && <p className="text-sm text-red-600">{fieldErrors.terms_consent}</p>}

            {/* Checkbox 1: Delivery acknowledgement */}
            <label className="flex items-start gap-3 text-sm text-gray-600">
              <input
                type="checkbox"
                checked={acceptanceChecked}
                onChange={(e) => setAcceptanceChecked(e.target.checked)}
                className="mt-1 accent-black"
              />
              <span>I acknowledge that not every location will be suitable for delivery right to a building site and that final approval is subject to a site inspection by any means that appear appropriate to us.</span>
            </label>
            {showError("acceptance") && <p className="text-sm text-red-600">{fieldErrors.acceptance}</p>}

            {/* Checkbox 2: Promotional messages */}
            <label className="flex items-start gap-3 text-sm text-gray-600">
              <input
                type="checkbox"
                checked={promoChecked}
                onChange={(e) => setPromoChecked(e.target.checked)}
                className="mt-1 accent-black"
              />
              <span>I agree to receive promotional messages including technical bulletins, new product introductions & project celebrations.</span>
            </label>
            {showError("promo_consent") && <p className="text-sm text-red-600">{fieldErrors.promo_consent}</p>}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white py-4 rounded-xl text-sm font-medium hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Submitting..." : "Submit Request"}
          </button>

          {showError("submit") && (
            <p className="text-sm text-red-600 text-center">{fieldErrors.submit}</p>
          )}

          </form>
        </div>

        {/* Right Sidebar - Info / Empty */}
        <div className="col-span-5">
          <div className="sticky top-24 space-y-6">
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <h3 className="text-sm font-medium text-gray-900 mb-2">Need Help?</h3>
              <p className="text-xs text-gray-500">Contact our team for assistance with your project proposal.</p>
            </div>
          </div>
        </div>

        </div>
      </div>
    </div>
  );
}