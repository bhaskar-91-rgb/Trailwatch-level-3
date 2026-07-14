#![cfg(test)]

use super::*;
use soroban_sdk::testutils::Address as _;
use soroban_sdk::Env;

fn setup() -> (Env, VerifierReputationClient<'static>, Address, Address) {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let contract_id = env.register_contract(None, crate::VerifierReputation);
    let client = VerifierReputationClient::new(&env, &contract_id);
    client.initialize(&admin);

    let writer = Address::generate(&env);
    client.authorize_writer(&writer);

    (env, client, admin, writer)
}

#[test]
fn test_initialize_only_once() {
    let (env, client, _admin, _writer) = setup();
    let other = Address::generate(&env);
    assert!(client.try_initialize(&other).is_err());
}

#[test]
fn test_new_hiker_starts_at_baseline() {
    let (env, client, _admin, _writer) = setup();
    let hiker = Address::generate(&env);
    let stats = client.get_stats(&hiker);
    assert_eq!(stats.accuracy_score, 500);
    assert_eq!(stats.reports_confirmed, 0);
}

#[test]
fn test_record_confirmation_increases_score_and_earnings() {
    let (env, client, _admin, writer) = setup();
    let hiker = Address::generate(&env);

    let stats = client.record_confirmation(&writer, &hiker, &50_i128);
    assert_eq!(stats.reports_confirmed, 1);
    assert_eq!(stats.total_stake_earned, 50);
    assert_eq!(stats.accuracy_score, 520);
}

#[test]
fn test_record_confirmation_rejects_unauthorized_caller() {
    let (env, client, _admin, _writer) = setup();
    let hiker = Address::generate(&env);
    let rogue = Address::generate(&env);
    assert!(client.try_record_confirmation(&rogue, &hiker, &50_i128).is_err());
}

#[test]
fn test_record_confirmation_rejects_negative_stake() {
    let (env, client, _admin, writer) = setup();
    let hiker = Address::generate(&env);
    assert!(client.try_record_confirmation(&writer, &hiker, &(-1_i128)).is_err());
}

#[test]
fn test_record_refutation_penalizes_score() {
    let (env, client, _admin, writer) = setup();
    let hiker = Address::generate(&env);

    client.record_confirmation(&writer, &hiker, &50_i128); // 520
    let stats = client.record_refutation(&writer, &hiker);
    assert_eq!(stats.reports_refuted, 1);
    assert_eq!(stats.accuracy_score, 440); // 520 - 80
}

#[test]
fn test_score_capped_at_max() {
    let (env, client, _admin, writer) = setup();
    let hiker = Address::generate(&env);
    for _ in 0..30 {
        client.record_confirmation(&writer, &hiker, &1_i128);
    }
    assert_eq!(client.get_stats(&hiker).accuracy_score, 1000);
}

#[test]
fn test_trust_labels_reflect_score_bands() {
    let (env, client, _admin, writer) = setup();
    let baseline = Address::generate(&env);
    assert_eq!(client.trust_label(&baseline), String::from_str(&env, "Reliable"));

    let guardian = Address::generate(&env);
    for _ in 0..18 {
        client.record_confirmation(&writer, &guardian, &1_i128);
    }
    // 500 + 360 = 860 -> Trail Guardian
    assert_eq!(client.trust_label(&guardian), String::from_str(&env, "Trail Guardian"));
}
