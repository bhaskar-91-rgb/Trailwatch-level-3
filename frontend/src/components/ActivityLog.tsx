"use client";

import { ActivityEvent } from "@/lib/types";
import { formatAddress, formatRelativeTime } from "@/lib/format";
import { EXPLORER_TX_URL } from "@/lib/config";

const KIND_LABEL: Record<ActivityEvent["kind"], string> = {
  ReportFiled: "FILED",
  Corroborated: "CORROBORATED",
  Disputed: "DISPUTED",
  ReportConfirmed: "CONFIRMED",
  ReportRefuted: "REFUTED",
};

const KIND_COLOR: Record<ActivityEvent["kind"], string> = {
  ReportFiled: "text-ember",
  Corroborated: "text-creek",
  Disputed: "text-danger",
  ReportConfirmed: "text-creek",
  ReportRefuted: "text-danger",
};

export function ActivityLog({ events }: { events: ActivityEvent[] }) {
  return (
    <aside className="rounded-badge border border-contour bg-summit text-canvas overflow-hidden card-edge">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <p className="font-mono text-[11px] tracking-widest uppercase text-ember">
          Ranger Log — Live
        </p>
        <span className="flex items-center gap-1.5 text-[11px] font-mono text-canvas/50">
          <span className="w-1.5 h-1.5 rounded-full bg-creek status-dot" />
          streaming
        </span>
      </div>

      <div className="trail-scroll max-h-[420px] overflow-y-auto divide-y divide-white/5">
        {events.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <p className="text-sm text-canvas/50 font-mono">No activity logged this session.</p>
            <p className="text-xs text-canvas/30 mt-1">
              File or corroborate a report to see it land here, live.
            </p>
          </div>
        ) : (
          events.map((event) => (
            <div key={event.id} className="px-4 py-3 flex items-start gap-3 animate-stamp">
              <span
                className={`font-mono text-[10px] font-semibold tracking-wider mt-0.5 w-24 flex-shrink-0 ${KIND_COLOR[event.kind]}`}
              >
                {KIND_LABEL[event.kind]}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-canvas/90 truncate">{event.detail}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[11px] font-mono text-canvas/40">
                    {formatAddress(event.actor)}
                  </span>
                  <span className="text-[11px] text-canvas/30">
                    {formatRelativeTime(event.timestamp)}
                  </span>
                  {event.txHash && (
                    <a
                      href={EXPLORER_TX_URL(event.txHash)}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] font-mono text-blaze hover:text-ember transition-colors"
                    >
                      view tx ↗
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </aside>
  );
}
