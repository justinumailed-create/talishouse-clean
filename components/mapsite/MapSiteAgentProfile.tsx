import Image from "next/image";
import type { MapSiteAgentData } from "@/lib/mapsite-layout";
import { Mail, Phone, User } from "lucide-react";

interface MapSiteAgentProfileProps {
  agent: MapSiteAgentData;
}

export default function MapSiteAgentProfile({ agent }: MapSiteAgentProfileProps) {
  return (
    <section className="bg-white">
      <div className="max-w-6xl mx-auto px-5 sm:px-8 py-8 sm:py-10">
        <div className="flex flex-col sm:flex-row items-start gap-6 sm:gap-8">
          <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden bg-neutral-100 border border-neutral-200 flex-shrink-0">
            {agent.profileImageUrl ? (
              <Image
                src={agent.profileImageUrl}
                alt={agent.name}
                fill
                className="object-cover"
                sizes="112px"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-neutral-400">
                <User className="w-10 h-10" />
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-xs uppercase tracking-[0.2em] text-neutral-400 mb-2">
              Agent Profile
            </p>
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-neutral-900">
              {agent.name}
            </h2>

            <div className="mt-4 flex flex-col gap-2 text-sm text-neutral-600">
              {agent.email && (
                <a
                  href={`mailto:${agent.email}`}
                  className="inline-flex items-center gap-2 hover:text-neutral-900 transition-colors"
                >
                  <Mail className="w-4 h-4 flex-shrink-0" />
                  <span>{agent.email}</span>
                </a>
              )}
              {agent.phone && (
                <a
                  href={`tel:${agent.phone}`}
                  className="inline-flex items-center gap-2 hover:text-neutral-900 transition-colors"
                >
                  <Phone className="w-4 h-4 flex-shrink-0" />
                  <span>{agent.phone}</span>
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
