/** Pages that use the photo-and-conversation layout and bring their own header. */
export const GUIDE_CONVERSATION_PATHS = [
  "/talispros/aisha",
  "/talispros/webster",
  "/talispros/thorsten",
] as const;

export function isGuideConversationPath(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  return (GUIDE_CONVERSATION_PATHS as readonly string[]).includes(pathname);
}
