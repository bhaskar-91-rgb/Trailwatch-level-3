"use client";

import { useState, FormEvent } from "react";
import { ConditionType } from "@/lib/types";

interface FileReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (
    trailId: string,
    condition: ConditionType,
    note: string,
    stakeXlm: string
  ) => Promise<void>;
}

const CONDITIONS: ConditionType[] = [
  "Clear",
  "Washout",
  "Closure",
  "Wildlife",
  "Overgrowth",
  "Flooding",
];

export function FileReportModal({ isOpen, onClose, onSubmit }: FileReportModalProps) {
  const [trailId, setTrailId] = useState("");
  const [condition, setCondition] = useState<ConditionType>("Clear");
  const [note, setNote] = useState("");
  const [stake, setStake] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const validate = (): string | null => {
    if (trailId.trim().length < 3) return "Give the trail an identifier, e.g. 'PCT-mile-482'.";
    if (note.trim().length < 10) return "Add a bit more detail about the condition.";
    const stakeNum = Number(stake);
    if (!stake || Number.isNaN(stakeNum) || stakeNum <= 0)
      return "Stake must be a positive number of XLM.";
    return null;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      await onSubmit(trailId.trim(), condition, note.trim(), stake.trim());
      setTrailId("");
      setNote("");
      setStake("");
      setCondition("Clear");
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't file this report. Try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-summit/40 backdrop-blur-sm px-0 sm:px-4"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-md bg-canvas rounded-t-2xl sm:rounded-badge border border-contour shadow-xl p-6 sm:p-7 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-5">
          <div>
            <h2 className="font-display text-2xl">File a trail report</h2>
            <p className="text-sm text-pine-soft/70 mt-1">
              Your stake is escrowed until the crowd verifies it.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-pine-soft/40 hover:text-pine text-xl leading-none px-1"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Field label="Trail identifier">
            <input
              value={trailId}
              onChange={(e) => setTrailId(e.target.value)}
              placeholder="PCT-mile-482"
              maxLength={60}
              className="input"
            />
          </Field>

          <Field label="Condition">
            <select
              value={condition}
              onChange={(e) => setCondition(e.target.value as ConditionType)}
              className="input"
            >
              {CONDITIONS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Details">
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Describe what you saw — location markers, severity, how to route around it."
              rows={4}
              maxLength={500}
              className="input resize-none"
            />
          </Field>

          <Field label="Stake (XLM)">
            <input
              value={stake}
              onChange={(e) => setStake(e.target.value)}
              placeholder="10"
              inputMode="decimal"
              className="input font-mono"
            />
          </Field>

          {error && (
            <p className="text-sm text-danger bg-danger/5 border border-danger/20 rounded-badge px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-badge bg-pine text-canvas py-2.5 text-sm font-medium hover:bg-summit transition-colors disabled:opacity-50 disabled:cursor-wait mt-1"
          >
            {isSubmitting ? "Staking & filing…" : "File report & stake"}
          </button>
        </form>
      </div>

      <style jsx>{`
        .input {
          width: 100%;
          border-radius: 2px;
          border: 1px solid #c9c2ac;
          background: white;
          padding: 0.6rem 0.75rem;
          font-size: 0.875rem;
        }
        .input:focus {
          outline: 2px solid #d9622b;
          outline-offset: 1px;
        }
      `}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-mono uppercase tracking-wide text-pine-soft/60 mb-1.5 block">
        {label}
      </span>
      {children}
    </label>
  );
}
