import { useEffect, useState } from "react";
import { fetchKitchenDisplay } from "../api/fetchKitchenDisplay";
import type { AuthSession } from "../types/auth";
import type { KitchenDisplayResponse } from "../types/kitchenDisplay";

const POLL_INTERVAL_MS = 5000;

type Options = {
  onSessionRefresh?: (session: AuthSession) => void;
  onAuthFailure?: () => void;
};

export function useKitchenDisplayPolling(
  session: AuthSession | null,
  options: Options = {}
) {
  const [data, setData] = useState<KitchenDisplayResponse | null>(null);
  const [isLoading, setIsLoading] = useState(session != null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (session == null) {
      setData(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;

    async function load() {
      try {
        const response = await fetchKitchenDisplay(session);

        if (cancelled) {
          return;
        }

        if (response.nextSession != null) {
          options.onSessionRefresh?.(response.nextSession);
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
          options.onAuthFailure?.();
        }
      } finally {
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
  }, [
    options.onAuthFailure,
    options.onSessionRefresh,
    session?.accessToken,
    session?.refreshToken
  ]);

  return { data, isLoading, error };
}
