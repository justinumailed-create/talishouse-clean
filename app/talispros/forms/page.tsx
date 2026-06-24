"use client";

import Link from "next/link";
import { Check, Upload, FileText, CreditCard, Database, Layers, ArrowRight, GitBranch, Globe, Users, Workflow } from "lucide-react";

const FEATURES = [
  {
    icon: <Layers className="w-5 h-5" />,
    title: "White Label Forms",
    description: "Fully white-label the forms engine under your own brand. Custom domains, logos, and color schemes included.",
  },
  {
    icon: <Database className="w-5 h-5" />,
    title: "CRM Integrations",
    description: "Seamless integration with popular CRM platforms. Automatically capture and route form submissions to your pipeline.",
  },
  {
    icon: <Workflow className="w-5 h-5" />,
    title: "Multi-Step Workflows",
    description: "Build guided multi-step form experiences that keep users engaged from start to submission.",
  },
  {
    icon: <GitBranch className="w-5 h-5" />,
    title: "Conditional Logic",
    description: "Create smart forms that adapt to user responses. Show or hide fields based on previous answers for a streamlined experience.",
  },
  {
    icon: <Upload className="w-5 h-5" />,
    title: "File Uploads",
    description: "Accept documents, images, and media files directly through your forms. Secure cloud storage included.",
  },
  {
    icon: <Users className="w-5 h-5" />,
    title: "Lead Capture",
    description: "Built-in lead capture with automated follow-up sequences. Never lose a prospect again.",
  },
  {
    icon: <Globe className="w-5 h-5" />,
    title: "Marketplace Forms",
    description: "Deploy forms across multiple marketplaces and property listings with a single integration.",
  },
  {
    icon: <CreditCard className="w-5 h-5" />,
    title: "Payment Collection",
    description: "Collect payments directly within your forms using PayPal integration. One-time and subscription billing supported.",
  },
];

