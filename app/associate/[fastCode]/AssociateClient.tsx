"use client";

import { useState } from "react";
import { supabase, User } from "@/lib/supabase";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

interface AssociateUser extends User {
  page_headline?: string | null;
  page_subtext?: string | null;
  page_contact_cta?: string | null;
  page_footer_note?: string | null;
  page_custom_message?: string | null;
  video_url?: string | null;
}

interface PageContent {
  displayName: string;
  pageHeadline: string;
  pageSubtext: string;
  contactCTA: string;
  footerNote: string;
  customMessage: string | null;
  introMessage: string | null;
  videoUrl: string | null;
}

function getSafeContent(associate: AssociateUser | null): PageContent {
  if (!associate) {
    return {
      displayName: "Talishouse Partner",
      pageHeadline: "Partnered with Talishouse",
      pageSubtext: "Connect with us to start your premium renovation project.",
      contactCTA: "Get in Touch",
      footerNote: "",
      customMessage: null,
      introMessage: null,
      videoUrl: null,
    };
  }
  
  return {
    displayName: associate?.name || "Talishouse Partner",
    pageHeadline: associate?.page_headline || `Partnered with ${associate?.name || "Talishouse"}`,
    pageSubtext: associate?.page_subtext || "Connect with us to start your premium renovation project.",
    contactCTA: associate?.page_contact_cta || "Get in Touch",
    footerNote: associate?.page_footer_note || "",
    customMessage: associate?.page_custom_message || null,
    introMessage: associate?.intro_message || null,
    videoUrl: associate?.video_url || null,
  };
}

