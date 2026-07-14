"use client";

import { useEffect, useState } from "react";
import { HikerStats } from "@/lib/types";
import { getHikerStats } from "@/lib/soroban";
import { stroopsToXlm } from "@/lib/format";

const TRUST_COLOR: Record<HikerStats["trustLabel"], string> = {
  Unverified: "text-pine-soft/60",
  Reliable: "text-blaze",
  "Trusted Scout": "text-creek",
  "Trail Guardian": "text-ember",
};

export function ReputationPanel({ address }: { address: string }) {
  const [stats, setStats] = useState<HikerStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);
    getHikerStats(address)
      .then((s) => {
        if (!cancelled) setStats(s);
      })
      .catch(() => {
        if (!cancelled) setError("Couldn't load your trust score right now.");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [address]);

  return (
    <div className="rounded-badge border border-contour bg-white p-4 card-edge">
      <p className="font-mono text-[11px] tracking-widest uppercase text-pine-soft/50 mb-3">
        Your trail trust score
      </p>

      {isLoading && (
        <div className="animate-pulse space-y-2">
          <div className="h-6 bg-contour/50 rounded w-1/2" />
          <div className="h-3 bg-contour/30 rounded w-3/4" />
        </div>
      )}

      {error && <p className="text-sm text-danger">{error}</p>}

      {stats && !isLoading && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className={`font-display text-xl ${TRUST_COLOR[stats.trustLabel]}`}>
              {stats.trustLabel}
            </p>
            <p className="text-[11px] text-pine-soft/50">score {stats.accuracyScore}/1000</p>
          </div>
          <div className="text-right">
            <p className="font-mono text-lg">{stats.reportsConfirmed}</p>
            <p className="text-[11px] text-pine-soft/50">reports confirmed</p>
          </div>
          <div>
            <p className="font-mono text-lg text-blaze">
              {stroopsToXlm(stats.totalStakeEarned)} <span className="text-xs">XLM</span>
            </p>
            <p className="text-[11px] text-pine-soft/50">rewards earned</p>
          </div>
          <div className="text-right">
            <p className="font-mono text-lg text-danger/70">{stats.reportsRefuted}</p>
            <p className="text-[11px] text-pine-soft/50">reports refuted</p>
          </div>
        </div>
      )}
    </div>
  );
}
