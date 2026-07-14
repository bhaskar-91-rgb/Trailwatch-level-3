# Trailwatch

**A staked, crowd-verified trail condition reporting network on
<div align="center">
  
# 🌲 Trailwatch - Crowd-Verified Trail Conditions

**A decentralized trail condition reporting network built on Stellar & Soroban smart contracts.**  
*Trailwatch uses staking and crowd-consensus to ensure reports are accurate, automatically rewarding honest hikers while penalizing spam.*

[![Stellar](https://img.shields.io/badge/Stellar-Soroban-blue.svg)](https://stellar.org/soroban)
[![Next.js](https://img.shields.io/badge/Frontend-Next.js_React-black.svg)](https://nextjs.org/)
[![Live Demo](https://img.shields.io/badge/Live%20Demo-Vercel-black.svg?logo=vercel)](https://trailwatch-level-3.vercel.app/)
[![Video Demo](https://img.shields.io/badge/Video%20Demo-Google%20Drive-red.svg?logo=google-drive)](https://drive.google.com/file/d/1kZyA0iAeG-JXZaYSac7JOIu0y_aq_53X/view?usp=sharing)

### 🔗 [▶️ Live App](https://trailwatch-level-3.vercel.app/) &nbsp;|&nbsp; [🎥 Video Demo](https://drive.google.com/file/d/1kZyA0iAeG-JXZaYSac7JOIu0y_aq_53X/view?usp=sharing)

</div>

<br />

## 🌟 Key Features

1. **Staked Reporting:** Hikers must stake a small amount of XLM to file a report, preventing spam and incentivizing accuracy.
2. **Crowd Verification:** Other hikers can corroborate or dispute a report. Reports require a set threshold (e.g., 3 confirmations) to become verified.
3. **Automated Rewards:** When a report is verified, the original reporter receives their stake back plus a bonus from the community reward pool.
4. **On-Chain Reputation:** Users build a permanent, on-chain trust score in the `VerifierReputation` contract based on their reporting accuracy.

---

## 🚀 Smart Contract Deployment (Stellar Testnet)

The smart contracts are live and deployed to the **Stellar Testnet** via automated CI/CD (GitHub Actions). All contract interactions use the native **XLM** token.

| Contract | Contract ID | Explorer |
|---|---|---|
| 🌲 **Trail Registry** | `CB5SGSS3E5FZ4EOO7GDRO3DUG65XDZ6GCFTTZZD73HAMZNUZCGHXPWVW` | [View on Stellar Expert](https://stellar.expert/explorer/testnet/contract/CB5SGSS3E5FZ4EOO7GDRO3DUG65XDZ6GCFTTZZD73HAMZNUZCGHXPWVW) |
| 🛡️ **Verifier Reputation** | `CAMEY6WGZZBGFLTUAXOGJRHTETODZ7A524ZKXCO5WSTTHCNMKIZEF74D` | [View on Stellar Expert](https://stellar.expert/explorer/testnet/contract/CAMEY6WGZZBGFLTUAXOGJRHTETODZ7A524ZKXCO5WSTTHCNMKIZEF74D) |

**Sample Transaction:** [View Contract Interaction Hash](https://stellar.expert/explorer/testnet/tx/2cba1095b6d00010a2e197d3e426b94999704ef9a27838a435273b00cd12dc9a)

---

## ✅ Submission Checklist Verification

- [x] **Public GitHub repository:** Yes
- [x] **README with complete documentation:** Yes
- [x] **Minimum 10+ meaningful commits:** Yes
- [x] **Live demo link:** [trailwatch-level-3.vercel.app](https://trailwatch-level-3.vercel.app/)
- [x] **Contract deployment address:** See table above
- [x] **Transaction hash for contract interaction:** [View Tx Hash](https://stellar.expert/explorer/testnet/tx/2cba1095b6d00010a2e197d3e426b94999704ef9a27838a435273b00cd12dc9a)
- [x] **Demo video link (1–2 minutes):** [Watch Video Demo](https://drive.google.com/file/d/1kZyA0iAeG-JXZaYSac7JOIu0y_aq_53X/view?usp=sharing)

### Screenshots

**Product UI & Mobile Responsiveness**
<p align="center">
  <img src="images/product%20ui.png" width="48%" />
  <img src="images/mobile%20responsive.png" width="48%" />
</p>

**CI/CD Pipeline Running**
<p align="center">
  <img src="images/CI%20CD.png" width="80%" />
</p>

**Test Output (3+ Passing Tests)**
<p align="center">
  <img src="images/test%20output.png" width="80%" />
</p>

---

## 🛠️ Tech Stack

- **Smart Contracts:** Rust, Soroban SDK
- **Frontend:** Next.js, React, Tailwind CSS
- **Wallet Integration:** Freighter / Stellar Wallets Kit
- **CI/CD:** GitHub Actions (Automated build, test, and deploy)

## 📖 Local Development

1. **Clone the repository:**
   ```bash
   git clone https://github.com/bhaskar-91-rgb/Trailwatch-level-3.git
   cd Trailwatch-level-3
   ```

2. **Run Contract Tests:**
   ```bash
   cargo test --workspace
   ```

3. **Start the Frontend:**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

---

## Why this project

Two contracts, deployed independently, that call each other inside a
single atomic transaction — the same architectural pattern real
multi-contract Soroban systems use, applied to a domain (outdoor trail
conditions) that's genuinely different from token vaults, bounty
boards, or the other common Level 3 submission patterns. The
interesting design problem here is **crowd verification with skin in
the game**: reports aren't just posted, they're staked, contested, and
settled by threshold voting, with a dedicated reputation contract that
tracks who's actually reliable over time.

## What it does

1. A **hiker** files a trail condition report — trail ID, condition
   type, a note, and an XLM stake — which is escrowed immediately.
2. Other hikers **corroborate** (confirm) or **dispute** the report.
   Each address can vote once, and a reporter can't vote on their own
   report.
3. Once corroborations cross a threshold, the contract **pays out**:
   original stake + a reward-pool bonus goes to the reporter, and a
   cross-contract call into `VerifierReputation` raises their accuracy
   score.
4. Once disputes cross a threshold, the stake is **forfeited** into the
   community reward pool, and a cross-contract call penalizes the
   reporter's accuracy score.
5. A **live ranger log** shows reports, corroborations, disputes, and
   settlements as they happen, and every hiker has a public trust tier
   (Unverified → Reliable → Trusted Scout → Trail Guardian).

## Architecture at a glance

```
Next.js frontend  ──Soroban RPC──▶  TrailRegistry contract
                                          │        │
                              token::Client   reputation::Client
                                          │        │
                                          ▼        ▼
                                  Native XLM SAC   VerifierReputation
```

Full breakdown, the cross-contract call sequence, storage-tier choices,
and the state machine: **[`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)**.

## Project structure

```
trail-registry/
├── contracts/
│   ├── trail-registry/           # Staking, voting, settlement logic
│   │   └── src/{lib.rs,test.rs}  # 10 tests incl. full settle flows
│   └── verifier-reputation/      # Hiker trust scoring
│       └── src/{lib.rs,test.rs}  # 7 tests incl. authorization checks
├── frontend/
│   ├── src/app/                  # Next.js App Router page + layout
│   ├── src/components/           # ReportCard, ActivityLog, modals, etc.
│   ├── src/hooks/                 # useWallet, useReports, useActivityFeed
│   └── src/lib/                   # soroban.ts, wallet.ts, format.ts
├── scripts/{build.sh,deploy_testnet.sh}
├── .github/workflows/{ci.yml,deploy-preview.yml}
└── docs/{ARCHITECTURE.md,DEPLOYMENT.md,SUBMISSION_CHECKLIST.md}
```

## Smart contract design

### `VerifierReputation`

| Method | Purpose |
|---|---|
| `initialize(admin)` | One-time setup |
| `authorize_writer(writer)` | Allow-list a TrailRegistry deployment |
| `record_confirmation(caller, hiker, stake_earned)` | Cross-contract; +20 accuracy, capped at 1000 |
| `record_refutation(caller, hiker)` | Cross-contract; −80 accuracy |
| `get_stats(hiker)` / `trust_label(hiker)` | Public reads |

### `TrailRegistry`

| Method | Purpose |
|---|---|
| `initialize(admin, token, reputation)` | Wires token + reputation addresses |
| `fund_reward_pool(admin, amount)` | Admin seeds confirmation bonuses |
| `file_report(reporter, trail_id, condition, note, stake)` | Escrows stake, creates `Pending` report |
| `corroborate(report_id, voter)` | Vote to confirm; settles + pays out at threshold |
| `dispute(report_id, voter)` | Vote to refute; forfeits stake at threshold |
| `list_reports(offset, limit)` / `get_report(id)` | Public reads |

## Events

`ReportFiledEvent`, `CorroboratedEvent`, `DisputedEvent`,
`ReportConfirmedEvent`, `ReportRefutedEvent` on `TrailRegistry`, plus a
parallel reputation-specific pair on `VerifierReputation` — all typed
`#[contractevent]`s with indexed topics, powering the frontend's live
ranger log.

## Testing

**Contracts** — 17 tests across both contracts:

```bash
cargo test --workspace
```

Covers: stake escrow correctness, sub-threshold voting staying pending,
full settle-on-confirmation flow (payout + reputation bump asserted),
full settle-on-dispute flow (forfeiture + reputation penalty asserted),
self-vote rejection, double-vote rejection, voting-after-settlement
rejection, pagination, and the reputation contract's writer
authorization check.

**Frontend** — component and utility tests:

```bash
cd frontend && npm run test
```

> **Note on this repository as delivered:** the contract and frontend
> logic were written and reviewed carefully, but this environment has
> no network access to fetch a Rust/Cargo toolchain, so `cargo test`
> has not actually been executed here. Run it yourself per
> `docs/DEPLOYMENT.md` step 4 before submitting.

## Error handling & loading states

- Every contract entry point returns `Result<T, ContractError>` with
  specific variants (`InvalidState`, `Unauthorized`, `SelfVote`,
  `AlreadyVoted`, `InvalidStake`) instead of panicking.
- `src/lib/soroban.ts` centralizes simulate → sign → submit → poll for
  every write and translates raw simulation errors into plain-language
  UI copy (see `readableSimulationError`).
- Every async action has a loading state (button → "Confirming…",
  skeleton cards while reports load) and a visible error state (inline
  in the file-report modal, a dismissible wallet-error banner, a retry
  button if the log fails to load).

## Mobile responsiveness

The report grid collapses from 3 columns → 1, the file-report modal
becomes a bottom sheet on small screens, and the header/hero stack
vertically below `sm:`.

## Local development

```bash
# Contracts
rustup target add wasm32-unknown-unknown
cargo install --locked stellar-cli --features opt
cargo test --workspace

# Frontend
cd frontend
cp .env.example .env.local   # fill in after deploying, see docs/DEPLOYMENT.md
npm install
npm run dev
```

Full walkthrough: **[`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md)**.

## Tech stack

- **Contracts:** Rust, Soroban SDK 21.7
- **Frontend:** Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Wallet:** Stellar Wallets Kit
- **RPC:** `@stellar/stellar-sdk`
- **Testing:** Rust's built-in harness + soroban-sdk testutils; Vitest
  + React Testing Library
- **CI/CD:** GitHub Actions (contract build/test/clippy, frontend
  lint/test/build, PR build-gate)

## License

MIT — see `LICENSE`.
