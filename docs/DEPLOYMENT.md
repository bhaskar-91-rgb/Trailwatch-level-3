# Deployment Guide

Everything needed to take this repo from source to a live, verifiable
submission: real contract addresses, a real transaction hash, a live
frontend URL, and the checklist's screenshots/video. Budget 30–45 min.

## 1. Install prerequisites

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
rustup target add wasm32-unknown-unknown
cargo install --locked stellar-cli --features opt
# Node 20+ via nvm or your platform's package manager
```

## 2. Create and fund a deployer identity

```bash
stellar keys generate deployer --network testnet --fund
stellar keys address deployer
```

## 3. Build the contracts

```bash
bash scripts/build.sh
```

## 4. Run the test suite locally

```bash
cargo test --workspace
```

Expect 7 passing tests in `verifier-reputation` and 10 in
`trail-registry` (17 total). Screenshot this terminal output for the
"test output with 3+ passing tests" requirement.

## 5. Deploy to testnet

```bash
bash scripts/deploy_testnet.sh
```

Deploys both contracts, initializes them, authorizes `TrailRegistry` as
a writer on `VerifierReputation`, and seeds the reward pool with 50
XLM. Prints the three addresses you need — **save them**.

## 6. Generate a real transaction hash

Either use the sample `file_report` command the script prints, or just
use the deployed frontend — filing a report, corroborating, or
disputing each produce a transaction hash. View it at
`https://stellar.expert/explorer/testnet/tx/<HASH>`.

## 7. Configure and run the frontend locally

```bash
cd frontend
cp .env.example .env.local
# paste the three addresses from step 5
npm install
npm run dev
```

Visit `http://localhost:3000`, connect a testnet wallet, file a report,
then switch accounts (or use a second wallet) to corroborate it three
times and watch it settle.

## 8. Run the frontend test suite

```bash
npm run test
```

## 9. Deploy the frontend live (Vercel)

```bash
npm install -g vercel
cd frontend
vercel login
vercel --prod
```

Set the same environment variables in the Vercel project settings, or
connect the GitHub repo directly at vercel.com/new for automatic
deploys on every push to `main`.

## 10. Capture the submission assets

- **Mobile responsive screenshot** — device toolbar on the live URL.
- **CI pipeline screenshot** — GitHub Actions tab after pushing.
- **Test output screenshot** — from step 4 or step 8.
- **Demo video (1–2 min)** — connect a wallet, file a report, switch
  accounts, corroborate it three times, show the payout and trust score
  update, and show the ranger log ticking live.

## 11. Push to GitHub with real commit history

This repo already ships with 20+ incremental commits (`git log
--oneline` to see them) so pushing preserves genuine history. If you
make your own edits on top, commit them incrementally rather than as
one giant commit.
