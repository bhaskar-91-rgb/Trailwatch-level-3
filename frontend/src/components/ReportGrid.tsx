import { TrailReport, ReportStatus } from "@/lib/types";
import { ReportCard } from "./ReportCard";
import { ReportCardSkeleton } from "./ReportCardSkeleton";

interface ReportGridProps {
  reports: TrailReport[];
  isLoading: boolean;
  error: string | null;
  currentAddress: string | null;
  onCorroborate: (report: TrailReport) => void;
  onDispute: (report: TrailReport) => void;
  busyAction: string | null;
  onRetry: () => void;
}

const COLUMNS: { status: ReportStatus; label: string; hint: string }[] = [
  { status: "Pending", label: "Awaiting verification", hint: "Needs corroboration" },
  { status: "Confirmed", label: "Confirmed", hint: "Verified by the crowd" },
  { status: "Disputed", label: "Disputed", hint: "Flagged as inaccurate" },
];

export function ReportGrid(props: ReportGridProps) {
  const { reports, isLoading, error, onRetry } = props;

  if (error) {
    return (
      <div className="rounded-badge border border-danger/30 bg-danger/5 px-6 py-10 text-center">
        <p className="font-display text-lg text-danger mb-1">The trail log couldn&apos;t load</p>
        <p className="text-sm text-pine-soft mb-4 max-w-md mx-auto">{error}</p>
        <button
          onClick={onRetry}
          className="rounded-badge bg-pine text-canvas px-4 py-2 text-sm font-medium hover:bg-summit transition-colors"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
      {COLUMNS.map((col) => {
        const items = reports.filter((r) => r.status === col.status);
        return (
          <div key={col.status} className="min-w-0">
            <div className="flex items-baseline justify-between mb-3 px-1">
              <h2 className="font-display text-base">{col.label}</h2>
              <span className="text-[11px] font-mono text-pine-soft/50">
                {isLoading ? "···" : items.length}
              </span>
            </div>
            <div className="flex flex-col gap-3">
              {isLoading && (
                <>
                  <ReportCardSkeleton />
                  <ReportCardSkeleton />
                </>
              )}
              {!isLoading && items.length === 0 && (
                <div className="rounded-badge border border-dashed border-contour px-4 py-8 text-center">
                  <p className="text-xs text-pine-soft/40">{col.hint}</p>
                </div>
              )}
              {!isLoading &&
                items.map((report) => (
                  <ReportCard
                    key={report.id}
                    report={report}
                    currentAddress={props.currentAddress}
                    onCorroborate={props.onCorroborate}
                    onDispute={props.onDispute}
                    busyAction={props.busyAction}
                  />
                ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
