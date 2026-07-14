import { TrailReport } from "@/lib/types";
import { stroopsToXlm, formatAddress, formatRelativeTime } from "@/lib/format";
import { StatusBadge } from "./StatusBadge";
import { ConditionBadge } from "./ConditionBadge";

interface ReportCardProps {
  report: TrailReport;
  currentAddress: string | null;
  onCorroborate: (report: TrailReport) => void;
  onDispute: (report: TrailReport) => void;
  busyAction: string | null;
}

export function ReportCard({
  report,
  currentAddress,
  onCorroborate,
  onDispute,
  busyAction,
}: ReportCardProps) {
  const isReporter = currentAddress === report.reporter;
  const isBusy = (action: string) => busyAction === `${report.id}-${action}`;
  const canVote = report.status === "Pending" && currentAddress && !isReporter;

  return (
    <article className="rounded-badge border border-contour bg-white p-4 card-edge flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-display text-lg leading-snug">{report.trailId}</h3>
        <StatusBadge status={report.status} />
      </div>

      <ConditionBadge condition={report.condition} />

      <p className="text-sm text-pine-soft leading-relaxed line-clamp-3">{report.note}</p>

      <div className="flex items-baseline justify-between mt-1">
        <span className="font-mono text-lg text-blaze font-medium">
          {stroopsToXlm(report.stake)} <span className="text-xs text-blaze/60">XLM staked</span>
        </span>
        <span className="text-[11px] font-mono text-pine-soft/50">
          #{report.id.toString().padStart(3, "0")}
        </span>
      </div>

      <div className="flex gap-4 text-xs font-mono text-pine-soft/60">
        <span>✓ {report.confirmations} confirm</span>
        <span>✗ {report.disputes} dispute</span>
      </div>

      <div className="flex items-center justify-between text-xs text-pine-soft/60 border-t border-contour pt-3">
        <span>
          Reporter <span className="font-mono">{formatAddress(report.reporter)}</span>
        </span>
        <span>{formatRelativeTime(report.reportedAt)}</span>
      </div>

      {canVote && (
        <div className="flex gap-2 mt-1">
          <ActionButton
            label="Corroborate"
            variant="primary"
            busy={isBusy("corroborate")}
            onClick={() => onCorroborate(report)}
          />
          <ActionButton
            label="Dispute"
            variant="ghost-danger"
            busy={isBusy("dispute")}
            onClick={() => onDispute(report)}
          />
        </div>
      )}
      {report.status === "Pending" && !currentAddress && (
        <p className="text-xs text-pine-soft/50 italic">Connect a wallet to weigh in.</p>
      )}
      {report.status === "Pending" && isReporter && (
        <p className="text-xs text-pine-soft/50 italic">
          Waiting on other hikers to corroborate or dispute your report.
        </p>
      )}
    </article>
  );
}

function ActionButton({
  label,
  variant,
  busy,
  onClick,
}: {
  label: string;
  variant: "primary" | "ghost-danger";
  busy: boolean;
  onClick: () => void;
}) {
  const base =
    "flex-1 rounded-badge px-3 py-2 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-wait";
  const styles =
    variant === "primary"
      ? "bg-pine text-canvas hover:bg-summit"
      : "border border-danger/30 text-danger hover:bg-danger/5";

  return (
    <button className={`${base} ${styles}`} disabled={busy} onClick={onClick}>
      {busy ? "Confirming…" : label}
    </button>
  );
}
