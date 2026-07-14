"use client";

import { useCallback, useMemo, useState } from "react";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { ActivityLog } from "@/components/ActivityLog";
import { ReportGrid } from "@/components/ReportGrid";
import { FileReportModal } from "@/components/FileReportModal";
import { ReputationPanel } from "@/components/ReputationPanel";
import { ToastStack, Toast } from "@/components/Toast";
import { useWallet } from "@/hooks/useWallet";
import { useReports } from "@/hooks/useReports";
import { useActivityFeed } from "@/hooks/useActivityFeed";
import { TrailReport, ConditionType } from "@/lib/types";
import { stroopsToXlm, xlmToStroops } from "@/lib/format";
import { fileReport, corroborate, disputeReport } from "@/lib/soroban";

export default function HomePage() {
  const wallet = useWallet();
  const { reports, isLoading, error, refresh } = useReports();
  const { events, pushEvent } = useActivityFeed();

  const [isFileModalOpen, setIsFileModalOpen] = useState(false);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toast: Omit<Toast, "id">) => {
    setToasts((prev) => [...prev, { ...toast, id: `${Date.now()}-${Math.random()}` }]);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const stats = useMemo(() => {
    const pending = reports.filter((r) => r.status === "Pending");
    const confirmed = reports.filter((r) => r.status === "Confirmed");
    const staked = pending.reduce((sum, r) => sum + BigInt(r.stake), 0n);
    return {
      pendingCount: pending.length,
      confirmedCount: confirmed.length,
      totalStaked: stroopsToXlm(staked.toString()),
    };
  }, [reports]);

  const handleFileReport = async (
    trailId: string,
    condition: ConditionType,
    note: string,
    stakeXlm: string
  ) => {
    if (!wallet.address) {
      addToast({ type: "error", message: "Connect your wallet first to file a report." });
      return;
    }
    try {
      const stakeStroops = xlmToStroops(stakeXlm);
      const txHash = await fileReport(wallet.address, trailId, condition, note, stakeStroops);
      addToast({
        type: "success",
        message: `Report filed for ${trailId} — ${stakeXlm} XLM staked.`,
        txHash,
      });
      pushEvent({
        kind: "ReportFiled",
        reportId: -1,
        actor: wallet.address,
        detail: `Filed ${condition} report on ${trailId}`,
        timestamp: Math.floor(Date.now() / 1000),
        txHash,
      });
      refresh();
    } catch (err) {
      addToast({
        type: "error",
        message: err instanceof Error ? err.message : "Couldn't file this report.",
      });
      throw err;
    }
  };

  const handleCorroborate = async (report: TrailReport) => {
    if (!wallet.address) return;
    setBusyAction(`${report.id}-corroborate`);
    try {
      const txHash = await corroborate(report.id, wallet.address);
      addToast({ type: "success", message: `Corroborated report on ${report.trailId}.`, txHash });
      pushEvent({
        kind: "Corroborated",
        reportId: report.id,
        actor: wallet.address,
        detail: `Corroborated ${report.trailId}`,
        timestamp: Math.floor(Date.now() / 1000),
        txHash,
      });
      refresh();
    } catch (err) {
      addToast({
        type: "error",
        message: err instanceof Error ? err.message : "Couldn't corroborate this report.",
      });
    } finally {
      setBusyAction(null);
    }
  };

  const handleDispute = async (report: TrailReport) => {
    if (!wallet.address) return;
    setBusyAction(`${report.id}-dispute`);
    try {
      const txHash = await disputeReport(report.id, wallet.address);
      addToast({ type: "success", message: `Disputed report on ${report.trailId}.`, txHash });
      pushEvent({
        kind: "Disputed",
        reportId: report.id,
        actor: wallet.address,
        detail: `Disputed ${report.trailId}`,
        timestamp: Math.floor(Date.now() / 1000),
        txHash,
      });
      refresh();
    } catch (err) {
      addToast({
        type: "error",
        message: err instanceof Error ? err.message : "Couldn't dispute this report.",
      });
    } finally {
      setBusyAction(null);
    }
  };

  return (
    <main className="min-h-screen">
      <Header
        address={wallet.address}
        isConnecting={wallet.isConnecting}
        onConnect={wallet.connect}
        onDisconnect={wallet.disconnect}
      />

      <Hero
        pendingCount={stats.pendingCount}
        totalStaked={stats.totalStaked}
        confirmedCount={stats.confirmedCount}
      />

      <section className="mx-auto max-w-6xl px-5 sm:px-8 py-8 sm:py-10">
        <div className="grid lg:grid-cols-[1fr,320px] gap-8">
          <div>
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display text-xl">The trail log</h2>
              <button
                onClick={() => setIsFileModalOpen(true)}
                disabled={!wallet.address}
                title={!wallet.address ? "Connect your wallet to file a report" : undefined}
                className="rounded-badge bg-blaze text-white px-4 py-2 text-sm font-medium hover:bg-blaze/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                + File a report
              </button>
            </div>

            <ReportGrid
              reports={reports}
              isLoading={isLoading}
              error={error}
              currentAddress={wallet.address}
              onCorroborate={handleCorroborate}
              onDispute={handleDispute}
              busyAction={busyAction}
              onRetry={refresh}
            />
          </div>

          <div className="flex flex-col gap-5">
            {wallet.address && <ReputationPanel address={wallet.address} />}
            <ActivityLog events={events} />
          </div>
        </div>
      </section>

      <FileReportModal
        isOpen={isFileModalOpen}
        onClose={() => setIsFileModalOpen(false)}
        onSubmit={handleFileReport}
      />
      <ToastStack toasts={toasts} onDismiss={dismissToast} />

      {wallet.error && (
        <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:w-80 z-50">
          <div className="rounded-badge border border-danger/30 bg-white px-4 py-3 shadow-lg flex items-start gap-2">
            <span className="text-danger text-lg leading-none mt-0.5">!</span>
            <div className="flex-1">
              <p className="text-sm text-pine">{wallet.error}</p>
            </div>
            <button
              onClick={wallet.dismissError}
              className="text-pine-soft/40 hover:text-pine text-sm"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
