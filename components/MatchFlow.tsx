"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ROUTES } from "@/lib/routes";

interface FormData {
  goal: string;
  budget_min: string;
  budget_max: string;
  timeline: string;
  location: string;
  home_type: string;
  home_size_sqft: string;
  financing_needed: boolean | null;
  land_owned: boolean | null;
  name: string;
  email: string;
  phone: string;
}

interface MatchFlowProps {
  onComplete?: () => void;
}

export default function MatchFlow({ onComplete }: MatchFlowProps) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    goal: "",
    budget_min: "",
    budget_max: "",
    timeline: "",
    location: "",
    home_type: "",
    home_size_sqft: "",
    financing_needed: null,
    land_owned: null,
    name: "",
    email: "",
    phone: ""
  });

  const TOTAL_STEPS = 5;

  const updateForm = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  const handleNext = () => {
    if (step < TOTAL_STEPS) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const canProceed = () => {
    switch (step) {
      case 1: return !!formData.goal;
      case 2: return !!formData.timeline;
      case 3: return !!formData.home_type;
      case 4: return true;
      case 5: return formData.name && formData.email && formData.phone;
      default: return false;
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/match-submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Submission failed");
      }

      sessionStorage.setItem("matchResult", JSON.stringify({
        product: result.recommendation.product,
        path: result.recommendation.path,
        config: result.recommendation.config,
        goal: formData.goal,
        timeline: formData.timeline,
        homeType: formData.home_type
      }));

      if (onComplete) {
        onComplete();
      } else {
        router.push(ROUTES.MATCH_RESULTS);
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  const goals = [
    { id: "buy", label: "Buy a Home", icon: "🏠" },
    { id: "build", label: "Build a Home", icon: "🏗️" },
    { id: "invest", label: "Invest", icon: "📈" },
    { id: "explore", label: "Just Exploring", icon: "🔍" }
  ];

  const timelines = [
    { id: "now", label: "Ready now", sublabel: "0–3 months" },
    { id: "soon", label: "Soon", sublabel: "3–6 months" },
    { id: "planning", label: "Planning", sublabel: "6+ months" }
  ];

  const homeTypes = [
    { id: "glasshouse", label: "Glasshouse", desc: "Premium glass enclosure" },
    { id: "talishouse_residential", label: "Talishouse Residential", desc: "Full residential home" },
    { id: "talistowns", label: "Talistowns", desc: "Community living" },
    { id: "not_sure", label: "Not sure", desc: "Recommend for me" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex flex-col">
      <header className="flex items-center justify-between px-6 py-4">
        <Link href={ROUTES.HOME} className="text-white/80 hover:text-white transition-colors text-sm">
          ← Back to Home
        </Link>
        <div className="text-white/60 text-sm">
          Step {step} of {TOTAL_STEPS}
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-xl">
          <div className="mb-8">
            <div className="h-1 bg-white/10 rounded-full overflow-hidden">
              <div 
                className="h-full bg-white/80 rounded-full transition-all duration-500"
                style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
              />
            </div>
          </div>

          {step === 1 && (
            <Step1Goal 
              formData={formData} 
              updateForm={updateForm} 
              goals={goals}
            />
          )}

          {step === 2 && (
            <Step2Situation 
              formData={formData} 
              updateForm={updateForm}
              timelines={timelines}
            />
          )}

          {step === 3 && (
            <Step3HomeType 
              formData={formData} 
              updateForm={updateForm}
              homeTypes={homeTypes}
            />
          )}

          {step === 4 && (
            <Step4Preferences 
              formData={formData} 
              updateForm={updateForm}
            />
          )}

          {step === 5 && (
            <Step5Contact 
              formData={formData} 
              updateForm={updateForm}
              error={error}
            />
          )}

          <div className="mt-8 flex gap-4">
            {step > 1 && (
              <button
                onClick={handleBack}
                className="flex-1 py-4 px-6 bg-white/10 text-white rounded-xl font-medium hover:bg-white/20 transition-colors"
              >
                Back
              </button>
            )}
            {step < TOTAL_STEPS ? (
              <button
                onClick={handleNext}
                disabled={!canProceed()}
                className="flex-1 py-4 px-6 bg-white text-gray-900 rounded-xl font-medium hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={!canProceed() || loading}
                className="flex-1 py-4 px-6 bg-white text-gray-900 rounded-xl font-medium hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Submitting..." : "Get My Match"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Step1Goal({ formData, updateForm, goals }: { 
  formData: FormData; 
  updateForm: (field: keyof FormData, value: any) => void;
  goals: { id: string; label: string; icon: string }[];
}) {
  return (
    <div>
      <h2 className="text-3xl font-semibold text-white text-center mb-2">
        What are you looking to do?
      </h2>
      <p className="text-white/60 text-center mb-8">
        Select your primary goal
      </p>
      <div className="grid grid-cols-2 gap-4">
        {goals.map((goal) => (
          <button
            key={goal.id}
            onClick={() => updateForm("goal", goal.id)}
            className={`p-6 rounded-xl border-2 transition-all ${
              formData.goal === goal.id
                ? "border-white bg-white/10"
                : "border-white/20 bg-white/5 hover:border-white/40"
            }`}
          >
            <div className="text-3xl mb-2">{goal.icon}</div>
            <div className="text-white font-medium">{goal.label}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

function Step2Situation({ formData, updateForm, timelines }: { 
  formData: FormData; 
  updateForm: (field: keyof FormData, value: any) => void;
  timelines: { id: string; label: string; sublabel: string }[];
}) {
  return (
    <div>
      <h2 className="text-3xl font-semibold text-white text-center mb-2">
        Tell us about your situation
      </h2>
      <p className="text-white/60 text-center mb-8">
        Budget and timeline help us find the right match
      </p>
      
      <div className="mb-6">
        <label className="text-white/80 text-sm mb-2 block">Budget Range</label>
        <div className="flex gap-3">
          <input
            type="number"
            placeholder="Min ($)"
            value={formData.budget_min}
            onChange={(e) => updateForm("budget_min", e.target.value)}
            className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-white/60"
          />
          <input
            type="number"
            placeholder="Max ($)"
            value={formData.budget_max}
            onChange={(e) => updateForm("budget_max", e.target.value)}
            className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-white/60"
          />
        </div>
      </div>

      <div className="mb-6">
        <label className="text-white/80 text-sm mb-2 block">Timeline</label>
        <div className="grid grid-cols-3 gap-3">
          {timelines.map((t) => (
            <button
              key={t.id}
              onClick={() => updateForm("timeline", t.id)}
              className={`p-4 rounded-xl border-2 text-center transition-all ${
                formData.timeline === t.id
                  ? "border-white bg-white/10"
                  : "border-white/20 bg-white/5 hover:border-white/40"
              }`}
            >
              <div className="text-white font-medium">{t.label}</div>
              <div className="text-white/50 text-xs mt-1">{t.sublabel}</div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-white/80 text-sm mb-2 block">Location Preference</label>
        <input
          type="text"
          placeholder="City, State, or Region"
          value={formData.location}
          onChange={(e) => updateForm("location", e.target.value)}
          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-white/60"
        />
      </div>
    </div>
  );
}

function Step3HomeType({ formData, updateForm, homeTypes }: { 
  formData: FormData; 
  updateForm: (field: keyof FormData, value: any) => void;
  homeTypes: { id: string; label: string; desc: string }[];
}) {
  return (
    <div>
      <h2 className="text-3xl font-semibold text-white text-center mb-2">
        What type of home interests you?
      </h2>
      <p className="text-white/60 text-center mb-8">
        Choose one or select &quot;Not sure&quot; for recommendations
      </p>
      <div className="grid grid-cols-2 gap-4">
        {homeTypes.map((type) => (
          <button
            key={type.id}
            onClick={() => updateForm("home_type", type.id)}
            className={`p-6 rounded-xl border-2 text-left transition-all ${
              formData.home_type === type.id
                ? "border-white bg-white/10"
                : "border-white/20 bg-white/5 hover:border-white/40"
            }`}
          >
            <div className="text-white font-medium text-lg mb-1">{type.label}</div>
            <div className="text-white/60 text-sm">{type.desc}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

function Step4Preferences({ formData, updateForm }: { 
  formData: FormData; 
  updateForm: (field: keyof FormData, value: any) => void;
}) {
  return (
    <div>
      <h2 className="text-3xl font-semibold text-white text-center mb-2">
        Any specific preferences?
      </h2>
      <p className="text-white/60 text-center mb-8">
        All fields are optional — skip anything you&apos;re not sure about
      </p>
      
      <div className="space-y-6">
        <div>
          <label className="text-white/80 text-sm mb-2 block">Size (sq ft)</label>
          <input
            type="text"
            placeholder="e.g., 800-1200"
            value={formData.home_size_sqft}
            onChange={(e) => updateForm("home_size_sqft", e.target.value)}
            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-white/60"
          />
        </div>

        <div>
          <label className="text-white/80 text-sm mb-2 block">Financing needed?</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => updateForm("financing_needed", true)}
              className={`p-4 rounded-xl border-2 text-center transition-all ${
                formData.financing_needed === true
                  ? "border-white bg-white/10"
                  : "border-white/20 bg-white/5 hover:border-white/40"
              }`}
            >
              <div className="text-white font-medium">Yes</div>
            </button>
            <button
              onClick={() => updateForm("financing_needed", false)}
              className={`p-4 rounded-xl border-2 text-center transition-all ${
                formData.financing_needed === false
                  ? "border-white bg-white/10"
                  : "border-white/20 bg-white/5 hover:border-white/40"
              }`}
            >
              <div className="text-white font-medium">No</div>
            </button>
          </div>
        </div>

        <div>
          <label className="text-white/80 text-sm mb-2 block">Land owned?</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => updateForm("land_owned", true)}
              className={`p-4 rounded-xl border-2 text-center transition-all ${
                formData.land_owned === true
                  ? "border-white bg-white/10"
                  : "border-white/20 bg-white/5 hover:border-white/40"
              }`}
            >
              <div className="text-white font-medium">Yes</div>
            </button>
            <button
              onClick={() => updateForm("land_owned", false)}
              className={`p-4 rounded-xl border-2 text-center transition-all ${
                formData.land_owned === false
                  ? "border-white bg-white/10"
                  : "border-white/20 bg-white/5 hover:border-white/40"
              }`}
            >
              <div className="text-white font-medium">No</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Step5Contact({ formData, updateForm, error }: { 
  formData: FormData; 
  updateForm: (field: keyof FormData, value: any) => void;
  error: string | null;
}) {
  return (
    <div>
      <h2 className="text-3xl font-semibold text-white text-center mb-2">
        How can we reach you?
      </h2>
      <p className="text-white/60 text-center mb-8">
        We&apos;ll use this to send your personalized match
      </p>
      
      {error && (
        <div className="mb-6 p-4 bg-red-500/20 border border-red-500/40 rounded-xl text-red-200 text-sm">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="text-white/80 text-sm mb-2 block">Full Name</label>
          <input
            type="text"
            placeholder="Your name"
            value={formData.name}
            onChange={(e) => updateForm("name", e.target.value)}
            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-white/60"
          />
        </div>

        <div>
          <label className="text-white/80 text-sm mb-2 block">Email</label>
          <input
            type="email"
            placeholder="your@email.com"
            value={formData.email}
            onChange={(e) => updateForm("email", e.target.value)}
            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-white/60"
          />
        </div>

        <div>
          <label className="text-white/80 text-sm mb-2 block">Phone</label>
          <input
            type="tel"
            placeholder="(555) 123-4567"
            value={formData.phone}
            onChange={(e) => updateForm("phone", e.target.value)}
            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-white/60"
          />
        </div>
      </div>
    </div>
  );
}
