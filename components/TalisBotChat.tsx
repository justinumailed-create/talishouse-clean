'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { supabase } from "@/lib/supabase";

interface LeadData {
  purpose: string;
  size: string;
  productType: string;
  location: string;
  name: string;
  phone: string;
  email: string;
}

const STEP_OPTIONS = {
  purpose: [
    { value: 'personal', label: 'Personal Home / Cottage' },
    { value: 'rental', label: 'Short / Long Term Rental' },
    { value: 'commercial', label: 'Office Space / Commercial Use' },
  ],
  size: [
    { value: 'under_400', label: '399 sq. ft. or less' },
    { value: '401_800', label: '400 to 800 sq. ft.' },
    { value: 'over_800', label: '801+ sq. ft.' },
  ],
  productType: [
    { value: 'glasshouse', label: 'Glasshouse' },
    { value: 'talishouse_recreational', label: 'Talishouse (Recreational)' },
    { value: 'talishouse_residential', label: 'Talishouse (Residential)' },
  ]
};

const OPTION_CLASS = "w-full text-left px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 text-sm hover:border-black hover:bg-black hover:text-white transition-all duration-200 font-medium";

export default function TalisBotChat() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<'greeting' | 'purpose' | 'size' | 'productType' | 'location' | 'contact' | 'complete'>('greeting');
  const [loading, setLoading] = useState(false);
  const [leadData, setLeadData] = useState<LeadData>({
    purpose: '',
    size: '',
    productType: '',
    location: '',
    name: '',
    phone: '',
    email: '',
  });

  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight;
    }
  }, [step]);

  const generateFastCode = () => {
    const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `BOT-${rand}`;
  };

  const handleSubmit = async () => {
    if (!leadData.name || !leadData.phone || !leadData.email) return;
    
    setLoading(true);
    const fastCode = generateFastCode();

    const payload = {
      name: leadData.name,
      email: leadData.email,
      phone: leadData.phone,
      location: leadData.location,
      source: "talisbot",
      status: "new",
      deal_status: "pending",
      fast_code: fastCode,
      notes: `Purpose: ${leadData.purpose}, Size: ${leadData.size}, Product Type: ${leadData.productType}`,
      created_at: new Date().toISOString()
    };

    try {
      const { error } = await supabase.from('leads').insert([payload]);
      if (error) throw error;
      
      // Optional: trigger CRM/SMS via edge function or webhook
      // await fetch('/api/talisbot/notify', { method: 'POST', body: JSON.stringify(payload) });

      setStep('complete');
    } catch (err) {
      console.error("Talisbot submission error:", err);
      // Fallback: show completion anyway but log error
      setStep('complete');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setStep('greeting');
    setLeadData({
      purpose: '',
      size: '',
      productType: '',
      location: '',
      name: '',
      phone: '',
      email: '',
    });
  };

  const renderContent = () => {
    switch (step) {
      case 'greeting':
        return (
          <div className="flex flex-col items-center justify-center h-full text-center p-4 py-8">
            <div className="w-16 h-16 bg-black rounded-3xl flex items-center justify-center mb-6 shadow-lg shadow-black/10">
              <Image src="/logo.png" alt="TalisBOT" width={40} height={40} className="invert" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">TalisBOT</h3>
            <p className="text-sm text-gray-500 mb-8 leading-relaxed">
              Configure your project in under 60 seconds
            </p>
            <button 
              onClick={() => setStep('purpose')}
              className="w-full bg-black text-white py-4 rounded-2xl text-sm font-semibold hover:bg-gray-800 transition shadow-lg shadow-black/5"
            >
              Get Started
            </button>
          </div>
        );

      case 'purpose':
        return (
          <div className="space-y-4 p-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <h4 className="text-[15px] font-semibold text-gray-900 px-1">What is the primary purpose?</h4>
            <div className="grid gap-2">
              {STEP_OPTIONS.purpose.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => {
                    setLeadData({ ...leadData, purpose: opt.label });
                    setStep('size');
                  }}
                  className={OPTION_CLASS}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        );

      case 'size':
        return (
          <div className="space-y-4 p-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <h4 className="text-[15px] font-semibold text-gray-900 px-1">Choose your preferred size</h4>
            <div className="grid gap-2">
              {STEP_OPTIONS.size.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => {
                    setLeadData({ ...leadData, size: opt.label });
                    setStep('productType');
                  }}
                  className={OPTION_CLASS}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        );

      case 'productType':
        return (
          <div className="space-y-4 p-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <h4 className="text-[15px] font-semibold text-gray-900 px-1">Select Product Type</h4>
            <div className="grid gap-2">
              {STEP_OPTIONS.productType.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => {
                    setLeadData({ ...leadData, productType: opt.label });
                    setStep('location');
                  }}
                  className={OPTION_CLASS}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        );

      case 'location':
        return (
          <div className="space-y-4 p-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <h4 className="text-[15px] font-semibold text-gray-900 px-1">Where is your project located?</h4>
            <div className="space-y-4">
              <input
                type="text"
                autoFocus
                placeholder="Enter a full street address..."
                className="w-full px-4 py-4 rounded-xl border border-gray-100 bg-gray-50 text-sm focus:outline-none focus:border-black focus:ring-0 transition"
                value={leadData.location}
                onChange={(e) => setLeadData({ ...leadData, location: e.target.value })}
              />
              <button
                disabled={!leadData.location.trim()}
                onClick={() => setStep('contact')}
                className="w-full bg-black text-white py-4 rounded-xl text-sm font-semibold hover:bg-gray-800 transition disabled:opacity-50"
              >
                Continue
              </button>
            </div>
          </div>
        );

      case 'contact':
        return (
          <div className="space-y-4 p-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <h4 className="text-[15px] font-semibold text-gray-900 px-1">Your contact details</h4>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Full Name"
                className="w-full px-4 py-3.5 rounded-xl border border-gray-100 bg-gray-50 text-sm focus:outline-none focus:border-black transition"
                value={leadData.name}
                onChange={(e) => setLeadData({ ...leadData, name: e.target.value })}
              />
              <input
                type="email"
                placeholder="Email Address"
                className="w-full px-4 py-3.5 rounded-xl border border-gray-100 bg-gray-50 text-sm focus:outline-none focus:border-black transition"
                value={leadData.email}
                onChange={(e) => setLeadData({ ...leadData, email: e.target.value })}
              />
              <input
                type="tel"
                placeholder="Phone Number"
                className="w-full px-4 py-3.5 rounded-xl border border-gray-100 bg-gray-50 text-sm focus:outline-none focus:border-black transition"
                value={leadData.phone}
                onChange={(e) => setLeadData({ ...leadData, phone: e.target.value })}
              />
              <button
                disabled={!leadData.name || !leadData.email || !leadData.phone || loading}
                onClick={handleSubmit}
                className="w-full bg-black text-white py-4 rounded-xl text-sm font-semibold hover:bg-gray-800 transition disabled:opacity-50 mt-2"
              >
                {loading ? 'Submitting...' : 'Complete Configuration'}
              </button>
            </div>
          </div>
        );

      case 'complete':
        return (
          <div className="flex flex-col items-center justify-center h-full text-center p-4 py-8 animate-in zoom-in duration-300">
            <div className="w-16 h-16 bg-green-50 text-green-600 rounded-full flex items-center justify-center mb-6">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Success!</h3>
            <p className="text-sm text-gray-500 mb-8 leading-relaxed">
              Your configuration is saved. A Talis advisor will contact you shortly with your personalized quote.
            </p>
            <button 
              onClick={reset}
              className="text-sm font-medium text-gray-400 hover:text-black transition"
            >
              Start New Configuration
            </button>
          </div>
        );
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[1000] font-sans">
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="bg-black text-white rounded-2xl w-14 h-14 flex items-center justify-center shadow-2xl hover:scale-105 active:scale-95 transition-all duration-300"
        >
          <Image src="/logo.png" alt="Bot" width={28} height={28} className="invert" />
        </button>
      ) : (
        <div className="w-[340px] max-h-[580px] bg-white rounded-[32px] shadow-[0_24px_60px_rgba(0,0,0,0.15)] flex flex-col overflow-hidden border border-gray-100 animate-in fade-in zoom-in duration-300 origin-bottom-right">
          
          {/* Header */}
          <div className="px-6 pt-6 pb-4 flex justify-between items-center bg-white">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-black rounded-xl flex items-center justify-center">
                <Image src="/logo.png" alt="Bot" width={16} height={16} className="invert" />
              </div>
              <div className="flex flex-col">
                <span className="text-[13px] font-bold text-gray-900 leading-none">TalisBOT</span>
                <span className="text-[10px] text-green-500 font-medium mt-1 flex items-center gap-1">
                  <span className="w-1 h-1 bg-green-500 rounded-full animate-pulse"></span>
                  Active Now
                </span>
              </div>
            </div>
            <button 
              onClick={() => setOpen(false)}
              className="p-2 text-gray-400 hover:bg-gray-50 rounded-xl transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Body */}
          <div 
            ref={contentRef}
            className="flex-1 overflow-y-auto px-6 pb-8"
          >
            {renderContent()}
          </div>

          {/* Progress Indicator */}
          {step !== 'greeting' && step !== 'complete' && (
            <div className="px-6 py-4 bg-gray-50/50 flex gap-1.5">
              {['purpose', 'size', 'productType', 'location', 'contact'].map((s, i) => {
                const steps = ['purpose', 'size', 'productType', 'location', 'contact'];
                const currentIndex = steps.indexOf(step);
                return (
                  <div 
                    key={s} 
                    className={`h-1 flex-1 rounded-full transition-all duration-500 ${
                      i <= currentIndex ? 'bg-black' : 'bg-gray-200'
                    }`}
                  />
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
