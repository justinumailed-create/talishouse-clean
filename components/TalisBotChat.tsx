"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { shouldHidePublicStorefrontChrome } from "@/lib/admin-paths";
import { STOREFRONT_CHROME_CLASS } from "@/lib/storefront-chrome";
import OwnershipLearnMoreForm from "@/components/talispros/OwnershipLearnMoreForm";
import {
  TALISBOT_KNOWLEDGE,
  TALISBOT_SYSTEM_ROLE,
} from "@/lib/talispros/talisbot-knowledge";
import { TALISU_MKTS_HEADER_BLUE } from "@/lib/talisu/markets-pins";
import {
  OPEN_OWNERSHIP_CONTACT_EVENT,
  OWNERSHIP_CONTACT_TOPICS,
  type OpenOwnershipContactDetail,
} from "@/lib/talispros/ownership-contact";

const OPTION_CLASS =
  "w-full text-left px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 text-sm hover:border-black hover:bg-black hover:text-white transition-all duration-200 font-medium";

type TalisBotPosition = "left" | "right";
type BotStep = "greeting" | "knowledge" | "contact";

const DEFAULT_CONTACT_TOPIC = OWNERSHIP_CONTACT_TOPICS[0];

export default function TalisBotChat({
  position = "right",
}: {
  position?: TalisBotPosition;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<BotStep>("greeting");
  const [activeKnowledgeId, setActiveKnowledgeId] = useState<string | null>(null);
  const [contactTopic, setContactTopic] = useState<string>(DEFAULT_CONTACT_TOPIC);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight;
    }
  }, [step, activeKnowledgeId]);

  // Homepage Learn More buttons open the bot with the contact form inside it.
  useEffect(() => {
    function onOpenContact(event: Event) {
      const detail = (event as CustomEvent<OpenOwnershipContactDetail>).detail;
      setContactTopic(detail?.topic || DEFAULT_CONTACT_TOPIC);
      setActiveKnowledgeId(null);
      setStep("contact");
      setOpen(true);
    }
    window.addEventListener(OPEN_OWNERSHIP_CONTACT_EVENT, onOpenContact);
    return () => window.removeEventListener(OPEN_OWNERSHIP_CONTACT_EVENT, onOpenContact);
  }, []);

  useEffect(() => {
    if (step === "contact" && contentRef.current) {
      contentRef.current.scrollTop = 0;
    }
  }, [step, contactTopic]);

  const reset = () => {
    setStep("greeting");
    setActiveKnowledgeId(null);
  };

  const openContactForm = () => {
    setContactTopic(DEFAULT_CONTACT_TOPIC);
    setStep("contact");
  };

  const activeKnowledge = TALISBOT_KNOWLEDGE.find((k) => k.id === activeKnowledgeId);

  const renderContent = () => {
    switch (step) {
      case "contact":
        return <OwnershipLearnMoreForm topic={contactTopic} onClose={reset} />;

      case "greeting":
        return (
          <div className="flex flex-col items-center justify-center h-full text-center p-4 py-8">
            <div className="w-16 h-16 bg-black rounded-3xl flex items-center justify-center mb-6 shadow-lg shadow-black/10">
              <Image src="/logo.png" alt="TalisBOT" width={40} height={40} className="invert" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-8">TalisBOT</h3>
            <div className="flex w-full flex-col gap-2">
              <Link
                href="/talisu#faq"
                className="w-full bg-black text-white py-4 rounded-2xl text-sm font-semibold hover:bg-gray-800 transition shadow-lg shadow-black/5"
              >
                FAQ
              </Link>
              <button
                type="button"
                onClick={openContactForm}
                className="w-full border border-gray-200 bg-white text-gray-900 py-3.5 rounded-2xl text-sm font-semibold hover:bg-gray-50 transition"
              >
                Get help / leave contact
              </button>
            </div>
          </div>
        );

      case "knowledge":
        return (
          <div className="space-y-4 p-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <h4 className="text-[15px] font-semibold text-gray-900 px-1">Talispros™ processes</h4>
            {activeKnowledge ? (
              <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 text-left">
                <h5 className="text-sm font-semibold text-gray-900">{activeKnowledge.title}</h5>
                <p className="mt-2 text-sm leading-relaxed text-gray-600">{activeKnowledge.body}</p>
                <button
                  type="button"
                  className="mt-3 text-sm font-medium text-[#046BD9]"
                  onClick={() => setActiveKnowledgeId(null)}
                >
                  ← All topics
                </button>
                <button type="button" className={`${OPTION_CLASS} mt-3`} onClick={openContactForm}>
                  Contact about this
                </button>
              </div>
            ) : (
              <div className="grid gap-2">
                {TALISBOT_KNOWLEDGE.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveKnowledgeId(item.id)}
                    className={OPTION_CLASS}
                  >
                    {item.title}
                  </button>
                ))}
              </div>
            )}
            <button
              type="button"
              onClick={reset}
              className="text-sm font-medium text-gray-400 hover:text-black transition px-1"
            >
              ← Back
            </button>
          </div>
        );
    }
  };

  if (shouldHidePublicStorefrontChrome(pathname)) {
    return null;
  }

  const cornerClass = position === "left" ? "bottom-6 left-6" : "bottom-6 right-6";
  const panelOriginClass =
    position === "left" ? "origin-bottom-left" : "origin-bottom-right";

  return (
    <div className={`fixed ${cornerClass} z-[1000] font-sans ${STOREFRONT_CHROME_CLASS}`}>
      <span className="sr-only">{TALISBOT_SYSTEM_ROLE}</span>
      {!open ? (
        <div className="bg-white/80 backdrop-blur-md p-1.5 rounded-[22px] shadow-2xl border border-white/50">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="bg-black text-white rounded-2xl w-14 h-14 flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all duration-300 group"
          >
            <Image
              src="/logo.png"
              alt="Bot"
              width={28}
              height={28}
              className="invert group-hover:rotate-12 transition-transform"
            />
          </button>
        </div>
      ) : (
        <div
          className={`w-[340px] max-h-[580px] bg-white rounded-[32px] shadow-[0_24px_60px_rgba(0,0,0,0.15)] flex flex-col overflow-hidden border border-gray-100 animate-in fade-in zoom-in duration-300 ${panelOriginClass}`}
        >
          <div className="px-6 pt-6 pb-4 flex justify-between items-center bg-white">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-black rounded-xl flex items-center justify-center">
                <Image src="/logo.png" alt="Bot" width={16} height={16} className="invert" />
              </div>
              <div className="flex flex-col">
                <span className="text-[13px] font-bold text-gray-900 leading-none">TalisBOT</span>
                <span
                  className="text-[10px] font-medium mt-1 flex items-center gap-1"
                  style={{ color: TALISU_MKTS_HEADER_BLUE }}
                >
                  <span
                    className="w-1 h-1 rounded-full animate-pulse"
                    style={{ backgroundColor: TALISU_MKTS_HEADER_BLUE }}
                  />
                  Talispros™ processes
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="p-2 text-gray-400 hover:bg-gray-50 rounded-xl transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <div ref={contentRef} className="flex-1 overflow-y-auto px-6 pb-8">
            {renderContent()}
          </div>
        </div>
      )}
    </div>
  );
}
