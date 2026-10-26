"use client";

import { useEffect, useRef } from "react";
import { logoutAdminAction, touchAdminActivityAction } from "@/app/admin/actions";
import { clearAdminSession } from "@/lib/fast-code";
import {
  ADMIN_ACTIVITY_EVENTS,
  ADMIN_IDLE_HEARTBEAT_MS,
  ADMIN_IDLE_LOGIN_PATH,
  ADMIN_IDLE_LOGOUT_STORAGE_KEY,
  ADMIN_LAST_ACTIVE_STORAGE_KEY,
  isAdminIdle,
} from "@/lib/admin-idle";

function readSharedLastActive(): number {
  try {
    return Number(localStorage.getItem(ADMIN_LAST_ACTIVE_STORAGE_KEY)) || 0;
  } catch {
    return 0;
  }
}

function writeShared(key: string, value: number) {
  try {
    localStorage.setItem(key, String(value));
  } catch {
    // Storage blocked: this tab still times out on its own.
  }
}

/**
 * Signs a Global / granted admin out after 1 minute without mouse, key, touch
 * or scroll input. Activity in any open admin tab keeps every tab alive
 * (shared localStorage timestamp); the first tab to time out signs out on the
 * server and tells the others to follow.
 */
export default function AdminIdleLogout({ enabled }: { enabled: boolean }) {
  const lastActive = useRef(0);
  const lastWrite = useRef(0);
  const lastBeat = useRef(0);
  const loggingOut = useRef(false);

  useEffect(() => {
    if (!enabled) return;
    const start = Date.now();
    lastActive.current = start;
    lastWrite.current = start;
    lastBeat.current = start;
    loggingOut.current = false;
    writeShared(ADMIN_LAST_ACTIVE_STORAGE_KEY, start);

    function goToLogin() {
      window.location.replace(ADMIN_IDLE_LOGIN_PATH);
    }

    async function signOut() {
      if (loggingOut.current) return;
      loggingOut.current = true;
      writeShared(ADMIN_IDLE_LOGOUT_STORAGE_KEY, Date.now());
      try {
        await logoutAdminAction();
      } catch {
        // Middleware still ends the session once the activity cookie lapses.
      }
      clearAdminSession();
      goToLogin();
    }

    function onActivity() {
      if (loggingOut.current) return;
      const now = Date.now();
      lastActive.current = now;
      if (now - lastWrite.current >= 1_000) {
        lastWrite.current = now;
        writeShared(ADMIN_LAST_ACTIVE_STORAGE_KEY, now);
      }
      if (now - lastBeat.current >= ADMIN_IDLE_HEARTBEAT_MS) {
        lastBeat.current = now;
        void touchAdminActivityAction().catch(() => {});
      }
    }

    function check() {
      if (loggingOut.current) return;
      const latest = Math.max(lastActive.current, readSharedLastActive());
      if (isAdminIdle(latest, Date.now())) void signOut();
    }

    function onStorage(event: StorageEvent) {
      // Another tab timed out and signed out: follow it to the login page.
      if (event.key === ADMIN_IDLE_LOGOUT_STORAGE_KEY && event.newValue && !loggingOut.current) {
        loggingOut.current = true;
        clearAdminSession();
        goToLogin();
      }
    }

    const opts: AddEventListenerOptions = { capture: true, passive: true };
    for (const name of ADMIN_ACTIVITY_EVENTS) window.addEventListener(name, onActivity, opts);
    window.addEventListener("storage", onStorage);
    document.addEventListener("visibilitychange", check);
    const timer = window.setInterval(check, 1_000);
    return () => {
      for (const name of ADMIN_ACTIVITY_EVENTS) window.removeEventListener(name, onActivity, opts);
      window.removeEventListener("storage", onStorage);
      document.removeEventListener("visibilitychange", check);
      window.clearInterval(timer);
    };
  }, [enabled]);

  return null;
}
