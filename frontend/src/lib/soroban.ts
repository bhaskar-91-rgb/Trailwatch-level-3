import {
  Contract,
  SorobanRpc,
  TransactionBuilder,
  BASE_FEE,
  nativeToScVal,
  scValToNative,
  Address,
  xdr,
} from "@stellar/stellar-sdk";
import {
  RPC_URL,
  NETWORK_PASSPHRASE,
  TRAIL_REGISTRY_CONTRACT_ID,
  VERIFIER_REPUTATION_CONTRACT_ID,
} from "./config";
import { signTransactionXdr } from "./wallet";
import { TrailReport, HikerStats, ContractCallError, ConditionType } from "./types";

function getServer(): SorobanRpc.Server {
  return new SorobanRpc.Server(RPC_URL, { allowHttp: RPC_URL.startsWith("http://") });
}

async function invokeContract(
  contractId: string,
  method: string,
  args: xdr.ScVal[],
  sourcePublicKey: string
): Promise<{ result: unknown; txHash: string }> {
  const server = getServer();

  let account;
  try {
    account = await server.getAccount(sourcePublicKey);
  } catch (err) {
    throw new ContractCallError(
      "We couldn't find your account on the network. Make sure your wallet is funded on testnet.",
      err
    );
  }

  const contract = new Contract(contractId);
  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(contract.call(method, ...args))
    .setTimeout(60)
    .build();

  let simulated;
  try {
    simulated = await server.simulateTransaction(tx);
  } catch (err) {
    throw new ContractCallError(
      "The network couldn't simulate this action. It may be temporarily unreachable.",
      err
    );
  }

  if (SorobanRpc.Api.isSimulationError(simulated)) {
    throw new ContractCallError(readableSimulationError(simulated.error, method), simulated.error);
  }

  const prepared = SorobanRpc.assembleTransaction(tx, simulated).build();

  let signedXdr: string;
  try {
    signedXdr = await signTransactionXdr(prepared.toXDR());
  } catch (err) {
    throw new ContractCallError("Signing was cancelled or the wallet rejected the request.", err);
  }

  const signedTx = TransactionBuilder.fromXDR(signedXdr, NETWORK_PASSPHRASE);

  let sendResponse;
  try {
    sendResponse = await server.sendTransaction(signedTx);
  } catch (err) {
    throw new ContractCallError("Failed to submit the transaction to the network.", err);
  }

  if (sendResponse.status === "ERROR") {
    throw new ContractCallError(
      "The network rejected this transaction before it could run.",
      sendResponse
    );
  }

  const txHash = sendResponse.hash;
  const finalStatus = await pollForConfirmation(server, txHash);

  if (finalStatus.status !== "SUCCESS") {
    throw new ContractCallError(
      `The transaction did not complete successfully (status: ${finalStatus.status}).`,
      finalStatus
    );
  }

  const returnValue =
    finalStatus.status === "SUCCESS" && "returnValue" in finalStatus
      ? scValToNative(finalStatus.returnValue!)
      : null;

  return { result: returnValue, txHash };
}

async function pollForConfirmation(
  server: SorobanRpc.Server,
  hash: string,
  attempts = 15,
  delayMs = 1500
): Promise<SorobanRpc.Api.GetTransactionResponse> {
  for (let i = 0; i < attempts; i++) {
    const response = await server.getTransaction(hash);
    if (response.status !== SorobanRpc.Api.GetTransactionStatus.NOT_FOUND) {
      return response;
    }
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }
  throw new ContractCallError(
    "Timed out waiting for confirmation. Check the explorer link for final status."
  );
}

function readableSimulationError(error: string, method: string): string {
  if (error.includes("InvalidState") || error.includes("#4")) {
    return "This report has already been settled — someone else's confirmation or dispute closed it out.";
  }
  if (error.includes("AlreadyVoted") || error.includes("#7")) {
    return "You've already weighed in on this report.";
  }
  if (error.includes("SelfVote") || error.includes("#8")) {
    return "You can't corroborate or dispute your own report.";
  }
  if (error.includes("InvalidStake") || error.includes("#6")) {
    return "Stake amount must be greater than zero.";
  }
  if (error.includes("ReportNotFound") || error.includes("#3")) {
    return "That report could not be found.";
  }
  return `The ${method.replace(/_/g, " ")} action could not be completed. ${error.slice(0, 140)}`;
}

