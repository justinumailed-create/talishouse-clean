import { AISHA_HOMEPAGE_AGENT_ID } from "@/lib/talispros/aisha-mapsite-agent";

/**
 * Public voice assistants. Copy lives in the dictionaries so English and
 * German stay together. The homepage agent stays on Aisha.
 */

export const WEBSTER_GUIDE_AGENT_ID = "agent_0701m7kv74mnf12btd49nv64t3cg";
export const THORSTEN_GUIDE_AGENT_ID = "agent_6201m7kv77zrebbvf0zj11cnrwt0";

export type AssistantPersonaId = "aisha" | "webster" | "thorsten";

export type AssistantPersona = {
  id: AssistantPersonaId;
  agentId: string;
  portraitSrc: string;
};

export const ASSISTANT_PERSONAS: Record<AssistantPersonaId, AssistantPersona> = {
  aisha: {
    id: "aisha",
    agentId: AISHA_HOMEPAGE_AGENT_ID,
    portraitSrc: "/images/mapsites/aisha-c.webp",
  },
  webster: {
    id: "webster",
    agentId: WEBSTER_GUIDE_AGENT_ID,
    portraitSrc: "/talisu/webster-banker-v3.jpg",
  },
  thorsten: {
    id: "thorsten",
    agentId: THORSTEN_GUIDE_AGENT_ID,
    portraitSrc: "/talisu/webster-team-leader-v2.jpg",
  },
};

export const DEFAULT_ASSISTANT_PERSONA = ASSISTANT_PERSONAS.aisha;
