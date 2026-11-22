import type { DetailedHTMLProps, HTMLAttributes } from "react";

/**
 * ElevenLabs Convai widget (`elevenlabs-convai`), defined by
 * https://unpkg.com/@elevenlabs/convai-widget-embed
 */
type ElevenLabsConvaiProps = DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & {
  "agent-id": string;
  /** JSON object. Omitted when the page has no Mapsite variables. */
  "dynamic-variables"?: string;
  /** Spoken opening for this call. Needs the first_message override on the agent. */
  "override-first-message"?: string;
  "action-text"?: string;
  "start-call-text"?: string;
  "end-call-text"?: string;
  "expand-text"?: string;
  "avatar-image-url"?: string;
  "avatar-orb-color-1"?: string;
  "avatar-orb-color-2"?: string;
  variant?: "compact" | "expanded" | "full";
  /** `page` fills the parent with the conversation and its transcript. */
  layout?: "default" | "page";
  placement?:
    | "bottom-right"
    | "bottom-left"
    | "bottom"
    | "top-right"
    | "top-left"
    | "top";
};

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "elevenlabs-convai": ElevenLabsConvaiProps;
    }
  }
}

export {};