async function readContract(
  contractId: string,
  method: string,
  args: xdr.ScVal[]
): Promise<unknown> {
  const server = getServer();
  const dummySource = "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF";
  const account = await server
    .getAccount(dummySource)
    .catch(async () => new (await import("@stellar/stellar-sdk")).Account(dummySource, "0"));

  const contract = new Contract(contractId);
  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(contract.call(method, ...args))
    .setTimeout(30)
    .build();

  const simulated = await server.simulateTransaction(tx);

  if (SorobanRpc.Api.isSimulationError(simulated)) {
    throw new ContractCallError(`Could not read ${method} from the contract.`, simulated.error);
  }
  if (!simulated.result) return null;
  return scValToNative(simulated.result.retval);
}

// ---------- TrailRegistry read/write helpers ----------

export async function fileReport(
  reporterAddress: string,
  trailId: string,
  condition: ConditionType,
  note: string,
  stakeStroops: bigint
): Promise<string> {
  const args = [
    new Address(reporterAddress).toScVal(),
    nativeToScVal(trailId, { type: "string" }),
    xdr.ScVal.scvVec([nativeToScVal(condition, { type: "symbol" })]),
    nativeToScVal(note, { type: "string" }),
    nativeToScVal(stakeStroops, { type: "i128" }),
  ];
  const { txHash } = await invokeContract(
    TRAIL_REGISTRY_CONTRACT_ID,
    "file_report",
    args,
    reporterAddress
  );
  return txHash;
}

export async function corroborate(reportId: number, voterAddress: string): Promise<string> {
  const args = [nativeToScVal(reportId, { type: "u32" }), new Address(voterAddress).toScVal()];
  const { txHash } = await invokeContract(
    TRAIL_REGISTRY_CONTRACT_ID,
    "corroborate",
    args,
    voterAddress
  );
  return txHash;
}

export async function disputeReport(reportId: number, voterAddress: string): Promise<string> {
  const args = [nativeToScVal(reportId, { type: "u32" }), new Address(voterAddress).toScVal()];
  const { txHash } = await invokeContract(
    TRAIL_REGISTRY_CONTRACT_ID,
    "dispute",
    args,
    voterAddress
  );
  return txHash;
}

export async function listReports(offset: number, limit: number): Promise<TrailReport[]> {
  const args = [nativeToScVal(offset, { type: "u32" }), nativeToScVal(limit, { type: "u32" })];
  const raw = (await readContract(TRAIL_REGISTRY_CONTRACT_ID, "list_reports", args)) as any[];
  if (!raw) return [];
  return raw.map(mapRawReport);
}

export async function getHikerStats(address: string): Promise<HikerStats> {
  const args = [new Address(address).toScVal()];
  const raw = (await readContract(VERIFIER_REPUTATION_CONTRACT_ID, "get_stats", args)) as any;
  const trustLabel = (await readContract(
    VERIFIER_REPUTATION_CONTRACT_ID,
    "trust_label",
    args
  )) as string;
  return {
    reportsConfirmed: Number(raw.reports_confirmed ?? 0),
    reportsRefuted: Number(raw.reports_refuted ?? 0),
    accuracyScore: Number(raw.accuracy_score ?? 500),
    totalStakeEarned: String(raw.total_stake_earned ?? "0"),
    trustLabel: (trustLabel as HikerStats["trustLabel"]) ?? "Reliable",
  };
}

function mapRawReport(raw: any): TrailReport {
  return {
    id: Number(raw.id),
    trailId: raw.trail_id,
    reporter: raw.reporter,
    condition: mapEnum(raw.condition) as ConditionType,
    note: raw.note,
    stake: String(raw.stake),
    confirmations: Number(raw.confirmations),
    disputes: Number(raw.disputes),
    status: mapEnum(raw.status) as TrailReport["status"],
    reportedAt: Number(raw.reported_at),
  };
}

function mapEnum(raw: unknown): string {
  if (typeof raw === "string") return raw;
  if (raw && typeof raw === "object") {
    return Object.keys(raw as object)[0] ?? "Clear";
  }
  return "Clear";
}
