"use client";

import {
  ADMIN_FAST_CODE,
  ADMIN_SESSION_COOKIE,
  isAuthorizedAdminFastCode,
} from "./admin-constants";

export { ADMIN_FAST_CODE, ADMIN_SESSION_COOKIE };

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

export const setAdminSession = (code: string = ADMIN_FAST_CODE) => {
  if (!isBrowser()) return;

  const sessionCode = normalizeFastCode(code);
  if (!isAuthorizedAdminFastCode(sessionCode)) return;

  localStorage.setItem("fast_code", sessionCode);
  localStorage.setItem("role", "admin");
  localStorage.removeItem("associateId");
  setCookie(ADMIN_SESSION_COOKIE, sessionCode, 60 * 60 * 24);
};

export const clearAdminSession = () => {
  clearFastCode();
  clearCookie(ADMIN_SESSION_COOKIE);
};

export const hasAdminSession = (): boolean => {
  const cookieValue = getCookie(ADMIN_SESSION_COOKIE);
  const localFastCode = getFastCode();

  if (!isAuthorizedAdminFastCode(cookieValue) || !isAuthorizedAdminFastCode(localFastCode)) {
    return false;
  }

  return normalizeFastCode(cookieValue || "") === normalizeFastCode(localFastCode || "");
};

export const isValidAdminFastCode = (code: string): boolean => {
  return isAuthorizedAdminFastCode(code);
};

export const isAuthorized = (): boolean => {
  const code = getFastCode();
  return !!code && code.trim() !== "";
};

export const isSuperAdmin = (): boolean => {
  return normalizeFastCode(getFastCode() || "") === ADMIN_FAST_CODE;
};

export const getRole = (): "admin" | "associate" | null => {
  if (!isAuthorized()) return null;
  return isValidAdminFastCode(getFastCode() || "") ? "admin" : "associate";
};
