"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { listReports } from "@/lib/soroban";
import { TrailReport, ContractCallError } from "@/lib/types";
import { isConfigured } from "@/lib/config";

interface ReportsState {
  reports: TrailReport[];
  isLoading: boolean;
  error: string | null;
}

const POLL_INTERVAL_MS = 8000;

export function useReports() {
  const [state, setState] = useState<ReportsState>({
    reports: [],
    isLoading: true,
    error: null,
  });
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchReports = useCallback(async (showSpinner: boolean) => {
    if (!isConfigured()) {
      setState((s) => ({
        ...s,
        isLoading: false,
        error:
          "Contract addresses aren't configured yet. Set NEXT_PUBLIC_TRAIL_REGISTRY_CONTRACT_ID in your environment.",
      }));
      return;
    }
    setState((s) => ({ ...s, isLoading: showSpinner, error: null }));
    try {
      const result = await listReports(0, 50);
      setState({ reports: result.reverse(), isLoading: false, error: null });
    } catch (err) {
      const message =
        err instanceof ContractCallError
          ? err.message
          : "Couldn't load trail reports. Retrying shortly.";
      setState((s) => ({ ...s, isLoading: false, error: message }));
    }
  }, []);

  useEffect(() => {
    fetchReports(true);
    intervalRef.current = setInterval(() => fetchReports(false), POLL_INTERVAL_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchReports]);

  const refresh = useCallback(() => fetchReports(false), [fetchReports]);

  return { ...state, refresh };
}
