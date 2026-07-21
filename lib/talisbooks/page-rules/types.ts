import type { TalisBooksPageRuleCode } from "./constants";

export type TalisBooksPageRole = "cover" | "agent_brokerage" | "property_content";

export type TalisBooksContentBlockType =
  | "cover"
  | "agent"
  | "brokerage"
  | "property_photo"
  | "property_content"
  | "text"
  | "image"
  | "broker_logo"
  | "broker_name"
  | "agent_photo"
  | "agent_contact"
  | "headline"
  | "biography";

export type TalisBooksImageCategory =
  | "property"
  | "agent"
  | "brokerage"
  | "cover"
  | "other";

/** Brokerage compliance payload required on pages 2, 3, and the final page. */
export interface TalisBooksBrokerageCompliance {
  brokerLogoId?: string | null;
  brokerName?: string | null;
  agentPhotoId?: string | null;
  agentContact?: string | null;
  headline?: string | null;
  biography?: string | null;
}

export interface TalisBooksPageContentBlock {
  type: TalisBooksContentBlockType;
  label?: string;
  /** Compliance field key when stored as a typed block. */
  field?: string;
  imageId?: string | null;
  imageCategory?: TalisBooksImageCategory;
  value?: string;
}

export interface TalisBooksValidatedPage {
  id?: string;
  pageNumber: number;
  pageRole: TalisBooksPageRole | null;
  layoutSlug?: string | null;
  layoutType?: string | null;
  blocks: TalisBooksPageContentBlock[];
  brokerageCompliance: TalisBooksBrokerageCompliance | null;
  backgroundImageId?: string | null;
  backgroundImageCategory?: TalisBooksImageCategory | null;
  isVisible?: boolean;
}

export interface TalisBooksPageRuleViolation {
  code: TalisBooksPageRuleCode;
  message: string;
  pageNumber?: number;
}

export interface TalisBooksPageRulesValidationResult {
  valid: boolean;
  violations: TalisBooksPageRuleViolation[];
}

export interface TalisBooksPublishValidationResult extends TalisBooksPageRulesValidationResult {
  pageCount: number;
}
