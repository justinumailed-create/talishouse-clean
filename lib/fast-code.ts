"use client";

export const ADMIN_FAST_CODE = "ADMIN123";
export const ADMIN_SESSION_COOKIE = "admin_session";

const isBrowser = () => typeof window !== "undefined";

export const normalizeFastCode = (code: string) => (code || "").trim().toUpperCase();

const setCookie = (name: string, value: string, maxAgeSeconds: number) => {
  if (!isBrowser()) return;

  const secure = window.location.protocol === "https:" ? " Secure;" : "";
  document.cookie = `${name}=${value}; path=/; max-age=${maxAgeSeconds}; SameSite=Lax;${secure}`;
};

const clearCookie = (name: string) => {
  if (!isBrowser()) return;
  document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
};

const getCookie = (name: string): string | null => {
  if (!isBrowser()) return null;

  const cookie = document.cookie
    .split(";")
    .map((value) => value.trim())
    .find((value) => value.startsWith(`${name}=`));

  return cookie ? cookie.slice(name.length + 1) : null;
};

export const setFastCode = (code: string) => {
  if (!isBrowser()) return;
  localStorage.setItem("fast_code", normalizeFastCode(code));
};

export const getFastCode = (): string | null => {
  if (!isBrowser()) return null;
  return localStorage.getItem("fast_code");
};

export const clearFastCode = () => {
  if (!isBrowser()) return;
  localStorage.removeItem("fast_code");
  localStorage.removeItem("role");
  localStorage.removeItem("associateId");
};

export const setAdminSession = () => {
  if (!isBrowser()) return;

  localStorage.setItem("fast_code", ADMIN_FAST_CODE);
  localStorage.setItem("role", "admin");
  localStorage.removeItem("associateId");
  setCookie(ADMIN_SESSION_COOKIE, ADMIN_FAST_CODE, 60 * 60 * 24);
};

export const clearAdminSession = () => {
  clearFastCode();
  clearCookie(ADMIN_SESSION_COOKIE);
};

export const hasAdminSession = (): boolean => {
  const cookieValue = getCookie(ADMIN_SESSION_COOKIE);
  const localFastCode = getFastCode();

  return cookieValue === ADMIN_FAST_CODE && localFastCode === ADMIN_FAST_CODE;
};

export const isValidAdminFastCode = (code: string): boolean => {
  return normalizeFastCode(code) === ADMIN_FAST_CODE;
};

export const isAuthorized = (): boolean => {
  const code = getFastCode();
  return !!code && code.trim() !== "";
};

export const isSuperAdmin = (): boolean => {
  return getFastCode() === ADMIN_FAST_CODE;
};

export const getRole = (): "admin" | "associate" | null => {
  if (!isAuthorized()) return null;
  return isSuperAdmin() ? "admin" : "associate";
};
