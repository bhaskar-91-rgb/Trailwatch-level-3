# Submission Checklist — mapped to this repo

**[YOU]** marks items that require an action outside this repo/zip —
deploying, pushing, recording — since generating fake versions of any
of these would mean submitting false on-chain data.

## Advanced smart contract development

- [x] Inter-contract communication — `TrailRegistry::settle_confirmation`
      / `settle_dispute` call into `VerifierReputation`. See
      `docs/ARCHITECTURE.md`.
- [x] Event streaming & real-time updates — typed events on every
      transition; `ActivityLog` + 8s polling reconciliation.
- [ ] **[YOU]** CI/CD pipeline setup — workflows in `.github/workflows/`
      run once pushed to GitHub.
- [ ] **[YOU]** Smart contract deployment workflow — `scripts/deploy_testnet.sh`.
- [x] Mobile responsive frontend — Tailwind breakpoints, 3→1 column grid,
      bottom-sheet modals on small screens.
- [x] Error handling & loading states — see README.
- [x] Writing tests — 17 contract tests, frontend unit + component
      tests. **[YOU]** run and screenshot.
- [x] Production-ready architecture — typed errors, auth allow-lists,
      temporary vs. persistent storage tiering, paginated reads, CI
      lint/clippy gates.
- [x] Documentation — README + docs/.
- [ ] **[YOU]** Demo presentation — record the video.

## Submission checklist items

- [ ] **[YOU]** Public GitHub repository.
- [x] README with complete documentation.
- [x] Minimum 10+ meaningful commits — already in the zip's git history.
- [ ] **[YOU]** Live demo link (Vercel).
- [ ] **[YOU]** Contract deployment address.
- [ ] **[YOU]** Transaction hash for contract interaction.
- [ ] **[YOU]** Screenshot: mobile responsive UI.
- [ ] **[YOU]** Screenshot: CI/CD pipeline running.
- [ ] **[YOU]** Screenshot: test output with 3+ passing tests.
- [ ] **[YOU]** Demo video link (1–2 minutes).
