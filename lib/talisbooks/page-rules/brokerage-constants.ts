/** Mandatory brokerage compliance fields on pages 2, 3, and the final page. */
export const TALISBOOKS_BROKERAGE_REQUIRED_FIELDS = [
  "brokerLogoId",
  "brokerName",
  "agentPhotoId",
  "agentContact",
  "headline",
  "biography",
] as const;

export type TalisBooksBrokerageComplianceField =
  (typeof TALISBOOKS_BROKERAGE_REQUIRED_FIELDS)[number];

export const TALISBOOKS_BROKERAGE_FIELD_LABELS: Record<
  TalisBooksBrokerageComplianceField,
  string
> = {
  brokerLogoId: "Broker logo",
  brokerName: "Broker name",
  agentPhotoId: "Agent photo",
  agentContact: "Agent contact information",
  headline: "Headline",
  biography: "Biography",
};

/** Pages that require full brokerage compliance. */
export const TALISBOOKS_BROKERAGE_COMPLIANCE_PAGES = [2, 3] as const;
