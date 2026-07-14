import { ConditionType } from "@/lib/types";

const STYLES: Record<ConditionType, string> = {
  Clear: "bg-creek/10 text-creek border-creek/30",
  Washout: "bg-danger/10 text-danger border-danger/30",
  Closure: "bg-danger/10 text-danger border-danger/30",
  Wildlife: "bg-blaze/10 text-blaze border-blaze/30",
  Overgrowth: "bg-granite/10 text-granite border-granite/30",
  Flooding: "bg-danger/10 text-danger border-danger/30",
};

const ICONS: Record<ConditionType, string> = {
  Clear: "✓",
  Washout: "⚠",
  Closure: "⛔",
  Wildlife: "🐾",
  Overgrowth: "🌿",
  Flooding: "≈",
};

export function ConditionBadge({ condition }: { condition: ConditionType }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-mono tracking-wide uppercase ${STYLES[condition]}`}
    >
      <span aria-hidden>{ICONS[condition]}</span>
      {condition}
    </span>
  );
}
