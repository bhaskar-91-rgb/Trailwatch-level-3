#!/usr/bin/env bash
# Builds both Soroban contracts to WASM. verifier-reputation builds first
# because trail-registry imports its WASM interface at compile time.
set -e

echo "==> Building verifier-reputation"
cd contracts/verifier-reputation
stellar contract build
cd ../..

echo "==> Building trail-registry"
cd contracts/trail-registry
stellar contract build
cd ../..

echo "==> Optimizing WASM"
stellar contract optimize \
  --wasm target/wasm32-unknown-unknown/release/verifier_reputation.wasm
stellar contract optimize \
  --wasm target/wasm32-unknown-unknown/release/trail_registry.wasm

echo "Build complete. Artifacts in target/wasm32-unknown-unknown/release/"
