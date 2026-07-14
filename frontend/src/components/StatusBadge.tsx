import { ReportStatus } from "@/lib/types";

const STYLES: Record<ReportStatus, string> = {
  Pending: "bg-white text-pine-soft border-contour",
  Confirmed: "bg-creek/10 text-creek border-creek/30",
  Disputed: "bg-danger/10 text-danger border-danger/30",
};

export function StatusBadge({ status }: { status: ReportStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-mono tracking-wide uppercase ${STYLES[status]}`}
    >
      {status}
    </span>
  );
}
