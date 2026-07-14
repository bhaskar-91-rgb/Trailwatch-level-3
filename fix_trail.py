import sys

with open("contracts/trail-registry/src/lib.rs", "r") as f:
    content = f.read()

content = content.replace(
    "contract, contracterror, contractevent, contractimpl, contracttype, token, Address, Env,\n    String, Vec,",
    "contract, contracterror, contractimpl, contracttype, token, Address, Env,\n    String, Symbol, Vec,"
)

content = content.replace(
    'file = "../verifier-reputation/target/wasm32-unknown-unknown/release/verifier_reputation.wasm"',
    'file = "../../target/wasm32-unknown-unknown/release/verifier_reputation.wasm"'
)

structs_to_remove = """#[contractevent(topics = ["trail", "report_filed"])]
pub struct ReportFiledEvent {
    #[topic]
    pub report_id: u32,
    pub reporter: Address,
    pub trail_id: String,
}

#[contractevent(topics = ["trail", "corroborated"])]
pub struct CorroboratedEvent {
    #[topic]
    pub report_id: u32,
    pub voter: Address,
    pub confirmations: u32,
}

#[contractevent(topics = ["trail", "disputed"])]
pub struct DisputedEvent {
    #[topic]
    pub report_id: u32,
    pub voter: Address,
    pub disputes: u32,
}

#[contractevent(topics = ["trail", "confirmed"])]
pub struct ReportConfirmedEvent {
    #[topic]
    pub report_id: u32,
    pub reporter: Address,
    pub payout: i128,
}

#[contractevent(topics = ["trail", "refuted"])]
pub struct ReportRefutedEvent {
    #[topic]
    pub report_id: u32,
    pub reporter: Address,
}
"""
content = content.replace(structs_to_remove, "")

content = content.replace(
    """        ReportFiledEvent {
            report_id: id,
            reporter,
            trail_id,
        }
        .publish(&env);""",
    """        env.events().publish(
            (Symbol::new(&env, "trail"), Symbol::new(&env, "report_filed"), id),
            (reporter, trail_id)
        );"""
)

content = content.replace(
    """            CorroboratedEvent {
                report_id,
                voter,
                confirmations: report.confirmations,
            }
            .publish(&env);""",
    """            env.events().publish(
                (Symbol::new(&env, "trail"), Symbol::new(&env, "corroborated"), report_id),
                (voter, report.confirmations)
            );"""
)

content = content.replace(
    """            DisputedEvent {
                report_id,
                voter,
                disputes: report.disputes,
            }
            .publish(&env);""",
    """            env.events().publish(
                (Symbol::new(&env, "trail"), Symbol::new(&env, "disputed"), report_id),
                (voter, report.disputes)
            );"""
)

content = content.replace(
    """        ReportConfirmedEvent {
            report_id: report.id,
            reporter: report.reporter.clone(),
            payout,
        }
        .publish(env);""",
    """        env.events().publish(
            (Symbol::new(env, "trail"), Symbol::new(env, "confirmed"), report.id),
            (report.reporter.clone(), payout)
        );"""
)

content = content.replace(
    """        ReportRefutedEvent {
            report_id: report.id,
            reporter: report.reporter.clone(),
        }
        .publish(env);""",
    """        env.events().publish(
            (Symbol::new(env, "trail"), Symbol::new(env, "refuted"), report.id),
            report.reporter.clone()
        );"""
)

with open("contracts/trail-registry/src/lib.rs", "w") as f:
    f.write(content)

print("Done")
