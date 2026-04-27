"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type FieldErrors = Partial<Record<string, string>>;

export default function ProposeProjectPage() {
  const router = useRouter();
  const [participationLevel, setParticipationLevel] = useState("");

  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitted, setSubmitted] = useState(false);

  const showError = (field: string) => submitted && fieldErrors[field];

  const validate = (formData: FormData): FieldErrors => {
    const errors: FieldErrors = {};

    if (!formData.get("firstName")?.toString().trim()) errors.firstName = "First name is required.";
    if (!formData.get("lastName")?.toString().trim()) errors.lastName = "Last name is required.";
    if (!formData.get("email")?.toString().trim()) errors.email = "Email is required.";
    if (!formData.get("phone")?.toString().trim()) errors.phone = "Phone number is required.";
    if (!participationLevel) errors.participationLevel = "Please select participation level.";
    if (!formData.get("location")?.toString().trim()) errors.location = "Location is required.";

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
      location: formData.get("location")?.toString().trim() || "",
      participation_level: participationLevel,
      status: "pending",
      created_at: new Date().toISOString(),
    };

    try {
      const { error: insertError } = await supabase.from("applications").insert([payload]);
      
      if (insertError) {
        console.error("Application insert error:", insertError);
        setFieldErrors({ submit: "Failed to submit. Please try again." });
        setLoading(false);
        return;
      }
      
      router.push("/project-received");
    } catch (err) {
      console.error("Application insert error:", err);
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
          <h1 className="text-2xl font-semibold text-gray-900">Propose a Project</h1>
          <p className="text-sm text-gray-500 mt-2">Apply to join the Talishouse partner network</p>
        </div>

        {/* Form - Left Side */}
        <div className="col-span-7">
          <form onSubmit={handleSubmit} noValidate className="space-y-8">
            
            {/* Participation Level */}
            <div className="space-y-4">
              <h2 className="text-xs font-medium text-gray-500 uppercase tracking-wide">Participation Level</h2>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => setParticipationLevel("referral")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    participationLevel === "referral"
                      ? "bg-black text-white"
                      : "border border-gray-200 bg-white text-gray-700 hover:border-gray-400"
                  }`}
                >
                  Referral Partner
                </button>
                <button
                  type="button"
                  onClick={() => setParticipationLevel("resale")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    participationLevel === "resale"
                      ? "bg-black text-white"
                      : "border border-gray-200 bg-white text-gray-700 hover:border-gray-400"
                  }`}
                >
                  Resale Partner
                </button>
                <button
                  type="button"
                  onClick={() => setParticipationLevel("fulfillment")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    participationLevel === "fulfillment"
                      ? "bg-black text-white"
                      : "border border-gray-200 bg-white text-gray-700 hover:border-gray-400"
                  }`}
                >
                  Fulfilment Partner
                </button>
              </div>
              {showError("participationLevel") && <p className="text-sm text-red-600">{fieldErrors.participationLevel}</p>}
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

            {/* Location */}
            <div className="space-y-4">
              <h2 className="text-xs font-medium text-gray-500 uppercase tracking-wide">Location</h2>
              <div>
                <input
                  type="text"
                  name="location"
                  placeholder="City, Province/State"
                  className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-black transition"
                />
                {showError("location") && <p className="text-sm text-red-600 mt-1">{fieldErrors.location}</p>}
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-black text-white py-4 rounded-xl text-sm font-medium hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Submitting..." : "Submit Application"}
            </button>

            {showError("submit") && (
              <p className="text-sm text-red-600 text-center">{fieldErrors.submit}</p>
            )}

          </form>
        </div>

        {/* Right Sidebar - Info */}
        <div className="col-span-5">
          <div className="sticky top-24 space-y-6">
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <h3 className="text-sm font-medium text-gray-900 mb-2">Need Help?</h3>
              <p className="text-xs text-gray-500">Contact our team for assistance with your application.</p>
            </div>
          </div>
        </div>

        </div>
      </div>
    </div>
  );
}