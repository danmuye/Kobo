import { useEffect, useRef } from "react";
import { useAuthStore, SESSION_TIMEOUT_MS } from "@/store/auth";
import { signOutUser } from "@/services/firebase/auth";

const ACTIVITY_EVENTS = ["mousedown", "keydown", "touchstart", "scroll", "focus"];

export function useSessionTimeout() {
  const status = useAuthStore((s) => s.status);
  const sessionExpiresAt = useAuthStore((s) => s.sessionExpiresAt);
  const touchActivity = useAuthStore((s) => s.touchActivity);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (status !== "authenticated") return;

    const handler = () => {
      touchActivity();
    };

    ACTIVITY_EVENTS.forEach((event) => window.addEventListener(event, handler));
    handler();

    return () => {
      ACTIVITY_EVENTS.forEach((event) => window.removeEventListener(event, handler));
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [status, touchActivity]);

  useEffect(() => {
    if (status !== "authenticated" || !sessionExpiresAt) return;

    const remaining = Math.max(0, sessionExpiresAt - Date.now());

    timerRef.current = setTimeout(async () => {
      try {
        await signOutUser();
      } catch {
        // Silent failure on auto-logout
      }
    }, remaining);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [status, sessionExpiresAt]);
}
