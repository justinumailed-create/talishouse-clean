"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAssociate } from "@/context/AssociateContext";

const sizes = ["160", "200", "400", "800", "1600", "2400"];
const finishes = ["Delivery only", "Roof tight", "Turn key"];
const usages = ["Personal use", "Resale", "Commercial use"];
const permanentInstallations = ["Screw piles", "Piers", "Slab"];
const mobileInstallations = ["20 ft – dual axle", "40 ft – triple axle"];
const termsOptions = [
  "purchase for personal use",
  "purchase for commercial use or resale",
  "pay half now, half over up to five years"
];

export default function ProposeProjectPage() {
  const router = useRouter();
  const { fastCode, associateId } = useAssociate();
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedInstallation, setSelectedInstallation] = useState("");
  const [selectedPermanentInstall, setSelectedPermanentInstall] = useState("");
  const [selectedMobileInstall, setSelectedMobileInstall] = useState("");
  const [selectedFinish, setSelectedFinish] = useState("");
  const [selectedUsage, setSelectedUsage] = useState("");
  const [selectedTerms, setSelectedTerms] = useState("");
  const [acceptanceChecked, setAcceptanceChecked] = useState(false);
  const [termsChecked, setTermsChecked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleProjectSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    if (!acceptanceChecked) {
      setError("Please accept the project disclaimer");
      setLoading(false);
      return;
    }

    if (!termsChecked) {
      setError("Please accept terms & communication consent");
      setLoading(false);
      return;
    }

    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const firstName = formData.get("firstName") as string;
    const lastName = formData.get("lastName") as string;
    const phone = formData.get("phone") as string;
    const email = formData.get("email") as string;
    const address = formData.get("address") as string;
    const geoLocation = formData.get("geoLocation") as string;
    const date = formData.get("date") as string;

    if (!firstName || !lastName || !phone || !email) {
      setError("Please fill in all required fields");
      setLoading(false);
      return;
    }

    const installationType = selectedInstallation || selectedPermanentInstall || selectedMobileInstall || "";
    const data = {
      name: `${firstName} ${lastName}`,
      phone,
      email,
      location: address || geoLocation || "",
      fast_code: fastCode || "DIRECT",
      source: "propose",
      status: "new",
      associate_id: associateId,
      project_size: selectedSize,
      installation_type: installationType,
      finish_level: selectedFinish,
      usage_type: selectedUsage,
      terms_type: selectedTerms,
      proposed_date: date,
    };

    console.log("Submitting lead:", JSON.stringify(data, null, 2));

    const { data: insertData, error: insertError } = await supabase
      .from("leads")
      .insert([data])
      .select()
      .single();

    if (insertError) {
      console.error("INSERT ERROR:", insertError?.message || insertError);
      const errorMessage = 
        insertError?.message ||
        insertError?.details ||
        insertError?.hint ||
        "Unknown insert error";
      setError(`Creation failed: ${errorMessage}`);
      setLoading(false);
      return;
    }

    console.log("Lead created:", JSON.stringify(insertData, null, 2));
    router.push("/project-received");
  }

  return (
    <div className="min-h-[70vh] bg-[#f5f5f7] py-12 px-4">
        <div className="max-w-[640px] mx-auto space-y-6">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
            Propose a Project
          </h1>
          <p className="text-gray-500 text-sm mt-2">
            Detailed project specifications for business inquiries
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-[rgba(0,0,0,0.06)] overflow-hidden w-full max-w-full">
          <div className="bg-black px-6 py-4">
            <p className="text-sm font-semibold text-white tracking-wide">
              First come, first serve
            </p>
          </div>

          <form onSubmit={handleProjectSubmit} className="p-6 sm:p-8 space-y-6">
            {/* ROW 1: Date + Terms */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-[#86868b] uppercase tracking-wider">
                  Date <span className="text-gray-400">*</span>
                </label>
                <input
                  type="text"
                  name="date"
                  required
                  placeholder="DD / MM / YYYY"
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-[#0070ba] focus:ring-2 focus:ring-[#0070ba]/10"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-[#86868b] uppercase tracking-wider">
                  Preferred Terms <span className="text-gray-400">*</span>
                </label>
                <div className="space-y-2">
                  {termsOptions.map((option, idx) => (
                    <label
                      key={idx}
                      className={`flex items-start gap-3 p-2 rounded-lg cursor-pointer transition option-card ${
                        selectedTerms === option
                          ? "bg-[#0070ba]/10 border border-[#0070ba]"
                          : "border border-transparent hover:bg-gray-50"
                      }`}
                    >
                      <input
                        type="radio"
                        name="terms"
                        value={option}
                        checked={selectedTerms === option}
                        onChange={(e) => setSelectedTerms(e.target.value)}
                        className="mt-1 accent-[#0070ba] flex-shrink-0"
                      />
                      <span className="text-xs text-gray-700 leading-tight option-text flex-1 max-w-full break-words">{option}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* ROW 2: First Name + Last Name */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-[#86868b] uppercase tracking-wider">
                  First Name <span className="text-gray-400">*</span>
                </label>
                <input
                  required
                  type="text"
                  name="firstName"
                  placeholder="First Name"
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-[#0070ba] focus:ring-2 focus:ring-[#0070ba]/10"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-[#86868b] uppercase tracking-wider">
                  Last Name <span className="text-gray-400">*</span>
                </label>
                <input
                  required
                  type="text"
                  name="lastName"
                  placeholder="Last Name"
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-[#0070ba] focus:ring-2 focus:ring-[#0070ba]/10"
                />
              </div>
            </div>

            {/* ROW 3: Phone + Email */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-[#86868b] uppercase tracking-wider">
                  Mobile Phone <span className="text-gray-400">*</span>
                </label>
                <div className="flex rounded-xl border border-gray-200 overflow-hidden focus-within:border-[#0070ba] focus-within:ring-2 focus-within:ring-[#0070ba]/10">
                  <span className="flex items-center px-3 bg-gray-50 text-sm text-gray-500 border-r">+1</span>
                  <input
                    required
                    type="tel"
                    name="phone"
                    placeholder="(555) 000-0000"
                    className="flex-1 px-3 py-3 text-sm text-gray-900 outline-none"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-[#86868b] uppercase tracking-wider">
                  Email <span className="text-gray-400">*</span>
                </label>
                <input
                  required
                  type="email"
                  name="email"
                  placeholder="email@example.com"
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-[#0070ba] focus:ring-2 focus:ring-[#0070ba]/10"
                />
              </div>
            </div>

            {/* ROW 4: Address */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-[#86868b] uppercase tracking-wider">
                Address <span className="text-gray-400">*</span>
              </label>
              <p className="text-[11px] text-gray-400">A Google recognized street address if available.</p>
              <input
                type="text"
                name="address"
                required
                placeholder="Street Address"
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-[#0070ba] focus:ring-2 focus:ring-[#0070ba]/10"
              />
            </div>

            {/* ROW 5: Geo Location */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-[#86868b] uppercase tracking-wider">Latitude / Longitude</label>
              <p className="text-[11px] text-gray-400">Required if address is not a Google recognized street address.</p>
              <input
                type="text"
                name="geoLocation"
                placeholder="Latitude / Longitude"
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-[#0070ba] focus:ring-2 focus:ring-[#0070ba]/10"
              />
            </div>

            {/* ROW 6: Size */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-[#86868b] uppercase tracking-wider">
                Size <span className="text-gray-400">*</span>
              </label>
              <select
                value={selectedSize}
                onChange={(e) => setSelectedSize(e.target.value)}
                required
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-[#0070ba] focus:ring-2 focus:ring-[#0070ba]/10 bg-white"
              >
                <option value="">Select Size</option>
                {sizes.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </div>

            {/* ROW 7: Installation */}
            <div className="space-y-3">
              <label className="text-xs font-medium text-[#86868b] uppercase tracking-wider">
                Installation <span className="text-gray-400">*</span>
              </label>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-[11px] text-gray-400 uppercase tracking-wider">Permanent</p>
                  <div className="grid grid-cols-1 gap-2">
                    {permanentInstallations.map((inst) => (
                      <button
                        key={inst}
                        type="button"
                        onClick={() => {
                          setSelectedInstallation("Permanent");
                          setSelectedPermanentInstall(inst);
                          setSelectedMobileInstall("");
                        }}
                        className={`py-3 rounded-xl text-xs font-medium transition duration-200 hover:scale-[1.02] ${
                          selectedInstallation === "Permanent" && selectedPermanentInstall === inst
                            ? "bg-[linear-gradient(135deg,#0070ba,#1546a0)] text-white"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        {inst}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-[11px] text-gray-400 uppercase tracking-wider">Mobile</p>
                  <div className="grid grid-cols-1 gap-2">
                    {mobileInstallations.map((inst) => (
                      <button
                        key={inst}
                        type="button"
                        onClick={() => {
                          setSelectedInstallation("Mobile");
                          setSelectedMobileInstall(inst);
                          setSelectedPermanentInstall("");
                        }}
                        className={`py-3 rounded-xl text-xs font-medium transition duration-200 hover:scale-[1.02] ${
                          selectedInstallation === "Mobile" && selectedMobileInstall === inst
                            ? "bg-[linear-gradient(135deg,#0070ba,#1546a0)] text-white"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        {inst}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* ROW 8: Finish */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-[#86868b] uppercase tracking-wider">
                Finish <span className="text-gray-400">*</span>
              </label>
              <div className="grid grid-cols-3 gap-3">
                {finishes.map((finish) => (
                  <button
                    key={finish}
                    type="button"
                    onClick={() => setSelectedFinish(finish)}
                    className={`py-3 rounded-xl text-xs font-medium transition duration-200 hover:scale-[1.02] ${
                      selectedFinish === finish
                        ? "bg-[linear-gradient(135deg,#0070ba,#1546a0)] text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {finish}
                  </button>
                ))}
              </div>
            </div>

            {/* ROW 9: Usage */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-[#86868b] uppercase tracking-wider">
                Usage <span className="text-gray-400">*</span>
              </label>
              <div className="grid grid-cols-3 gap-3">
                {usages.map((usage) => (
                  <button
                    key={usage}
                    type="button"
                    onClick={() => setSelectedUsage(usage)}
                    className={`py-3 rounded-xl text-xs font-medium transition duration-200 hover:scale-[1.02] ${
                      selectedUsage === usage
                        ? "bg-[linear-gradient(135deg,#0070ba,#1546a0)] text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {usage}
                  </button>
                ))}
              </div>
            </div>

            {/* Legal Disclaimer + Checkboxes */}
            <div className="space-y-3 mt-4">
              {/* Acceptance Checkbox */}
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="acceptance"
                  checked={acceptanceChecked}
                  onChange={(e) => setAcceptanceChecked(e.target.checked)}
                  className="mt-1 w-[18px] h-[18px] accent-[#0071e3] flex-shrink-0 cursor-pointer"
                />

                <label
                  htmlFor="acceptance"
                  className="text-sm text-gray-500 leading-relaxed cursor-pointer"
                >
                  I acknowledge and accept that not every location will be suitable for 
                  delivery and that final approval is subject to site inspection.
                  <span className="text-red-500 ml-0.5">*</span>
                </label>
              </div>

              {/* Terms Checkbox */}
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="terms"
                  checked={termsChecked}
                  onChange={(e) => setTermsChecked(e.target.checked)}
                  className="mt-1 w-[18px] h-[18px] accent-[#0071e3] flex-shrink-0 cursor-pointer"
                />

                <label
                  htmlFor="terms"
                  className="text-sm text-gray-500 leading-relaxed cursor-pointer"
                >
                  I agree to receive promotional messages sent via an autodialer, and this agreement isn&apos;t a condition of any purchase. I also agree to the{" "}
                  <a href="/terms" className="underline text-[#0070ba]">Terms of Service</a>{" "}
                  and{" "}
                  <a href="/privacy" className="underline text-[#0070ba]">Privacy Policy</a>. 
                  4 Msgs/Month. Msg & Data Rates may apply. Text STOP to opt out anytime. 
                  Text Help for more information.
                </label>
              </div>
            </div>

            {/* Error */}
            {error && (
              <p className="text-sm text-red-600 text-center">{error}</p>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!acceptanceChecked || !termsChecked || loading}
              className="w-full py-3 rounded-xl bg-[linear-gradient(135deg,#0070ba,#1546a0)] text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Submitting..." : "Submit"}
            </button>
          </form>
        </div>

        <div className="text-center">
          <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
