export const TALISBOT_MESSAGE_TYPES = [
  "progress",
  "result",
  "assigned",
  "needs_review",
  "reply",
] as const;

export type TalisbotMessageType = (typeof TALISBOT_MESSAGE_TYPES)[number];
export type TalisbotCommentStatus = "new" | "seen" | "answered";
export type Locale = "en" | "de";

export type AdminTalisbotMessage = {
  id: string;
  type: TalisbotMessageType;
  title: string;
  body: string;
  fastCode: string | null;
  brokerage: string | null;
  prospectQueueId: string | null;
  metadata: Record<string, unknown>;
  createdBy: string;
  parentId: string | null;
  replyToCommentId: string | null;
  readAt: string | null;
  createdAt: string;
};

export type AdminTalisbotComment = {
  id: string;
  messageId: string | null;
  body: string;
  author: string;
  createdAt: string;
  status: TalisbotCommentStatus;
  answeredAt: string | null;
};

export type LocalizedCopy = { en: { title: string; body: string }; de: { title: string; body: string } };
