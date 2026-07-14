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

## 📸 Screenshots

**Product UI & Mobile Responsiveness**
<p align="center">
  <img src="images/product ui.png" width="48%" />
  <img src="images/mobile responsive.png" width="48%" />
</p>

**CI/CD Pipeline Running**
<p align="center">
  <img src="images/CI CD.png" width="80%" />
</p>

**Test Output (3+ Passing Tests)**
<p align="center">
  <img src="images/test output.png" width="80%" />
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
