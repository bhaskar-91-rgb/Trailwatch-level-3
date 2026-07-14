# Architecture

## System overview

```
                         ┌─────────────────────────┐
                         │   Next.js Frontend       │
                         │   (trail log UI)          │
                         └────────────┬─────────────┘
                                      │ Soroban RPC
                                      ▼
                         ┌─────────────────────────┐
                         │   TrailRegistry contract  │
                         │  ─────────────────────    │
                         │  file_report                │
                         │  corroborate ────────────────┼──┐
                         │  dispute ─────────────────────┼──┤ cross-contract call
                         └───────────┬──────────────────┘  │
                                     │                       │
                          token::Client (SAC)                │
                                     │                       ▼
                                     │           ┌─────────────────────────┐
                                     │           │ VerifierReputation        │
                                     ▼           │ ─────────────────────    │
                         ┌─────────────────┐     │ record_confirmation        │
                         │  Native XLM SAC  │     │ record_refutation           │
                         │  (stake/reward)  │     │ get_stats / trust_label      │
                         └─────────────────┘     └─────────────────────────┘
```

## Why two contracts

`TrailRegistry` owns the report lifecycle and escrow; `VerifierReputation`
owns hiker trust scores. They're deployed separately so that:

- **Trust scores outlive any one registry.** If a second registry is
  deployed later (e.g., a region-specific instance), it can be
  authorized to write into the same reputation contract, and a hiker's
  trust score carries across both.
- **Least privilege.** `VerifierReputation` does not trust every
  caller — an admin explicitly calls `authorize_writer` to allow-list
  a specific `TrailRegistry` deployment. Any other address calling
  `record_confirmation` or `record_refutation` is rejected. See
  `test_unauthorized_writer_cannot_forge_reputation`.

## Inter-contract communication

The interesting cross-contract calls happen in two private helpers on
`TrailRegistry`:

- **`settle_confirmation`** — once a report crosses
  `CONFIRMATION_THRESHOLD` corroborations, it: (1) transfers the
  original stake plus a reward-pool bonus back to the reporter via
  `token::Client::transfer`, then (2) calls
  `reputation::Client::record_confirmation`, passing
  `env.current_contract_address()` as the caller so
  `VerifierReputation` can verify the call came from an authorized
  registry.
- **`settle_dispute`** — once a report crosses `DISPUTE_THRESHOLD`
  disputes, the stake is forfeited into the reward pool (no transfer
  back to the reporter) and `reputation::Client::record_refutation` is
  called to penalize the reporter's trust score.

Both happen inside the same transaction as the vote that crossed the
threshold — a report can never be marked `Confirmed` without the
payout actually succeeding, and reputation is never out of sync with
settlement history.

## Voting integrity

- A reporter cannot corroborate or dispute their own report
  (`RegistryError::SelfVote`).
- Each address can vote once per report — tracked in Soroban's
  **temporary** storage (`DataKey::HasVoted`), which is the right
  storage tier for data that only matters until the report settles and
  doesn't need to be paid for indefinitely.
- Votes on an already-settled report are rejected
  (`RegistryError::InvalidState`).

## Event streaming

Every state transition emits a typed `#[contractevent]`:
`ReportFiledEvent`, `CorroboratedEvent`, `DisputedEvent`,
`ReportConfirmedEvent`, `ReportRefutedEvent` on TrailRegistry, and a
parallel pair on VerifierReputation for reputation-specific updates.

The frontend's "live" feel comes from two layers, the standard pattern
for a production Soroban dApp:

1. **Optimistic local feed** (`useActivityFeed`) — the moment the
   current user's transaction confirms, it's pushed to the log
   instantly.
2. **Polling reconciliation** (`useReports`, every 8s) — re-fetches
   `list_reports` so votes and settlements from other hikers converge
   into the UI within one interval. A production deployment would
   subscribe to `getEvents` on the RPC server instead, filtered by
   contract ID and topic, for true push-based updates — noted as the
   natural next step and isolated entirely to the hooks layer.

## Report state machine

```
        file_report
            │
            ▼
       ┌─────────┐   3x corroborate    ┌───────────┐
       │ Pending │ ───────────────────▶│ Confirmed  │  (stake + bonus paid,
       └────┬────┘                     └───────────┘   reputation +20)
            │
            │ 3x dispute
            ▼
       ┌───────────┐
       │ Disputed  │  (stake forfeited to reward pool,
       └───────────┘   reputation -80)
```

## Production-readiness practices applied

- Explicit `Result<T, Error>` on every entry point, no panics on
  expected failure paths.
- `require_auth()` on every state-changing call; authorization for
  cross-contract writers is an explicit allow-list, not an implicit
  trust relationship.
- Vote deduplication uses **temporary storage**, which is cheaper and
  more appropriate than persistent storage for data with no long-term
  value after settlement — a deliberate storage-tier choice rather
  than defaulting everything to persistent.
- Paginated reads (`list_reports(offset, limit)`), no unbounded loops.
- CI builds release WASM, runs the full test suite, and runs Clippy on
  every push — not just "does it compile."