export default function AssociateClient({ 
  associate, 
  fastCode 
}: { 
  associate: AssociateUser | null; 
  fastCode: string;
}) {
  const pageContent = getSafeContent(associate);
  const [activeSection, setActiveSection] = useState<"join" | "catalogue">("join");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formSuccess, setFormSuccess] = useState(false);
  const [joinFormData, setJoinFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });
  const [joinSubmitting, setJoinSubmitting] = useState(false);
  const [joinSuccess, setJoinSuccess] = useState(false);

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitting(true);

    const leadData = {
      name: formData.name?.trim() || "",
      email: formData.email?.trim() || "",
      phone: formData.phone?.trim() || "",
      location: formData.message?.trim() || "Not specified",
      source: "associate_page_contact",
      status: "new",
      fast_code: fastCode,
      associate_id: associate?.id || null,
    };

    try {
      await supabase.from("leads").insert([leadData]);
    } catch (err) {
      console.error("Lead insert error:", err);
    }

    const dealData: Record<string, unknown> = {
      client_name: formData.name?.trim() || "",
      phone: formData.phone?.trim() || "",
      email: formData.email?.trim() || "",
      project_details: formData.message?.trim() || "Contact Form",
      project_type: "Contact",
      status: "new",
      fast_code: fastCode,
      source: "associate_page",
    };

    if (associate?.id) {
      dealData.user_id = associate.id;
    }

    try {
      await supabase.from("deals_v2").insert([dealData]);
    } catch (err) {
      console.error("Deal insert error:", err);
    }

    setFormSuccess(true);
    setFormSubmitting(false);
  };

  const handleJoinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setJoinSubmitting(true);

    console.log("Join Form Submission:", {
      name: joinFormData.name?.trim() || "",
      email: joinFormData.email?.trim() || "",
      phone: joinFormData.phone?.trim() || "",
      message: joinFormData.message?.trim() || "",
      fastCode: fastCode,
      associateName: associate?.name || "Unknown Partner",
      timestamp: new Date().toISOString(),
    });

    await new Promise((resolve) => setTimeout(resolve, 500));
    setJoinSuccess(true);
    setJoinSubmitting(false);
  };

  const videoUrl = pageContent.videoUrl;
  const displayName = pageContent.displayName;
  const pageHeadline = pageContent.pageHeadline;
  const pageSubtext = pageContent.pageSubtext;
  const contactCTA = pageContent.contactCTA;
  const footerNote = pageContent.footerNote;
  const customMessage = pageContent.customMessage;
  const introMessage = pageContent.introMessage;

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />

      <div className="bg-gradient-to-r from-[#1E4ED8] to-[#1d4ed8] text-white py-3">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="text-sm font-medium">
            Partnered with <span className="font-semibold">{displayName}</span>
          </p>
        </div>
      </div>

      {customMessage && (
        <section className="py-8 px-4 bg-[#f5f5f7]">
          <div className="max-w-2xl mx-auto">
            <p className="text-lg text-[#6e6e73] leading-relaxed text-center">
              {customMessage}
            </p>
          </div>
        </section>
      )}

      {introMessage && (
        <section className="py-12 px-4">
          <div className="max-w-2xl mx-auto">
            <p className="text-lg text-[#6e6e73] leading-relaxed text-center">
              {introMessage}
            </p>
          </div>
        </section>
      )}

      <section className="py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="w-full h-[300px] lg:h-[400px] rounded-xl overflow-hidden bg-gray-200">
              <iframe
                src="https://my.atlist.com/map/23edf5cc-e0b4-4d44-85fe-469f9606e876?share=true"
                allow="geolocation 'self' https://my.atlist.com"
                frameBorder="0"
                scrolling="no"
                allowFullScreen
                title="Talishouse property discovery map"
                className="w-full h-full"
              />
            </div>
            {videoUrl && (
              <div className="w-full h-[300px] lg:h-[400px] rounded-xl overflow-hidden bg-black">
                <video
                  src={videoUrl}
                  controls
                  playsInline
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-3xl md:text-4xl font-semibold mb-4">{pageHeadline}</h1>
          <p className="text-lg text-[#6e6e73] mb-8">{pageSubtext}</p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              onClick={() => setActiveSection("join")}
              className={`px-8 py-4 rounded-xl font-medium transition-colors min-w-[200px] ${
                activeSection === "join"
                  ? "bg-[#1E4ED8] text-white hover:bg-[#1d4ed8]"
                  : "border-2 border-[#e5e5e5] text-[#111] hover:border-[#1E4ED8] hover:text-[#1E4ED8]"
              }`}
            >
              {contactCTA}
            </button>
            <button
              onClick={() => setActiveSection("catalogue")}
              className={`px-8 py-4 rounded-xl font-medium transition-colors min-w-[200px] ${
                activeSection === "catalogue"
                  ? "bg-[#1E4ED8] text-white hover:bg-[#1d4ed8]"
                  : "border-2 border-[#e5e5e5] text-[#111] hover:border-[#1E4ED8] hover:text-[#1E4ED8]"
              }`}
            >
              View Catalogue
            </button>
          </div>
        </div>
      </section>

      {activeSection === "join" && (
        <section className="py-16 px-4 bg-[#f5f5f7]">
          <div className="max-w-xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-semibold mb-2">Work with this partner</h2>
              <p className="text-[#6e6e73]">Fill out the form below and {displayName} will be in touch.</p>
            </div>

            {formSuccess ? (
              <div className="bg-white rounded-xl border border-[#e5e5e5] p-8 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">Thank You!</h3>
                <p className="text-[#6e6e73] mb-6">
                  {displayName} will be in touch with you shortly.
                </p>
                <button
                  onClick={() => {
                    setFormSuccess(false);
                    setFormData({ name: "", email: "", phone: "", message: "" });
                  }}
                  className="px-6 py-3 border border-[#e5e5e5] rounded-lg font-medium hover:bg-[#f5f5f7]"
                >
                  Submit Another
                </button>
              </div>
            ) : (
              <form onSubmit={handleContactSubmit} className="bg-white rounded-xl border border-[#e5e5e5] p-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Name *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-2.5 border border-[#e5e5e5] rounded-lg text-sm outline-none focus:border-[#1E4ED8]"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Email *</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-2.5 border border-[#e5e5e5] rounded-lg text-sm outline-none focus:border-[#1E4ED8]"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Phone *</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-4 py-2.5 border border-[#e5e5e5] rounded-lg text-sm outline-none focus:border-[#1E4ED8]"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Message</label>
                    <textarea
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="w-full px-4 py-2.5 border border-[#e5e5e5] rounded-lg text-sm outline-none focus:border-[#1E4ED8] resize-none"
                      rows={4}
                      placeholder="Tell us about your project..."
                    />
                  </div>
                </div>

                <div className="mt-6">
                  <button
                    type="submit"
                    disabled={formSubmitting}
                    className="btn-primary w-full"
                  >
                    {formSubmitting ? "Submitting..." : "Submit"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </section>
      )}

      {activeSection === "catalogue" && (
        <section className="py-16 px-4">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl font-semibold mb-8 text-center">Our Products</h2>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { name: "Glasshouse", desc: "Modern glass enclosed spaces", href: "/glasshouse" },
                { name: "Talishouse 420", desc: "Premium residential units", href: "/talishouse" },
                { name: "Talishouse Residential", desc: "Full-size family homes", href: "/talishouse" },
                { name: "TalisTowns", desc: "Community living solutions", href: "/talistowns" },
              ].map((product) => (
                <Link
                  key={product.name}
                  href={`${product.href}?fast=${fastCode}`}
                  className="group bg-white rounded-xl border border-[#e5e5e5] p-6 hover:border-[#1E4ED8] hover:shadow-lg transition-all"
                >
                  <div className="w-full h-32 bg-[#f5f5f7] rounded-lg mb-4 flex items-center justify-center">
                    <span className="text-4xl opacity-30 group-hover:opacity-50 transition-opacity">🏠</span>
                  </div>
                  <h3 className="font-semibold mb-1">{product.name}</h3>
                  <p className="text-sm text-[#6e6e73]">{product.desc}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-semibold mb-4">Premium Renovation Services</h2>
          <p className="text-[#6e6e73] mb-8">
            Transform your space with our expert design and build services.
          </p>
          <div className="grid md:grid-cols-3 gap-6 text-left">
            <div className="p-6 bg-[#f5f5f7] rounded-xl">
              <h3 className="font-semibold mb-2">Design</h3>
              <p className="text-sm text-[#6e6e73]">
                Custom design solutions tailored to your vision.
              </p>
            </div>
            <div className="p-6 bg-[#f5f5f7] rounded-xl">
              <h3 className="font-semibold mb-2">Build</h3>
              <p className="text-sm text-[#6e6e73]">
                Quality craftsmanship from start to finish.
              </p>
            </div>
            <div className="p-6 bg-[#f5f5f7] rounded-xl">
              <h3 className="font-semibold mb-2">Transform</h3>
              <p className="text-sm text-[#6e6e73]">
                Complete renovation solutions for any space.
              </p>
            </div>
          </div>
        </div>
      </section>

      {footerNote && (
        <section className="py-8 px-4 border-t border-[#e5e5e5]">
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-sm text-[#6e6e73]">{footerNote}</p>
          </div>
        </section>
      )}

      <Footer />
    </div>
  );
}
