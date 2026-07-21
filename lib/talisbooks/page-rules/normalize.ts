import type { TalisBooksBookPage } from "../types";
import type {
  TalisBooksBrokerageCompliance,
  TalisBooksContentBlockType,
  TalisBooksImageCategory,
  TalisBooksPageContentBlock,
  TalisBooksPageRole,
  TalisBooksValidatedPage,
} from "./types";
import { TALISBOOKS_BROKERAGE_REQUIRED_FIELDS } from "./brokerage-constants";

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function parsePageRole(value: unknown): TalisBooksPageRole | null {
  if (value === "cover" || value === "agent_brokerage" || value === "property_content") {
    return value;
  }
  return null;
}

function parseImageCategory(value: unknown): TalisBooksImageCategory | null {
  if (
    value === "property" ||
    value === "agent" ||
    value === "brokerage" ||
    value === "cover" ||
    value === "other"
  ) {
    return value;
  }
  return null;
}

function parseBlockType(value: unknown): TalisBooksContentBlockType | null {
  const types: TalisBooksContentBlockType[] = [
    "cover",
    "agent",
    "brokerage",
    "property_photo",
    "property_content",
    "text",
    "image",
    "broker_logo",
    "broker_name",
    "agent_photo",
    "agent_contact",
    "headline",
    "biography",
  ];
  return types.includes(value as TalisBooksContentBlockType)
    ? (value as TalisBooksContentBlockType)
    : null;
}

function parseBlocks(content: Record<string, unknown>): TalisBooksPageContentBlock[] {
  const rawBlocks = content.blocks;
  if (!Array.isArray(rawBlocks)) {
    return [];
  }

  const blocks: TalisBooksPageContentBlock[] = [];

  for (const entry of rawBlocks) {
    const block = asRecord(entry);
    const type = parseBlockType(block.type);
    if (!type) {
      continue;
    }

    blocks.push({
      type,
      label: asString(block.label) ?? undefined,
      field: asString(block.field) ?? undefined,
      imageId: asString(block.imageId),
      imageCategory: parseImageCategory(block.imageCategory) ?? undefined,
      value: asString(block.value) ?? undefined,
    });
  }

  return blocks;
}

function fieldFromBlockType(type: TalisBooksContentBlockType): keyof TalisBooksBrokerageCompliance | null {
  switch (type) {
    case "broker_logo":
      return "brokerLogoId";
    case "broker_name":
      return "brokerName";
    case "agent_photo":
      return "agentPhotoId";
    case "agent_contact":
      return "agentContact";
    case "headline":
      return "headline";
    case "biography":
      return "biography";
    default:
      return null;
  }
}

function parseBrokerageCompliance(
  content: Record<string, unknown>,
  blocks: TalisBooksPageContentBlock[],
): TalisBooksBrokerageCompliance | null {
  const explicit = asRecord(content.brokerageCompliance);
  const agent = asRecord(content.agent);
  const brokerage = asRecord(content.brokerage);

  const compliance: TalisBooksBrokerageCompliance = {
    brokerLogoId:
      asString(explicit.brokerLogoId) ??
      asString(brokerage.logoId) ??
      asString(brokerage.logoUrl),
    brokerName:
      asString(explicit.brokerName) ??
      asString(brokerage.name) ??
      asString(brokerage.brokerName),
    agentPhotoId:
      asString(explicit.agentPhotoId) ??
      asString(agent.photoId) ??
      asString(agent.photoUrl),
    agentContact:
      asString(explicit.agentContact) ??
      asString(agent.contact) ??
      asString(agent.phone) ??
      asString(agent.email),
    headline:
      asString(explicit.headline) ??
      asString(agent.headline) ??
      asString(content.headline),
    biography:
      asString(explicit.biography) ??
      asString(agent.biography) ??
      asString(agent.bio),
  };

  for (const block of blocks) {
    const mappedField =
      (block.field as keyof TalisBooksBrokerageCompliance | undefined) ??
      fieldFromBlockType(block.type);

    if (!mappedField || !TALISBOOKS_BROKERAGE_REQUIRED_FIELDS.includes(mappedField as never)) {
      continue;
    }

    const imageValue = block.imageId ?? block.value ?? block.label;
    const textValue = block.value ?? block.label;

    if (mappedField === "brokerLogoId" || mappedField === "agentPhotoId") {
      compliance[mappedField] = compliance[mappedField] ?? asString(imageValue);
    } else {
      compliance[mappedField] = compliance[mappedField] ?? asString(textValue);
    }
  }

  const hasAny = TALISBOOKS_BROKERAGE_REQUIRED_FIELDS.some(
    (field) => compliance[field] != null && compliance[field]!.trim().length > 0,
  );

  return hasAny ? compliance : null;
}

function inferRoleFromLegacyContent(
  pageNumber: number,
  content: Record<string, unknown>,
  settings: Record<string, unknown>,
): TalisBooksPageRole | null {
  const explicit =
    parsePageRole(content.pageRole) ??
    parsePageRole(settings.pageRole) ??
    parsePageRole(content.role);

  if (explicit) {
    return explicit;
  }

  if (pageNumber === 1) {
    return "cover";
  }

  if (pageNumber === 2 || pageNumber === 3) {
    return "agent_brokerage";
  }

  return null;
}

export function normalizeBookPageForValidation(page: TalisBooksBookPage): TalisBooksValidatedPage {
  const content = asRecord(page.content);
  const settings = asRecord(page.settings);
  const blocks = parseBlocks(content);
  const pageRole = inferRoleFromLegacyContent(page.pageNumber, content, settings);

  return {
    id: page.id,
    pageNumber: page.pageNumber,
    pageRole,
    layoutSlug: asString(content.layoutSlug) ?? asString(settings.layoutSlug),
    layoutType: asString(content.layoutType) ?? asString(settings.layoutType),
    blocks,
    brokerageCompliance:
      pageRole === "agent_brokerage"
        ? parseBrokerageCompliance(content, blocks)
        : null,
    backgroundImageId: page.backgroundImageId,
    backgroundImageCategory:
      parseImageCategory(content.backgroundImageCategory) ??
      parseImageCategory(settings.backgroundImageCategory),
    isVisible: page.isVisible,
  };
}

export function normalizeBookPagesForValidation(
  pages: TalisBooksBookPage[],
): TalisBooksValidatedPage[] {
  return [...pages]
    .sort((a, b) => a.pageNumber - b.pageNumber)
    .map(normalizeBookPageForValidation);
}
