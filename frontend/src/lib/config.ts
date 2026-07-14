export const NETWORK_PASSPHRASE =
  process.env.NEXT_PUBLIC_NETWORK_PASSPHRASE ?? "Test SDF Network ; September 2015";

export const RPC_URL =
  process.env.NEXT_PUBLIC_SOROBAN_RPC_URL ?? "https://soroban-testnet.stellar.org";

export const TRAIL_REGISTRY_CONTRACT_ID =
  process.env.NEXT_PUBLIC_TRAIL_REGISTRY_CONTRACT_ID ?? "";

export const VERIFIER_REPUTATION_CONTRACT_ID =
  process.env.NEXT_PUBLIC_VERIFIER_REPUTATION_CONTRACT_ID ?? "";

export const REWARD_TOKEN_CONTRACT_ID =
  process.env.NEXT_PUBLIC_REWARD_TOKEN_CONTRACT_ID ?? "";

export const EXPLORER_TX_URL = (hash: string) =>
  `https://stellar.expert/explorer/testnet/tx/${hash}`;

export const EXPLORER_CONTRACT_URL = (id: string) =>
  `https://stellar.expert/explorer/testnet/contract/${id}`;

export function isConfigured(): boolean {
  return Boolean(TRAIL_REGISTRY_CONTRACT_ID && VERIFIER_REPUTATION_CONTRACT_ID);
}
