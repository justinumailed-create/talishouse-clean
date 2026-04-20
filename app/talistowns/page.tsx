"use client";

import { useState } from "react";
import ProductLayout from "@/components/ProductLayout";
import { productFamilies } from "@/lib/productFamilies";
import { useRouter } from "next/navigation";
import { useAssociate } from "@/context/AssociateContext";

export default function TalistownsPage() {
  const router = useRouter();
  const { fastCode } = useAssociate();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const talistownsFamily = productFamilies?.talistowns;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const payload = {
      name: formData.get("name"),
      phone: formData.get("phone"),
      email: formData.get("email"),
      message: formData.get("message"),
      source: "talistowns-inquiry",
      fast_code: fastCode || "DIRECT",
      created_at: new Date().toISOString(),
    };

    try {
      setSubmitted(true);
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <ProductLayout
        productName={talistownsFamily?.name || "Talistowns™"}
        productImage={talistownsFamily?.image || ""}
        productSize="talistowns"
        aboutContent={
          talistownsFamily?.gridDescription ||
          `Talistowns™ consist of Talishouse™ 400 modules, two units under one roof. Permanent or mobile installation. Gable roofs are an extra charge option.
- A 12 months short-term rental season at $200 per night and 70% occupancy generates $51,100 in revenue per unit per year.
- A 12 months long-term rental season at $2,000 per month and 100% occupancy generates $24,000 in revenue per unit per year.
Conclusion: Talistowns™ are a great way to "moonlight" towards lifestyle goals and financial independence…!`
        }
      >
        <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm space-y-6">
          <h1 className="text-2xl font-semibold text-gray-900">
            {talistownsFamily?.name || "Talistowns™"} Bundle
          </h1>

          <div className="p-4 rounded-lg border border-blue-100 bg-blue-50">
            <p className="text-sm text-blue-800 font-medium">
              Contact Us to get your Best Deal
            </p>
            <p className="text-xs text-blue-600 mt-1">
              Custom configurations and volume pricing available. Our team will work with you to find the best solution for your project.
            </p>
          </div>

          {submitted ? (
            <div className="text-center py-8">
              <p className="text-lg font-semibold text-green-600">Thank you for your inquiry!</p>
              <p className="text-sm text-gray-500 mt-2">Our team will contact you shortly with your custom quote.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  required
                  type="text"
                  name="name"
                  placeholder="Your name"
                  className="w-full p-3 rounded-lg border border-gray-200 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  required
                  type="email"
                  name="email"
                  placeholder="your@email.com"
                  className="w-full p-3 rounded-lg border border-gray-200 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  required
                  type="tel"
                  name="phone"
                  placeholder="(555) 000-0000"
                  className="w-full p-3 rounded-lg border border-gray-200 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tell us about your project</label>
                <textarea
                  name="message"
                  rows={4}
                  placeholder="Number of units, intended use, location..."
                  className="w-full p-3 rounded-lg border border-gray-200 text-sm"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full text-lg font-semibold"
              >
                {loading ? "Sending..." : "Contact Us"}
              </button>
            </form>
          )}
        </div>
      </ProductLayout>
    </>
  );
}