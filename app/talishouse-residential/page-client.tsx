"use client";

import { useState } from "react";
import ProductLayout from "@/components/ProductLayout";
import { useAssociate } from "@/context/AssociateContext";

const SIZES = [
  { value: "1600", label: "1,600 sq ft" },
  { value: "2400", label: "2,400 sq ft" },
  { value: "3200", label: "3,200 sq ft" },
];

export default function TalishouseResidentialPage() {
  const { fastCode } = useAssociate();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [selectedSize, setSelectedSize] = useState("1600");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const payload = {
      name: formData.get("name"),
      phone: formData.get("phone"),
      email: formData.get("email"),
      message: formData.get("message"),
      source: "talishouse-residential-inquiry",
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
        productName="Talishouse™ 1,600 - 2,400 - 3,200"
        productImage="/images/talishouse/residential/hero.png"
        productSize="talishouse-residential"
        aboutContent={`1,600 - 2,400 - 3200 sq.ft.. Permanent installation only (on screw piles, piers or slabs). Three bedrooms, two baths standard. Open concept kitchen - living - dining areas. Module arrangement: parallel, off-set parallel or L-shaped. Up in a week, finished in a month.  
Characterization: it includes an efficiency kitchen and four-piece bath, however, the number of bedrooms is size dependent.  
Open concept kitchen - living - dining areas.  
Furniture is added to taste after completion.`}
      >
        <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Talishouse™ 1,600 - 2,400 - 3,200
          </h2>

          <div className="bg-gray-100 border border-gray-200 rounded-lg p-4">
            <p className="text-sm font-medium text-gray-900">
              Contact Us to get your Best Deal
            </p>
            <p className="text-sm text-gray-600 mt-1">
              Custom configurations and volume pricing available. Our team will work with you to find the best solution for your project.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Size</label>
            <select
              value={selectedSize}
              onChange={(e) => setSelectedSize(e.target.value)}
              className="w-full p-3 rounded-lg border border-gray-200 text-sm"
            >
              {SIZES.map((size) => (
                <option key={size.value} value={size.value}>
                  {size.label}
                </option>
              ))}
            </select>
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