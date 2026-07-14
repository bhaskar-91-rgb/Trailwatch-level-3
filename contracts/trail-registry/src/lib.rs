//! Trail Registry Contract
//!
//! A staked, crowd-verified trail condition reporting network. Hikers
//! stake a small XLM deposit to submit a report (washout, closure,
//! wildlife, overgrowth, all-clear). Other hikers corroborate or
//! dispute it. Once a report crosses a corroboration threshold, the
//! reporter's stake is returned plus a small reward, and — via a
//! cross-contract call — their accuracy score rises in
//! `VerifierReputation`. If a report is disputed past a threshold, the
//! stake is forfeited to a community pool and the reporter's accuracy
//! score drops.
//!
//! State machine per report:
//!   Pending -> Confirmed (stake returned + rewarded, reputation +)
//!   Pending -> Disputed  (stake forfeited, reputation -)

#![no_std]

use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, token, Address, Env, String, Symbol, Vec,
};

mod reputation {
    soroban_sdk::contractimport!(
        file = "../../target/wasm32-unknown-unknown/release/verifier_reputation.wasm"
    );
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum ReportStatus {
    Pending,
    Confirmed,
    Disputed,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum ConditionType {
    Clear,
    Washout,
    Closure,
    Wildlife,
    Overgrowth,
    Flooding,
}

#[contracttype]
#[derive(Clone, Debug)]
pub struct Report {
    pub id: u32,
    pub trail_id: String,
    pub reporter: Address,
    pub condition: ConditionType,
    pub note: String,
    pub stake: i128,
    pub confirmations: u32,
    pub disputes: u32,
    pub status: ReportStatus,
    pub reported_at: u64,
}

#[contracttype]
enum DataKey {
    Admin,
    TokenAddress,
    ReputationAddress,
    ReportCount,
    Report(u32),
    HasVoted(u32, Address),
    RewardPool,
}

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
pub enum RegistryError {
    NotInitialized = 1,
    AlreadyInitialized = 2,
    ReportNotFound = 3,
    InvalidState = 4,
    Unauthorized = 5,
    InvalidStake = 6,
    AlreadyVoted = 7,
    SelfVote = 8,
}

const CONFIRMATION_THRESHOLD: u32 = 3;
const DISPUTE_THRESHOLD: u32 = 3;
const REWARD_BONUS_STROOPS: i128 = 5_000_000; // 0.5 XLM paid from reward pool on confirmation

#[contract]
pub struct TrailRegistry;

#[contractimpl]
impl TrailRegistry {
    pub fn initialize(
        env: Env,
        admin: Address,
        token_address: Address,
        reputation_address: Address,
    ) -> Result<(), RegistryError> {
        if env.storage().instance().has(&DataKey::Admin) {
            return Err(RegistryError::AlreadyInitialized);
        }
        admin.require_auth();

        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage()
            .instance()
            .set(&DataKey::TokenAddress, &token_address);
        env.storage()
            .instance()
            .set(&DataKey::ReputationAddress, &reputation_address);
        env.storage().instance().set(&DataKey::ReportCount, &0u32);
        env.storage().instance().set(&DataKey::RewardPool, &0i128);
        Ok(())
    }

    /// Admin funds the community reward pool that pays confirmation bonuses.
    pub fn fund_reward_pool(env: Env, admin: Address, amount: i128) -> Result<(), RegistryError> {
        admin.require_auth();
        if amount <= 0 {
            return Err(RegistryError::InvalidStake);
        }
        let token_address: Address = env
            .storage()
            .instance()
            .get(&DataKey::TokenAddress)
            .ok_or(RegistryError::NotInitialized)?;
        let token_client = token::Client::new(&env, &token_address);
        token_client.transfer(&admin, &env.current_contract_address(), &amount);

        let pool: i128 = env
            .storage()
            .instance()
            .get(&DataKey::RewardPool)
            .unwrap_or(0);
        env.storage()
            .instance()
            .set(&DataKey::RewardPool, &(pool + amount));
        Ok(())
    }

    /// A hiker files a trail condition report, staking `stake` XLM.
    pub fn file_report(
        env: Env,
        reporter: Address,
        trail_id: String,
        condition: ConditionType,
        note: String,
        stake: i128,
    ) -> Result<u32, RegistryError> {
        reporter.require_auth();
        if stake <= 0 {
            return Err(RegistryError::InvalidStake);
        }

        let token_address: Address = env
            .storage()
            .instance()
            .get(&DataKey::TokenAddress)
            .ok_or(RegistryError::NotInitialized)?;
        let token_client = token::Client::new(&env, &token_address);
        token_client.transfer(&reporter, &env.current_contract_address(), &stake);

        let id: u32 = env
            .storage()
            .instance()
            .get(&DataKey::ReportCount)
            .unwrap_or(0);

        let report = Report {
            id,
            trail_id: trail_id.clone(),
            reporter: reporter.clone(),
            condition,
            note,
            stake,
            confirmations: 0,
            disputes: 0,
            status: ReportStatus::Pending,
            reported_at: env.ledger().timestamp(),
        };

        env.storage()
            .persistent()
            .set(&DataKey::Report(id), &report);
        env.storage()
            .instance()
            .set(&DataKey::ReportCount, &(id + 1));

        env.events().publish(
            (
                Symbol::new(&env, "trail"),
                Symbol::new(&env, "report_filed"),
                id,
            ),
            (reporter, trail_id),
        );

        Ok(id)
    }

    /// Another hiker corroborates a pending report. Once confirmations
    /// cross the threshold, stake + reward pays out and reputation
    /// updates via a cross-contract call.
    pub fn corroborate(env: Env, report_id: u32, voter: Address) -> Result<(), RegistryError> {
        voter.require_auth();
        let mut report = Self::get_report_internal(&env, report_id)?;

        if report.status != ReportStatus::Pending {
            return Err(RegistryError::InvalidState);
        }
        if report.reporter == voter {
            return Err(RegistryError::SelfVote);
        }
        Self::assert_not_voted(&env, report_id, &voter)?;
        Self::mark_voted(&env, report_id, &voter);

        report.confirmations += 1;

        if report.confirmations >= CONFIRMATION_THRESHOLD {
            Self::settle_confirmation(&env, &mut report)?;
        } else {
            env.events().publish(
                (
                    Symbol::new(&env, "trail"),
                    Symbol::new(&env, "corroborated"),
                    report_id,
                ),
                (voter, report.confirmations),
            );
        }

        env.storage()
            .persistent()
            .set(&DataKey::Report(report_id), &report);
        Ok(())
    }

    /// Another hiker disputes a pending report as inaccurate. Once
    /// disputes cross the threshold, the stake is forfeited to the
    /// reward pool and the reporter's reputation takes a hit.
    pub fn dispute(env: Env, report_id: u32, voter: Address) -> Result<(), RegistryError> {
        voter.require_auth();
        let mut report = Self::get_report_internal(&env, report_id)?;

        if report.status != ReportStatus::Pending {
            return Err(RegistryError::InvalidState);
        }
        if report.reporter == voter {
            return Err(RegistryError::SelfVote);
        }
        Self::assert_not_voted(&env, report_id, &voter)?;
        Self::mark_voted(&env, report_id, &voter);

        report.disputes += 1;

        if report.disputes >= DISPUTE_THRESHOLD {
            Self::settle_dispute(&env, &mut report)?;
        } else {
            env.events().publish(
                (
                    Symbol::new(&env, "trail"),
                    Symbol::new(&env, "disputed"),
                    report_id,
                ),
                (voter, report.disputes),
            );
        }

        env.storage()
            .persistent()
            .set(&DataKey::Report(report_id), &report);
        Ok(())
    }

    fn settle_confirmation(env: &Env, report: &mut Report) -> Result<(), RegistryError> {
        let token_address: Address = env
            .storage()
            .instance()
            .get(&DataKey::TokenAddress)
            .ok_or(RegistryError::NotInitialized)?;
        let token_client = token::Client::new(env, &token_address);

        let pool: i128 = env
            .storage()
            .instance()
            .get(&DataKey::RewardPool)
            .unwrap_or(0);
        let bonus = if pool >= REWARD_BONUS_STROOPS {
            REWARD_BONUS_STROOPS
        } else {
            0
        };
        let payout = report.stake + bonus;

        token_client.transfer(&env.current_contract_address(), &report.reporter, &payout);

        if bonus > 0 {
            env.storage()
                .instance()
                .set(&DataKey::RewardPool, &(pool - bonus));
        }

        // --- Cross-contract call: update reporter's accuracy score ---
        let reputation_address: Address = env
            .storage()
            .instance()
            .get(&DataKey::ReputationAddress)
            .ok_or(RegistryError::NotInitialized)?;
        let reputation_client = reputation::Client::new(env, &reputation_address);
        reputation_client.record_confirmation(
            &env.current_contract_address(),
            &report.reporter,
            &bonus,
        );

        report.status = ReportStatus::Confirmed;

        env.events().publish(
            (
                Symbol::new(env, "trail"),
                Symbol::new(env, "confirmed"),
                report.id,
            ),
            (report.reporter.clone(), payout),
        );

        Ok(())
    }

    fn settle_dispute(env: &Env, report: &mut Report) -> Result<(), RegistryError> {
        // Forfeited stake goes to the reward pool (stays in this
        // contract's balance; the pool counter tracks what's spendable).
        let pool: i128 = env
            .storage()
            .instance()
            .get(&DataKey::RewardPool)
            .unwrap_or(0);
        env.storage()
            .instance()
            .set(&DataKey::RewardPool, &(pool + report.stake));

        // --- Cross-contract call: penalize reporter's accuracy score ---
        let reputation_address: Address = env
            .storage()
            .instance()
            .get(&DataKey::ReputationAddress)
            .ok_or(RegistryError::NotInitialized)?;
        let reputation_client = reputation::Client::new(env, &reputation_address);
        reputation_client.record_refutation(&env.current_contract_address(), &report.reporter);

        report.status = ReportStatus::Disputed;

        env.events().publish(
            (
                Symbol::new(env, "trail"),
                Symbol::new(env, "refuted"),
                report.id,
            ),
            report.reporter.clone(),
        );

        Ok(())
    }

    pub fn get_report(env: Env, report_id: u32) -> Result<Report, RegistryError> {
        Self::get_report_internal(&env, report_id)
    }

    pub fn list_reports(env: Env, offset: u32, limit: u32) -> Vec<Report> {
        let count: u32 = env
            .storage()
            .instance()
            .get(&DataKey::ReportCount)
            .unwrap_or(0);
        let mut out = Vec::new(&env);
        let mut i = offset;
        let end = (offset + limit).min(count);
        while i < end {
            if let Some(r) = env.storage().persistent().get(&DataKey::Report(i)) {
                out.push_back(r);
            }
            i += 1;
        }
        out
    }

    pub fn report_count(env: Env) -> u32 {
        env.storage()
            .instance()
            .get(&DataKey::ReportCount)
            .unwrap_or(0)
    }

    pub fn reward_pool_balance(env: Env) -> i128 {
        env.storage()
            .instance()
            .get(&DataKey::RewardPool)
            .unwrap_or(0)
    }

    fn get_report_internal(env: &Env, report_id: u32) -> Result<Report, RegistryError> {
        env.storage()
            .persistent()
            .get(&DataKey::Report(report_id))
            .ok_or(RegistryError::ReportNotFound)
    }

    fn assert_not_voted(env: &Env, report_id: u32, voter: &Address) -> Result<(), RegistryError> {
        let has_voted: bool = env
            .storage()
            .temporary()
            .get(&DataKey::HasVoted(report_id, voter.clone()))
            .unwrap_or(false);
        if has_voted {
            return Err(RegistryError::AlreadyVoted);
        }
        Ok(())
    }

    fn mark_voted(env: &Env, report_id: u32, voter: &Address) {
        env.storage()
            .temporary()
            .set(&DataKey::HasVoted(report_id, voter.clone()), &true);
    }
}

mod test;