export default function TalisFormsPage() {
  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="py-20 sm:py-28">
        <div className="max-w-4xl mx-auto px-5 text-center">
          <p className="text-xs font-medium text-neutral-400 uppercase tracking-widest mb-4">
            A Talispros™ Platform Product
          </p>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-neutral-900 mb-3">
            TalisForms™
          </h1>
          <p className="text-lg sm:text-xl text-neutral-500 max-w-2xl mx-auto leading-relaxed mb-4">
            Enterprise Form Infrastructure
          </p>
          <p className="text-sm text-neutral-400 max-w-2xl mx-auto leading-relaxed mb-8">
            TalisForms™ powers the entire Talispros™ ecosystem including MapSites™, FAST Codes™, registrations, partner onboarding, CRM intake workflows, lead generation, and white-label form deployments.
          </p>
          <a
            href="#demo"
            className="inline-flex h-12 px-8 bg-neutral-900 text-white rounded-xl text-sm font-medium tracking-wide items-center justify-center gap-2 hover:bg-neutral-800 active:scale-[0.98] transition-all"
          >
            Request Demo
          </a>
        </div>
      </section>

      <hr className="border-t border-neutral-200 max-w-4xl mx-auto" />

      {/* Features Grid */}
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-5">
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-neutral-900 text-center mb-12">
            Everything you need to collect and manage submissions
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map((feature) => (
              <div key={feature.title} className="bg-neutral-50 rounded-2xl p-6 border border-neutral-200">
                <div className="w-10 h-10 rounded-xl bg-neutral-900 text-white flex items-center justify-center mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-base font-semibold text-neutral-900 mb-2">{feature.title}</h3>
                <p className="text-sm text-neutral-500 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <hr className="border-t border-neutral-200 max-w-4xl mx-auto" />

      {/* White Label Forms */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-5">
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-neutral-900 text-center mb-4">
            White Label Forms
          </h2>
          <p className="text-sm text-neutral-500 text-center max-w-2xl mx-auto leading-relaxed mb-8">
            Deploy fully white-labeled forms under your own brand across the Talispros™ platform. Every form — from MapSite™ registrations to partner onboarding — can be customized with your logo, colors, and domain.
          </p>
          <div className="bg-neutral-50 rounded-2xl p-8 border border-neutral-200">
            <ul className="space-y-3">
              {[
                "Custom domains and branding for every form deployment",
                "Consistent user experience across all touchpoints",
                "Multi-tenant support for agency and enterprise accounts",
              ].map((text, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-neutral-600 leading-relaxed">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-neutral-900 text-white text-xs flex items-center justify-center mt-0.5">{i + 1}</span>
                  {text}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <hr className="border-t border-neutral-200 max-w-4xl mx-auto" />

      {/* CRM Integrations */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-5">
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-neutral-900 text-center mb-4">
            CRM Integrations
          </h2>
          <p className="text-sm text-neutral-500 text-center max-w-2xl mx-auto leading-relaxed mb-8">
            Every form submission is automatically captured and routed to your CRM pipeline. TalisForms™ integrates with the platforms you already use so you never miss a lead.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {[
              "Automatic lead capture from every form submission",
              "Real-time data sync with your CRM workflows",
              "Custom field mapping for seamless integration",
            ].map((text, i) => (
              <div key={i} className="bg-neutral-50 rounded-2xl p-6 border border-neutral-200">
                <span className="block text-sm text-neutral-600 leading-relaxed">{text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <hr className="border-t border-neutral-200 max-w-4xl mx-auto" />

      {/* Multi-Step Workflows */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-5">
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-neutral-900 text-center mb-4">
            Multi-Step Workflows
          </h2>
          <p className="text-sm text-neutral-500 text-center max-w-2xl mx-auto leading-relaxed mb-8">
            Guide users through complex form submissions with multi-step workflows that feel natural and frictionless. Each step builds on the last, reducing abandonment and improving completion rates.
          </p>
          <div className="bg-neutral-50 rounded-2xl p-8 border border-neutral-200">
            <ul className="space-y-3">
              {[
                "Progressive form disclosure — only show what is relevant",
                "Save-and-resume functionality for long forms",
                "Progress indicators that keep users engaged",
                "Conditional routing between steps based on user input",
              ].map((text, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-neutral-600 leading-relaxed">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-neutral-900 text-white text-xs flex items-center justify-center mt-0.5">{i + 1}</span>
                  {text}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <hr className="border-t border-neutral-200 max-w-4xl mx-auto" />

      {/* Conditional Logic */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-5">
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-neutral-900 text-center mb-4">
            Conditional Logic
          </h2>
          <p className="text-sm text-neutral-500 text-center max-w-2xl mx-auto leading-relaxed mb-8">
            Build intelligent forms that adapt in real time. Show or hide fields, change required inputs, and route submissions differently based on how users answer.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {[
              "Show/hide fields based on previous answers",
              "Dynamic required field validation",
              "Branching logic for multi-path workflows",
              "Conditional payment collection",
            ].map((text, i) => (
              <div key={i} className="bg-neutral-50 rounded-2xl p-6 border border-neutral-200">
                <span className="block text-sm text-neutral-600 leading-relaxed">{text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <hr className="border-t border-neutral-200 max-w-4xl mx-auto" />

      {/* File Uploads */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-5">
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-neutral-900 text-center mb-4">
            File Uploads
          </h2>
          <p className="text-sm text-neutral-500 text-center max-w-2xl mx-auto leading-relaxed mb-8">
            Accept documents, images, and media files directly through your forms. Every upload is securely stored and accessible from your dashboard.
          </p>
          <div className="bg-neutral-50 rounded-2xl p-8 border border-neutral-200">
            <ul className="space-y-3">
              {[
                "Support for PDF, images, and video files",
                "Secure cloud storage with access controls",
                "File validation and size limits configurable per form",
                "Automatic file naming and organization",
              ].map((text, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-neutral-600 leading-relaxed">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-neutral-900 text-white text-xs flex items-center justify-center mt-0.5">{i + 1}</span>
                  {text}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <hr className="border-t border-neutral-200 max-w-4xl mx-auto" />

      {/* Lead Capture */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-5">
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-neutral-900 text-center mb-4">
            Lead Capture
          </h2>
          <p className="text-sm text-neutral-500 text-center max-w-2xl mx-auto leading-relaxed mb-8">
            Built-in lead capture that feeds directly into your sales pipeline. Every form submission becomes a trackable lead with automated follow-up sequences.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {[
              "Automated lead scoring and routing",
              "Follow-up email sequences triggered by form completion",
              "Lead source tracking for every submission",
              "Real-time notifications for new leads",
            ].map((text, i) => (
              <div key={i} className="bg-neutral-50 rounded-2xl p-6 border border-neutral-200">
                <span className="block text-sm text-neutral-600 leading-relaxed">{text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <hr className="border-t border-neutral-200 max-w-4xl mx-auto" />

      {/* Marketplace Forms */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-5">
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-neutral-900 text-center mb-4">
            Marketplace Forms
          </h2>
          <p className="text-sm text-neutral-500 text-center max-w-2xl mx-auto leading-relaxed mb-8">
            Deploy forms across the Talispros™ marketplace ecosystem. From MapSite™ builder requests to partner registration, every marketplace touchpoint is powered by TalisForms™.
          </p>
          <div className="bg-neutral-50 rounded-2xl p-8 border border-neutral-200">
            <ul className="space-y-3">
              {[
                "MapSite™ build request forms with media uploads",
                "Partner and associate registration portals",
                "FAST Code generation and account creation forms",
                "White-label form deployments for enterprise partners",
              ].map((text, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-neutral-600 leading-relaxed">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-neutral-900 text-white text-xs flex items-center justify-center mt-0.5">{i + 1}</span>
                  {text}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <hr className="border-t border-neutral-200 max-w-4xl mx-auto" />

      {/* CTA */}
      <section id="demo" className="py-20">
        <div className="max-w-2xl mx-auto px-5 text-center">
          <p className="text-xs font-medium text-neutral-400 uppercase tracking-widest mb-4">
            A Talispros™ Platform Product
          </p>
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-neutral-900 mb-3">
            Ready to see TalisForms™ in action?
          </h2>
          <p className="text-sm text-neutral-500 mb-8 max-w-md mx-auto leading-relaxed">
            Schedule a demo to learn how TalisForms™ powers forms, payments, and registrations across the Talispros™ ecosystem.
          </p>
          <a
            href="/talispros/build-mapsite"
            className="inline-flex h-12 px-8 bg-neutral-900 text-white rounded-xl text-sm font-medium tracking-wide items-center justify-center gap-2 hover:bg-neutral-800 active:scale-[0.98] transition-all"
          >
            Request Demo <ArrowRight className="w-4 h-4" />
          </a>
          <p className="text-xs text-neutral-400 mt-4">
            Or{" "}
            <Link href="/talispros" className="text-neutral-600 underline underline-offset-2 hover:text-neutral-900 transition-colors">
              return to TalisPros™
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}
