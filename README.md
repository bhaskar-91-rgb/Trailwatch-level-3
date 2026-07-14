# Trailwatch

**A staked, crowd-verified trail condition reporting network on
Stellar/Soroban.** Hikers stake XLM to report trail conditions —
washouts, closures, wildlife, flooding. Other hikers corroborate or
dispute the report. Once enough hikers agree, the stake returns plus a
reward and the reporter's on-chain trust score rises automatically, via
a cross-contract call.

Built for the Orange Belt (Level 3) submission — advanced smart
contracts and production-ready dApp architecture.

> 🔗 **Live demo:** _add your Vercel URL here after deploying (see
> `docs/DEPLOYMENT.md`)_
> 🎥 **Demo video:** _add your 1–2 min walkthrough link here_
> 📜 **TrailRegistry contract:** `<add testnet address after deploy>`
> 📜 **VerifierReputation contract:** `<add testnet address after deploy>`
> 🧾 **Sample transaction:** `<add a tx hash + stellar.expert link>`

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
