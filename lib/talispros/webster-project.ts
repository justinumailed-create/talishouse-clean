/** Webster TWO. Describes a project for someone who is already registered. */
export const WEBSTER_PROJECT_AGENT_ID = "agent_5701m7n1n436fzs98pnepf37gk3q";

export const WEBSTER_ONE_PATH = "/webster";
export const WEBSTER_PROJECT_PATH = "/webster/project";

/** Opens Webster ONE and starts the call. A known FAST Code is kept on the URL. */
export function websterOneHref(code?: string | null): string {
  const params = new URLSearchParams({ call: "1" });
  const fast = code?.trim();
  if (fast) params.set("code", fast);
  return `${WEBSTER_ONE_PATH}?${params.toString()}`;
}

/** Opens the project conversation and starts the call. A code is included when known. */
export function websterProjectHref(code?: string | null): string {
  const params = new URLSearchParams({ call: "1" });
  const fast = code?.trim();
  if (fast) params.set("code", fast);
  return `${WEBSTER_PROJECT_PATH}?${params.toString()}`;
}

/**
 * Links that send someone back through registration or Webster ONE.
 * The project page is not one of them.
 */
export function isRegistrationOfferHref(href: string): boolean {
  const raw = href.trim();
  if (!raw) return false;
  let path = raw;
  if (/^https?:/i.test(raw)) {
    try {
      path = new URL(raw).pathname;
    } catch {
      return false;
    }
  }
  path = path.split("?")[0].replace(/\/+$/, "") || "/";
  if (path === WEBSTER_PROJECT_PATH) return false;
  if (path === "/webster" || path === "/talispros/webster") return true;
  if (path === "/register" || path.startsWith("/register/")) return true;
  if (path === "/talisu/reg" || path.startsWith("/talisu/reg/")) return true;
  if (path.includes("/claim-a-market")) return true;
  if (path.includes("/build-mapsite")) return true;
  return false;
}
