#![cfg(test)]

use super::*;
use verifier_reputation::VerifierReputation;
use soroban_sdk::testutils::Address as _;
use soroban_sdk::Env;

fn create_token_contract<'a>(
    env: &Env,
    admin: &Address,
) -> (Address, token::StellarAssetClient<'a>, token::Client<'a>) {
    let sac = env.register_stellar_asset_contract_v2(admin.clone());
    let address = sac.address();
    (address.clone(), token::StellarAssetClient::new(env, &address), token::Client::new(env, &address))
}

struct TestSetup<'a> {
    env: Env,
    registry: TrailRegistryClient<'a>,
    reputation: verifier_reputation::VerifierReputationClient<'a>,
    token: token::Client<'a>,
    admin: Address,
}

fn setup<'a>() -> TestSetup<'a> {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let (token_address, token_admin, token) = create_token_contract(&env, &admin);

    let reputation_id = env.register(VerifierReputation, ());
    let reputation = verifier_reputation::VerifierReputationClient::new(&env, &reputation_id);
    reputation.initialize(&admin);

    let registry_id = env.register(TrailRegistry, ());
    let registry = TrailRegistryClient::new(&env, &registry_id);
    registry.initialize(&admin, &token_address, &reputation_id);

    reputation.authorize_writer(&registry_id);
    token_admin.mint(&admin, &10_000_000_000_i128);

    TestSetup { env, registry, reputation, token, admin }
}

fn fund_and_mint(s: &TestSetup, who: &Address, amount: i128) {
    let token_admin = token::StellarAssetClient::new(&s.env, &s.token.address);
    token_admin.mint(who, &amount);
}

#[test]
fn test_file_report_escrows_stake() {
    let s = setup();
    let hiker = Address::generate(&s.env);
    fund_and_mint(&s, &hiker, 1_000_000_000);

    let trail_id = String::from_str(&s.env, "PCT-mile-482");
    let note = String::from_str(&s.env, "Large tree down blocking the trail, easy to route around");

    let id = s.registry.file_report(
        &hiker,
        &trail_id,
        &ConditionType::Washout,
        &note,
        &20_000_000_i128,
    );

    assert_eq!(id, 0);
    assert_eq!(s.token.balance(&hiker), 980_000_000);

    let report = s.registry.get_report(&id);
    assert_eq!(report.status, ReportStatus::Pending);
    assert_eq!(report.confirmations, 0);
}

#[test]
fn test_file_report_rejects_non_positive_stake() {
    let s = setup();
    let hiker = Address::generate(&s.env);
    fund_and_mint(&s, &hiker, 1_000_000_000);
    let trail_id = String::from_str(&s.env, "trail-1");
    let note = String::from_str(&s.env, "test note here");
    let result = s.registry.try_file_report(&hiker, &trail_id, &ConditionType::Clear, &note, &0);
    assert!(result.is_err());
}

#[test]
fn test_corroboration_below_threshold_stays_pending() {
    let s = setup();
    let hiker = Address::generate(&s.env);
    fund_and_mint(&s, &hiker, 1_000_000_000);
    let trail_id = String::from_str(&s.env, "trail-1");
    let note = String::from_str(&s.env, "washout near the creek crossing");
    let id = s.registry.file_report(&hiker, &trail_id, &ConditionType::Washout, &note, &10_000_000);

    let voter1 = Address::generate(&s.env);
    let voter2 = Address::generate(&s.env);
    s.registry.corroborate(&id, &voter1);
    s.registry.corroborate(&id, &voter2);

    let report = s.registry.get_report(&id);
    assert_eq!(report.status, ReportStatus::Pending);
    assert_eq!(report.confirmations, 2);
}

#[test]
fn test_corroboration_crossing_threshold_pays_out_and_updates_reputation() {
    let s = setup();
    let hiker = Address::generate(&s.env);
    fund_and_mint(&s, &hiker, 1_000_000_000);
    s.registry.fund_reward_pool(&s.admin, &1_000_000_000_i128);

    let trail_id = String::from_str(&s.env, "trail-1");
    let note = String::from_str(&s.env, "bridge is out, need detour markers");
    let id = s.registry.file_report(&hiker, &trail_id, &ConditionType::Washout, &note, &10_000_000);

    let balance_before = s.token.balance(&hiker);

    let voter1 = Address::generate(&s.env);
    let voter2 = Address::generate(&s.env);
    let voter3 = Address::generate(&s.env);
    s.registry.corroborate(&id, &voter1);
    s.registry.corroborate(&id, &voter2);
    s.registry.corroborate(&id, &voter3);

    let report = s.registry.get_report(&id);
    assert_eq!(report.status, ReportStatus::Confirmed);

    // Stake (10_000_000) + bonus (5_000_000) returned
    assert_eq!(s.token.balance(&hiker), balance_before + 15_000_000);

    let stats = s.reputation.get_stats(&hiker);
    assert_eq!(stats.reports_confirmed, 1);
    assert_eq!(stats.accuracy_score, 520);
}

