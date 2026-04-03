'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from "@/lib/supabase";

interface LeadData {
  intent: string;
  size: string;
  budget: string;
  location: string;
  finish: string;
  installation: string;
  name: string;
  phone: string;
  email: string;
}

interface Product {
  id: string;
  name: string;
  price: number;
  size: string;
  image_url?: string;
  type?: string;
  min_budget?: number;
  max_budget?: number;
  size_min?: number;
  size_max?: number;
  location?: string;
}

interface Message {
  id: number;
  role: 'user' | 'bot';
  content: string;
}

interface ScoredProduct extends Product {
  score: number;
  matchReasons: string[];
}

const INTENT_OPTIONS = [
  { value: 'personal', label: 'Personal Home' },
  { value: 'rental', label: 'Rental Investment' },
  { value: 'commercial', label: 'Commercial Space' },
];

const SIZE_OPTIONS = [
  { value: 'under_500', label: 'Under 500 sq.ft' },
  { value: '500_1000', label: '500–1000 sq.ft' },
  { value: 'over_1000', label: '1000+ sq.ft' },
];

const BUDGET_OPTIONS = [
  { value: 'under_25k', label: 'Under $25k' },
  { value: '25k_75k', label: '$25k–$75k' },
  { value: 'over_75k', label: '$75k+' },
];

const FINISH_OPTIONS = [
  { value: 'delivery', label: 'Delivery Only' },
  { value: 'roof_tight', label: 'Roof Tight' },
  { value: 'turnkey', label: 'Turn Key' },
];

const INSTALL_OPTIONS = [
  { value: 'piers', label: 'Piers' },
  { value: 'screw_piles', label: 'Screw Piles' },
  { value: 'slab', label: 'Slab' },
];

const OPTION_CLASS = "px-4 py-2 rounded-full border text-sm hover:bg-black hover:text-white transition-all duration-200";

