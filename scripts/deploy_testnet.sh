#!/usr/bin/env bash
# Deploys VerifierReputation then TrailRegistry to Stellar Testnet,
# wires them together, and prints everything needed for the submission
# checklist.
#
# Prerequisites:
#   1. Stellar CLI installed: https://developers.stellar.org/docs/tools/cli
#   2. A funded identity: stellar keys generate deployer --network testnet --fund
#   3. Run scripts/build.sh first.
set -e

NETWORK="testnet"
DEPLOYER="deployer"

echo "==> Deploying VerifierReputation"
REPUTATION_ID=$(stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/verifier_reputation.optimized.wasm \
  --source "$DEPLOYER" \
  --network "$NETWORK")
echo "VerifierReputation deployed at: $REPUTATION_ID"

echo "==> Deploying TrailRegistry"
REGISTRY_ID=$(stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/trail_registry.optimized.wasm \
  --source "$DEPLOYER" \
  --network "$NETWORK")
echo "TrailRegistry deployed at: $REGISTRY_ID"

DEPLOYER_ADDRESS=$(stellar keys address "$DEPLOYER")

echo "==> Initializing VerifierReputation"
stellar contract invoke \
  --id "$REPUTATION_ID" --source "$DEPLOYER" --network "$NETWORK" \
  -- initialize --admin "$DEPLOYER_ADDRESS"

echo "==> Using native XLM SAC as the stake/reward token"
TOKEN_ID=$(stellar contract id asset --asset native --network "$NETWORK")
echo "Native token contract: $TOKEN_ID"

echo "==> Initializing TrailRegistry"
stellar contract invoke \
  --id "$REGISTRY_ID" --source "$DEPLOYER" --network "$NETWORK" \
  -- initialize \
  --admin "$DEPLOYER_ADDRESS" \
  --token_address "$TOKEN_ID" \
  --reputation_address "$REPUTATION_ID"

echo "==> Authorizing TrailRegistry as a trusted writer on the reputation contract"
stellar contract invoke \
  --id "$REPUTATION_ID" --source "$DEPLOYER" --network "$NETWORK" \
  -- authorize_writer --writer "$REGISTRY_ID"

echo "==> Seeding the reward pool with 50 XLM"
stellar contract invoke \
  --id "$REGISTRY_ID" --source "$DEPLOYER" --network "$NETWORK" \
  -- fund_reward_pool --admin "$DEPLOYER_ADDRESS" --amount 500000000

echo ""
echo "=========================================="
echo " DEPLOYMENT COMPLETE"
echo "=========================================="
echo "VerifierReputation: $REPUTATION_ID"
echo "TrailRegistry:      $REGISTRY_ID"
echo "Stake token (XLM):  $TOKEN_ID"
echo ""
echo "Save these into frontend/.env.local — see .env.example"
echo ""
echo "Sample report to generate a tx hash for your submission:"
echo ""
echo "stellar contract invoke --id $REGISTRY_ID --source $DEPLOYER --network $NETWORK \\"
echo "  -- file_report --reporter $DEPLOYER_ADDRESS \\"
echo "  --trail_id \"PCT-mile-482\" --condition '{\"Washout\":{}}' \\"
echo "  --note \"Large tree down, easy to route around\" --stake 100000000"
