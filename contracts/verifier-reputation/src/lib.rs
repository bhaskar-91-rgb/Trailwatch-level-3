//! Verifier Reputation Contract
//!
//! Tracks accuracy scores for hikers who submit trail condition reports.
//! Invoked cross-contract by `TrailRegistry` whenever a report is
//! confirmed or refuted by subsequent corroborating/disputing reports,
//! so a hiker's trustworthiness travels across every trail they report on.

#![no_std]

use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, Address, Env, String, Symbol,
};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct HikerStats {
    pub reports_confirmed: u32,
    pub reports_refuted: u32,
    pub accuracy_score: u32, // 0 - 1000
    pub total_stake_earned: i128,
}

#[contracttype]
enum DataKey {
    Admin,
    Stats(Address),
    AuthorizedWriter(Address),
}

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
pub enum ReputationError {
    NotInitialized = 1,
    AlreadyInitialized = 2,
    Unauthorized = 3,
    InvalidAmount = 4,
}

const STARTING_SCORE: u32 = 500;
const MAX_SCORE: u32 = 1000;
const CONFIRM_BONUS: u32 = 20;
const REFUTE_PENALTY: u32 = 80;

#[contract]
pub struct VerifierReputation;

#[contractimpl]
impl VerifierReputation {
    pub fn initialize(env: Env, admin: Address) -> Result<(), ReputationError> {
        if env.storage().instance().has(&DataKey::Admin) {
            return Err(ReputationError::AlreadyInitialized);
        }
        admin.require_auth();
        env.storage().instance().set(&DataKey::Admin, &admin);
        Ok(())
    }

    pub fn authorize_writer(env: Env, writer: Address) -> Result<(), ReputationError> {
        let admin: Address = env
            .storage()
            .instance()
            .get(&DataKey::Admin)
            .ok_or(ReputationError::NotInitialized)?;
        admin.require_auth();

        env.storage()
            .instance()
            .set(&DataKey::AuthorizedWriter(writer.clone()), &true);

        env.events().publish(
            (
                Symbol::new(&env, "registry"),
                Symbol::new(&env, "writer_authorized"),
                writer,
            ),
            (),
        );
        Ok(())
    }

    /// Called cross-contract by TrailRegistry when a report accumulates
    /// enough corroborating confirmations and its stake is returned + rewarded.
    pub fn record_confirmation(
        env: Env,
        caller: Address,
        hiker: Address,
        stake_earned: i128,
    ) -> Result<HikerStats, ReputationError> {
        caller.require_auth();
        Self::assert_authorized(&env, &caller)?;

        if stake_earned < 0 {
            return Err(ReputationError::InvalidAmount);
        }

        let mut stats = Self::get_stats_internal(&env, &hiker);
        stats.reports_confirmed += 1;
        stats.total_stake_earned += stake_earned;
        stats.accuracy_score = (stats.accuracy_score + CONFIRM_BONUS).min(MAX_SCORE);

        env.storage()
            .persistent()
            .set(&DataKey::Stats(hiker.clone()), &stats);

        env.events().publish(
            (
                Symbol::new(&env, "reputation"),
                Symbol::new(&env, "report_confirmed"),
                hiker,
            ),
            (stats.accuracy_score, stake_earned),
        );

        Ok(stats)
    }

    /// Called cross-contract by TrailRegistry when a report is disputed
    /// and found inaccurate; the hiker's stake is forfeited by the registry
    /// and their accuracy score takes a penalty here.
    pub fn record_refutation(
        env: Env,
        caller: Address,
        hiker: Address,
    ) -> Result<HikerStats, ReputationError> {
        caller.require_auth();
        Self::assert_authorized(&env, &caller)?;

        let mut stats = Self::get_stats_internal(&env, &hiker);
        stats.reports_refuted += 1;
        stats.accuracy_score = stats.accuracy_score.saturating_sub(REFUTE_PENALTY);

        env.storage()
            .persistent()
            .set(&DataKey::Stats(hiker.clone()), &stats);

        env.events().publish(
            (
                Symbol::new(&env, "reputation"),
                Symbol::new(&env, "report_refuted"),
                hiker,
            ),
            stats.accuracy_score,
        );

        Ok(stats)
    }

    pub fn get_stats(env: Env, hiker: Address) -> HikerStats {
        Self::get_stats_internal(&env, &hiker)
    }

    pub fn trust_label(env: Env, hiker: Address) -> String {
        let stats = Self::get_stats_internal(&env, &hiker);
        match stats.accuracy_score {
            0..=349 => String::from_str(&env, "Unverified"),
            350..=599 => String::from_str(&env, "Reliable"),
            600..=849 => String::from_str(&env, "Trusted Scout"),
            _ => String::from_str(&env, "Trail Guardian"),
        }
    }

    fn assert_authorized(env: &Env, caller: &Address) -> Result<(), ReputationError> {
        let is_authorized = env
            .storage()
            .instance()
            .get(&DataKey::AuthorizedWriter(caller.clone()))
            .unwrap_or(false);
        if !is_authorized {
            return Err(ReputationError::Unauthorized);
        }
        Ok(())
    }

    fn get_stats_internal(env: &Env, hiker: &Address) -> HikerStats {
        env.storage()
            .persistent()
            .get(&DataKey::Stats(hiker.clone()))
            .unwrap_or(HikerStats {
                reports_confirmed: 0,
                reports_refuted: 0,
                accuracy_score: STARTING_SCORE,
                total_stake_earned: 0,
            })
    }
}

mod test;