#[test]
fn test_dispute_crossing_threshold_forfeits_stake_and_penalizes_reputation() {
    let s = setup();
    let hiker = Address::generate(&s.env);
    fund_and_mint(&s, &hiker, 1_000_000_000);

    let trail_id = String::from_str(&s.env, "trail-2");
    let note = String::from_str(&s.env, "claims trail closed but it was fully open");
    let id = s.registry.file_report(&hiker, &trail_id, &ConditionType::Closure, &note, &10_000_000);

    let balance_before = s.token.balance(&hiker);

    let voter1 = Address::generate(&s.env);
    let voter2 = Address::generate(&s.env);
    let voter3 = Address::generate(&s.env);
    s.registry.dispute(&id, &voter1);
    s.registry.dispute(&id, &voter2);
    s.registry.dispute(&id, &voter3);

    let report = s.registry.get_report(&id);
    assert_eq!(report.status, ReportStatus::Disputed);
    // No refund - stake forfeited
    assert_eq!(s.token.balance(&hiker), balance_before);

    let stats = s.reputation.get_stats(&hiker);
    assert_eq!(stats.reports_refuted, 1);
    assert_eq!(stats.accuracy_score, 420); // 500 - 80
}

#[test]
fn test_reporter_cannot_vote_on_own_report() {
    let s = setup();
    let hiker = Address::generate(&s.env);
    fund_and_mint(&s, &hiker, 1_000_000_000);
    let trail_id = String::from_str(&s.env, "trail-1");
    let note = String::from_str(&s.env, "some trail condition note");
    let id = s.registry.file_report(&hiker, &trail_id, &ConditionType::Clear, &note, &10_000_000);

    let result = s.registry.try_corroborate(&id, &hiker);
    assert!(result.is_err());
}

#[test]
fn test_cannot_vote_twice_on_same_report() {
    let s = setup();
    let hiker = Address::generate(&s.env);
    fund_and_mint(&s, &hiker, 1_000_000_000);
    let trail_id = String::from_str(&s.env, "trail-1");
    let note = String::from_str(&s.env, "some trail condition note");
    let id = s.registry.file_report(&hiker, &trail_id, &ConditionType::Clear, &note, &10_000_000);

    let voter = Address::generate(&s.env);
    s.registry.corroborate(&id, &voter);
    let result = s.registry.try_corroborate(&id, &voter);
    assert!(result.is_err());
}

#[test]
fn test_cannot_vote_on_settled_report() {
    let s = setup();
    let hiker = Address::generate(&s.env);
    fund_and_mint(&s, &hiker, 1_000_000_000);
    let trail_id = String::from_str(&s.env, "trail-1");
    let note = String::from_str(&s.env, "some trail condition note");
    let id = s.registry.file_report(&hiker, &trail_id, &ConditionType::Clear, &note, &10_000_000);

    let voter1 = Address::generate(&s.env);
    let voter2 = Address::generate(&s.env);
    let voter3 = Address::generate(&s.env);
    let voter4 = Address::generate(&s.env);
    s.registry.corroborate(&id, &voter1);
    s.registry.corroborate(&id, &voter2);
    s.registry.corroborate(&id, &voter3);

    let result = s.registry.try_corroborate(&id, &voter4);
    assert!(result.is_err());
}

#[test]
fn test_list_reports_pagination() {
    let s = setup();
    let hiker = Address::generate(&s.env);
    fund_and_mint(&s, &hiker, 1_000_000_000);
    for _ in 0..4 {
        let trail_id = String::from_str(&s.env, "trail-x");
        let note = String::from_str(&s.env, "routine condition note");
        s.registry.file_report(&hiker, &trail_id, &ConditionType::Clear, &note, &5_000_000);
    }
    assert_eq!(s.registry.report_count(), 4);
    let page = s.registry.list_reports(&0, &2);
    assert_eq!(page.len(), 2);
}

#[test]
fn test_unauthorized_writer_cannot_forge_reputation() {
    let s = setup();
    let hiker = Address::generate(&s.env);
    let rogue_contract = Address::generate(&s.env);
    let result = s.reputation.try_record_confirmation(&rogue_contract, &hiker, &10_i128);
    assert!(result.is_err());
}
