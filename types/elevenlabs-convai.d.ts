import type { DetailedHTMLProps, HTMLAttributes } from "react";

/**
 * ElevenLabs Convai widget (`elevenlabs-convai`), defined by
 * https://unpkg.com/@elevenlabs/convai-widget-embed
 */
type ElevenLabsConvaiProps = DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & {
  "agent-id": string;
  "action-text"?: string;
  "start-call-text"?: string;
  "end-call-text"?: string;
  "expand-text"?: string;
  "avatar-image-url"?: string;
  "avatar-orb-color-1"?: string;
  "avatar-orb-color-2"?: string;
  variant?: "compact" | "expanded";
};

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "elevenlabs-convai": ElevenLabsConvaiProps;
    }
  }
}

export {};
