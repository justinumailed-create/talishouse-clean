/**
 * Public voice assistants. Copy (greeting and title) lives in the dictionaries
 * so English and German stay together. Add Webster or Thorsten here with
 * their own agent id, portrait, and dictionary block when those agents exist.
 */
export type AssistantPersonaId = "aisha";

export type AssistantPersona = {
  id: AssistantPersonaId;
  agentId: string;
  portraitSrc: string;
};

export const ASSISTANT_PERSONAS: Record<AssistantPersonaId, AssistantPersona> = {
  aisha: {
    id: "aisha",
    agentId: "agent_0401m7cxgba1fhwb35aqr43acnv1",
    portraitSrc: "/images/mapsites/aisha-c.webp",
  },
};

export const DEFAULT_ASSISTANT_PERSONA = ASSISTANT_PERSONAS.aisha;
