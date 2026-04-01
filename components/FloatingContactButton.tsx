"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { getFastCode } from "@/lib/fast-code";
import { useAssociate } from "@/context/AssociateContext";

const AUTO_MESSAGE = "Typically we respond within 24 hours";

interface FloatingContactButtonProps {
  fastCode?: string;
}

export default function FloatingContactButton({ fastCode: propFastCode }: FloatingContactButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [fastCode, setFastCodeState] = useState<string>(propFastCode || "");
  const { associate } = useAssociate();

  useEffect(() => {
    if (!propFastCode) {
      const code = getFastCode();
      if (code) {
        setFastCodeState(code);
      }
    }
  }, [propFastCode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const leadData = {
      name: formData.name.trim(),
      phone: formData.phone.trim(),
      email: formData.email.trim(),
      location: formData.message.trim() || "Not specified",
      source: associate ? "associate_contact" : "homepage_contact",
      status: "new",
      fast_code: fastCode || null,
      associate_id: associate?.id || null,
    };

    try {
      await supabase.from("leads").insert([leadData]);
    } catch (e) {
      console.error("Failed to insert lead:", e);
    }

    const logMessage = `Contact form submitted: ${formData.name}, ${formData.phone}, ${formData.email}, ${formData.message}`;
    
    try {
      await supabase.from("contact_logs").insert([{
        fast_code: fastCode || null,
        message: logMessage,
      }]);
    } catch (e) {
      console.error("Failed to insert contact log:", e);
    }

    setSubmitted(true);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 left-4 right-4 md:bottom-6 md:right-6 md:left-auto z-50 bg-[#1E4ED8] text-white px-6 py-4 md:py-3 rounded-xl md:rounded-full shadow-lg font-bold md:font-medium text-sm hover:bg-[#1d4ed8] transition-colors"
      >
        Contact Us
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/50"
            onClick={() => setIsOpen(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6">
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 text-2xl leading-none"
            >
              ×
            </button>
            
            {!submitted ? (
              <>
                <h3 className="text-xl font-semibold mb-2">
                  {associate ? `Contact ${associate.name}` : "Contact Us"}
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  {AUTO_MESSAGE}
                </p>
                
                <form onSubmit={handleSubmit} className="space-y-3">
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Your Name"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm"
                    required
                  />
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="Phone Number"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm"
                    required
                  />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="Email Address"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm"
                  />
                  <textarea
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="How can we help?"
                    rows={3}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm resize-none"
                  />
                  <button
                    type="submit"
                    className="w-full bg-[#1E4ED8] text-white rounded-xl py-3 font-medium text-sm hover:bg-[#1d4ed8]"
                  >
                    Submit
                  </button>
                </form>
              </>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold mb-2">Thank You!</h3>
                <p className="text-sm text-gray-600">
                  We&apos;ll be in touch shortly.
                </p>
                <button
                  onClick={() => setIsOpen(false)}
                  className="mt-4 text-sm text-[#1E4ED8]"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
