import { useEffect, useEffectEvent, useRef, useState } from "react";
import { fetchKitchenDisplay } from "../api/fetchKitchenDisplay";
import { isWithinServiceHours } from "../lib/time";
import type { AuthSession } from "../types/auth";
import type { KitchenDisplayResponse } from "../types/kitchenDisplay";

const POLL_INTERVAL_MS = 5000;

type Options = {
  onSessionRefresh?: (session: AuthSession) => void;
  onAuthFailure?: () => void;
};

export function useKitchenDisplayPolling(
  session: AuthSession | null,
  options: Options = {},
) {
  const hasSession = session != null;
  const [data, setData] = useState<KitchenDisplayResponse | null>(null);
  const [isLoading, setIsLoading] = useState(hasSession);
  const [error, setError] = useState<string | null>(null);
  const sessionRef = useRef<AuthSession | null>(session);

  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  const notifySessionRefresh = useEffectEvent((nextSession: AuthSession) => {
    options.onSessionRefresh?.(nextSession);
  });

  const notifyAuthFailure = useEffectEvent(() => {
    options.onAuthFailure?.();
  });

  useEffect(() => {
    if (!hasSession) {
      setData(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;
    let inFlight = false;

    async function load() {
      const currentSession = sessionRef.current;

      if (inFlight) return;
      if (currentSession == null || !isWithinServiceHours(new Date())) {
        setIsLoading(false);
        return;
      }

      inFlight = true;
      try {
        const response = await fetchKitchenDisplay(currentSession);

        if (cancelled) {
          return;
        }

        if (response.nextSession != null) {
          sessionRef.current = response.nextSession;
          notifySessionRefresh(response.nextSession);
        }

        setData(response.data);
        setError(null);
      } catch (caught) {
        if (cancelled) {
          return;
        }

        const message =
          caught instanceof Error ? caught.message : "Unknown error";

        setError(message);

        if (message.includes("401")) {
          notifyAuthFailure();
        }
      } finally {
        inFlight = false;
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void load();
    const timer = window.setInterval(() => {
      void load();
    }, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [hasSession]);

  return { data, isLoading, error };
}
