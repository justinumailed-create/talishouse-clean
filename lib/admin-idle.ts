/**
 * Admin idle auto-logout (Global Admin + granted admins only — never Agent
 * Admins, Mapsite owners or other accounts). Safe for Edge middleware.
 *
 * Client: after ADMIN_IDLE_TIMEOUT_MS with no mouse, key, touch or scroll
 * event in any open /admin tab, the tab calls the real logout server action
 * and lands on /admin/login?idle=1 ("Signed out after 1 minute of inactivity").
 *
 * Server cap: a short-lived httpOnly `admin_active` cookie is set at login and
 * slid forward on every /admin request plus a throttled activity heartbeat.
 * When it has lapsed, middleware clears `admin_session` on the next /admin
 * request, so a closed or sleeping tab cannot keep the session alive.
 */

/** No input for this long → signed out. */
export const ADMIN_IDLE_TIMEOUT_MS = 60_000;

/** Activity heartbeat to the server at most this often while the admin is active. */
export const ADMIN_IDLE_HEARTBEAT_MS = 15_000;

/** Server-side cap: idle timeout + heartbeat interval + grace, in seconds. */
export const ADMIN_ACTIVITY_MAX_AGE = 90;

/** httpOnly companion cookie proving recent admin activity. */
export const ADMIN_ACTIVITY_COOKIE = "admin_active";

/** Query flag on /admin/login that shows the idle sign-out notice. */
export const ADMIN_IDLE_LOGOUT_PARAM = "idle";
export const ADMIN_IDLE_LOGIN_PATH = `/admin/login?${ADMIN_IDLE_LOGOUT_PARAM}=1`;

/** localStorage keys shared by every tab (the `storage` event syncs them). */
export const ADMIN_LAST_ACTIVE_STORAGE_KEY = "talispros_admin_last_active";
export const ADMIN_IDLE_LOGOUT_STORAGE_KEY = "talispros_admin_idle_logout";

/** Events that count as activity. */
export const ADMIN_ACTIVITY_EVENTS = [
  "mousemove",
  "mousedown",
  "keydown",
  "touchstart",
  "scroll",
  "wheel",
] as const;

/** Only FAST-code admins (Global Admin, granted admins) get the idle logout. */
export function isIdleLogoutAccess(access: string | null | undefined): boolean {
  return access === "global" || access === "granted";
}

export function isAdminIdle(lastActiveMs: number, nowMs: number): boolean {
  return nowMs - lastActiveMs >= ADMIN_IDLE_TIMEOUT_MS;
}

export function adminActivityCookieOptions(maxAge: number = ADMIN_ACTIVITY_MAX_AGE) {
  return {
    path: "/",
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    maxAge,
  };
}
