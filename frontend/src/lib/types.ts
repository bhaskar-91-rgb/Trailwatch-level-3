export type ReportStatus = "Pending" | "Confirmed" | "Disputed";

export type ConditionType =
  | "Clear"
  | "Washout"
  | "Closure"
  | "Wildlife"
  | "Overgrowth"
  | "Flooding";

export interface TrailReport {
  id: number;
  trailId: string;
  reporter: string;
  condition: ConditionType;
  note: string;
  stake: string;
  confirmations: number;
  disputes: number;
  status: ReportStatus;
  reportedAt: number;
}

export interface HikerStats {
  reportsConfirmed: number;
  reportsRefuted: number;
  accuracyScore: number;
  totalStakeEarned: string;
  trustLabel: "Unverified" | "Reliable" | "Trusted Scout" | "Trail Guardian";
}

export type ActivityEventKind =
  | "ReportFiled"
  | "Corroborated"
  | "Disputed"
  | "ReportConfirmed"
  | "ReportRefuted";

export interface ActivityEvent {
  id: string;
  kind: ActivityEventKind;
  reportId: number;
  actor: string;
  detail: string;
  timestamp: number;
  txHash?: string;
}

export class ContractCallError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = "ContractCallError";
  }
}