export default function TalisBotChat() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<'greeting' | 'intent' | 'size' | 'budget' | 'location' | 'finish' | 'installation' | 'recommend' | 'convert' | 'lead' | 'complete'>('greeting');
  const [sessionId, setSessionId] = useState("");

  useEffect(() => {
    setSessionId(`talis_${crypto.randomUUID()}`);
  }, []);

  const [lastStep, setLastStep] = useState('greeting');
  const [leadData, setLeadData] = useState<LeadData>({
    intent: '',
    size: '',
    budget: '',
    location: '',
    finish: '',
    installation: '',
    name: '',
    phone: '',
    email: '',
  });
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchProducts() {
      const { data } = await supabase.from('products').select('*');
      if (data) setProducts(data);
    }
    fetchProducts();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, step]);

  const addMessage = (role: 'user' | 'bot', content: string) => {
    setMessages(prev => [...prev, { id: Date.now(), role, content }]);
    
    // Log to database (fire and forget)
    (async () => {
      try {
        await supabase.from('talisbot_chat_logs').insert([{
          session_id: sessionId,
          step: step,
          user_input: role === 'user' ? content : null,
          bot_response: role === 'bot' ? content : null,
        }]);
      } catch (e) {
        // Silently fail
      }
    })();
  };

  const getRecommendedProducts = (): ScoredProduct[] => {
    if (products.length === 0) return [];

    const budgetRanges: Record<string, { min: number; max: number }> = {
      under_25k: { min: 0, max: 25000 },
      '25k_75k': { min: 25000, max: 75000 },
      over_75k: { min: 75000, max: Infinity },
    };

    const sizeRanges: Record<string, { min: number; max: number }> = {
      under_500: { min: 0, max: 500 },
      '500_1000': { min: 500, max: 1000 },
      over_1000: { min: 1000, max: Infinity },
    };

    const scored = products.map((product) => {
      let score = 0;
      const matchReasons: string[] = [];
      const pSize = parseInt(product.size) || 0;
      const pPrice = product.price || 0;

      // Intent match: +40 points
      if (leadData.intent && product.type) {
        if (
          (leadData.intent === 'personal' && product.type === 'personal') ||
          (leadData.intent === 'rental' && (product.type === 'rental' || product.type === 'investment')) ||
          (leadData.intent === 'commercial' && product.type === 'commercial')
        ) {
          score += 40;
          matchReasons.push('Matches your use case');
        }
      }

      // Budget match: +30 points
      if (leadData.budget && budgetRanges[leadData.budget]) {
        const range = budgetRanges[leadData.budget];
        const inRange = pPrice >= range.min && pPrice < range.max;
        if (inRange) {
          score += 30;
          matchReasons.push('Fits your budget');
        } else if (pPrice <= range.max * 1.5) {
          score += 10;
          matchReasons.push('Near your budget');
        }
      }

      // Size match: +20 points
      if (leadData.size && sizeRanges[leadData.size]) {
        const range = sizeRanges[leadData.size];
        const inRange = pSize >= range.min && pSize < range.max;
        if (inRange) {
          score += 20;
          matchReasons.push('Right size');
        } else if (pSize >= range.min - 200 && pSize <= range.max + 200) {
          score += 5;
        }
      }

      // Location match: +10 points
      if (leadData.location && product.location) {
        const loc = leadData.location.toLowerCase();
        const prodLoc = product.location.toLowerCase();
        if (prodLoc.includes(loc) || loc.includes(prodLoc)) {
          score += 10;
          matchReasons.push('Available in your area');
        }
      }

      return { ...product, score, matchReasons };
    });

    // Sort by score descending, return top 3
    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
  };

  const handleSubmitLead = async () => {
    if (!leadData.name || !leadData.phone || !leadData.email) {
      alert("Please fill in all fields");
      return;
    }

    setLoading(true);
    const recommended = getRecommendedProducts();
    const leadPayload = {
     name: leadData.name,
     phone: leadData.phone,
     location: leadData.location || "unknown",
     source: "talisbot",
     status: "new",
     deal_status: "pending",
     created_at: new Date().toISOString()
};

    try {

  console.log("FINAL PAYLOAD:", leadPayload);

  const { data, error } = await supabase
  .from('leads')
  .insert([leadPayload])
  .select();

console.log("TEST SELECT:", { data, error });
  if (error) {
    console.error("Supabase insert error:", error);

    const pendingLeads = JSON.parse(
      localStorage.getItem('pending_talisbot_leads') || '[]'
    );

    pendingLeads.push({
      ...leadPayload,
      failed_at: new Date().toISOString()
    });

    localStorage.setItem(
      'pending_talisbot_leads',
      JSON.stringify(pendingLeads)
    );
  }
} catch (err) {
  console.error("Lead submission failed:", err);
}
    setStep('complete');
    setLastStep('complete');
    setLoading(false);
  };

  const calculatePrice = (product: Product): number => {
    const size = parseInt(product.size) || 0;
    const pricePerSqFt = (product as any).price_per_sqft || 58.5;
    
    let base = size * pricePerSqFt;
    let adjustment = 0;

    if (leadData.finish === 'turnkey') {
      adjustment += base * 0.20;
    } else if (leadData.finish === 'roof_tight') {
      adjustment += base * 0.10;
    }

    if (leadData.intent === 'commercial') {
      adjustment += base * 0.15;
    }

    if (leadData.installation === 'screw_piles') {
      adjustment += 3500;
    } else if (leadData.installation === 'piers') {
      adjustment += 2500;
    } else if (leadData.installation === 'slab') {
      adjustment += 5000;
    }

    return base + adjustment;
  };

  const getEstimationText = (product: Product): string => {
    const total = calculatePrice(product);
    return `Estimated: $${total.toLocaleString()}`;
  };

  const resetBot = () => {
    setStep('greeting');
    setLastStep('greeting');
    setMessages([]);
    setLeadData({ intent: '', size: '', budget: '', location: '', finish: '', installation: '', name: '', phone: '', email: '' });
  };

  const startBot = () => {
    setStep('intent');
    setLastStep('intent');
  };

  const selectOption = (value: string, label: string, nextStep: typeof step) => {
    setStep(nextStep);
    setLastStep(nextStep);
    if (value === 'reset') {
      setMessages([]);
      setTimeout(() => {
        setStep('greeting');
        setLastStep('greeting');
        setMessages([]);
        setLeadData({ intent: '', size: '', budget: '', location: '', finish: '', installation: '', name: '', phone: '', email: '' });
      }, 300);
    }
  };

  const renderMessages = () => {
    if (messages.length === 0 && step === 'greeting') {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center p-4 animate-fade-in">
          <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center mb-4">
            <span className="text-white text-2xl">🏠</span>
          </div>
          <h3 className="font-semibold text-gray-900 mb-2">Hi, I'm TalisBOT</h3>
          <p className="text-xs text-gray-500 mb-4">I'll help you find the right home in under 60 seconds.</p>
          <button onClick={startBot} className="bg-black text-white px-6 py-2.5 rounded-full text-sm font-medium hover:opacity-90 transition">
            Get Started
          </button>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`animate-fade-in px-4 py-2 rounded-2xl max-w-[85%] ${
              msg.role === 'user'
                ? 'bg-black text-white ml-auto rounded-br-md'
                : 'bg-gray-100 text-black mr-auto rounded-bl-md'
            }`}
          >
            <p className="text-sm">{msg.content}</p>
          </div>
        ))}
        
        <div ref={messagesEndRef} />
      </div>
    );
  };

  const renderStep = () => {
    switch (step) {
      case 'intent':
        return (
          <div className="space-y-3 animate-fade-in">
            <p className="text-sm font-medium text-gray-900">What are you looking for?</p>
            <div className="flex flex-wrap gap-2">
              {INTENT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => selectOption(opt.value, opt.label, 'size')}
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
          <div className="space-y-3 animate-fade-in">
            <p className="text-sm font-medium text-gray-900">What size are you considering?</p>
            <div className="flex flex-wrap gap-2">
              {SIZE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => selectOption(opt.value, opt.label, 'budget')}
                  className={OPTION_CLASS}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        );

      case 'budget':
        return (
          <div className="space-y-3 animate-fade-in">
            <p className="text-sm font-medium text-gray-900">What is your budget range?</p>
            <div className="flex flex-wrap gap-2">
              {BUDGET_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => selectOption(opt.value, opt.label, 'location')}
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
          <div className="space-y-3 animate-fade-in">
            <p className="text-sm font-medium text-gray-900">Where are you planning to build?</p>
            <input
              type="text"
              value={leadData.location}
              onChange={(e) => setLeadData({ ...leadData, location: e.target.value })}
              placeholder="City, State (optional)"
              className="w-full border border-gray-200 rounded-full px-4 py-2.5 text-sm focus:outline-none focus:border-black focus:ring-1 focus:ring-black"
            />
            <button
              onClick={() => { setStep('finish'); setLastStep('finish'); }}
              className="w-full bg-black text-white px-4 py-2.5 rounded-full text-sm font-medium hover:opacity-90 transition"
            >
              See Recommendations
            </button>
          </div>
        );

      case 'finish':
        return (
          <div className="space-y-3 animate-fade-in">
            <p className="text-sm font-medium text-gray-900">What finish level do you need?</p>
            <div className="flex flex-wrap gap-2">
              {FINISH_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => { setLeadData({ ...leadData, finish: opt.value }); setStep('installation'); setLastStep('installation'); }}
                  className={OPTION_CLASS}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        );

      case 'installation':
        return (
          <div className="space-y-3 animate-fade-in">
            <p className="text-sm font-medium text-gray-900">What installation type?</p>
            <div className="flex flex-wrap gap-2">
              {INSTALL_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => { setLeadData({ ...leadData, installation: opt.value }); setStep('recommend'); setLastStep('recommend'); }}
                  className={OPTION_CLASS}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        );

      case 'recommend':
        const recommended = getRecommendedProducts();
        return (
          <div className="space-y-3 animate-fade-in">
            <p className="text-sm font-medium text-gray-900">Recommended for you:</p>
            {recommended.length === 0 || recommended[0].score === 0 ? (
              <div className="text-center py-4">
                <p className="text-xs text-gray-500 mb-3">I'll find the best options for you.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {recommended.map((p) => (
                  <div key={p.id} className="border border-gray-200 rounded-xl overflow-hidden hover:border-gray-400 transition">
                    {p.image_url && (
                      <img src={p.image_url} alt={p.name} className="w-full h-20 object-cover" />
                    )}
                    <div className="p-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{p.name}</p>
                          <p className="text-xs text-gray-500">${p.price?.toLocaleString()} • {p.size} sq.ft</p>
                          {leadData.finish && (
                            <p className="text-xs font-medium text-green-600 mt-1">
                              {getEstimationText(p)}
                            </p>
                          )}
                        </div>
                        {p.score >= 50 && (
                          <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Top Match</span>
                        )}
                      </div>
                      {p.matchReasons.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {p.matchReasons.slice(0, 2).map((reason, i) => (
                            <span key={i} className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                              {reason}
                            </span>
                          ))}
                        </div>
                      )}
                      <a
                        href={`/catalog?product=${p.id}`}
                        target="_blank"
                        className="mt-2 block w-full text-center py-1.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition"
                      >
                        View
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <button
              onClick={() => { setStep('convert'); setLastStep('convert'); }}
              className="w-full bg-black text-white px-4 py-2.5 rounded-full text-sm font-medium hover:opacity-90 transition"
            >
              Get Exact Pricing
            </button>
          </div>
        );

      case 'convert':
        return (
          <div className="space-y-4 animate-fade-in text-center">
            <div className="bg-green-50 rounded-xl p-4">
              <p className="text-sm font-medium text-gray-900">
                Based on your inputs, we have units available in your range.
              </p>
              <p className="text-xs text-gray-500 mt-2">
                Pricing shown is valid for 48 hours.
              </p>
            </div>
            <p className="text-sm font-medium text-gray-900">
              Would you like us to lock this pricing for you?
            </p>
            <div className="space-y-2">
              <button
                onClick={() => { setStep('lead'); setLastStep('lead'); }}
                className="w-full bg-black text-white px-4 py-2.5 rounded-full text-sm font-medium hover:opacity-90 transition"
              >
                Yes, lock my quote
              </button>
              <button
                onClick={() => { setStep('lead'); setLastStep('lead'); }}
                className="w-full border border-gray-300 text-gray-700 px-4 py-2.5 rounded-full text-sm font-medium hover:bg-gray-50 transition"
              >
                Talk to team
              </button>
            </div>
          </div>
        );

      case 'lead':
        return (
          <div className="space-y-3 animate-fade-in">
            <p className="text-sm font-medium text-gray-900">Want exact pricing and availability?</p>
            <input
              type="text"
              value={leadData.name}
              onChange={(e) => setLeadData({ ...leadData, name: e.target.value })}
              placeholder="Your Name"
              className="w-full border border-gray-200 rounded-full px-4 py-2.5 text-sm focus:outline-none focus:border-black focus:ring-1 focus:ring-black"
            />
            <input
              type="tel"
              value={leadData.phone}
              onChange={(e) => setLeadData({ ...leadData, phone: e.target.value })}
              placeholder="Phone Number"
              className="w-full border border-gray-200 rounded-full px-4 py-2.5 text-sm focus:outline-none focus:border-black focus:ring-1 focus:ring-black"
            />
            <input
              type="email"
              value={leadData.email}
              onChange={(e) => setLeadData({ ...leadData, email: e.target.value })}
              placeholder="Email Address"
              className="w-full border border-gray-200 rounded-full px-4 py-2.5 text-sm focus:outline-none focus:border-black focus:ring-1 focus:ring-black"
            />
            <button
              onClick={handleSubmitLead}
              disabled={!leadData.name || !leadData.phone || !leadData.email || loading}
              className="w-full bg-black text-white px-4 py-2.5 rounded-full text-sm font-medium disabled:opacity-50 hover:opacity-90 transition"
            >
              {loading ? 'Sending...' : 'Get My Quote'}
            </button>
          </div>
        );

      case 'complete':
        return (
          <div className="flex flex-col items-center justify-center h-full text-center p-4 animate-fade-in">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <span className="text-green-600 text-xl">✓</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Quote Requested!</h3>
            <p className="text-xs text-gray-500 mb-4">We'll be in touch within 24 hours.</p>
            <button onClick={resetBot} className="text-sm text-black underline hover:opacity-70 transition">
              Start Over
            </button>
          </div>
        );
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">

      {/* Toggle Button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="bg-black text-white rounded-full w-14 h-14 flex items-center justify-center shadow-xl hover:scale-105 transition-transform"
        >
          <span className="text-lg">🏠</span>
        </button>
      )}

      {/* Chat Box */}
      {open && (
        <div className="w-80 max-w-sm bg-white border border-gray-200 rounded-2xl shadow-xl flex flex-col overflow-hidden animate-fade-in">

          {/* Header */}
          <div className="flex justify-between items-center px-4 py-3 border-b border-gray-100 bg-gray-50">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              <span className="text-sm font-semibold text-gray-900">TalisBOT</span>
            </div>
            <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600 transition">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {renderMessages()}
            {step !== 'greeting' && step !== 'complete' && (
              <div className="mt-3 animate-fade-in">
                {renderStep()}
              </div>
            )}
            {step === 'complete' && renderStep()}
          </div>

        </div>
      )}
    </div>
  );
}
