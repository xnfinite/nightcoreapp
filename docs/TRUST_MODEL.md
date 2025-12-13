Night Core Trust Model
Version

Night Core Console v1.0.0-beta

1. Purpose of This Document

This document defines who and what Night Core trusts, why that trust exists, and how the system behaves when trust is absent or violated.

Because Night Core is a security product that governs execution, its trust assumptions must be explicit, minimal, and enforceable.

This is not a theoretical model. It reflects the system as implemented.

2. Core Trust Philosophy

Night Core follows a zero-trust execution model with explicit trust escalation.

Key principles:

Nothing executes by default

Trust is earned, not assumed

Trust is scoped, not global

Trust can be revoked

Enforcement does not depend on the UI

3. Trust Domains

Night Core is divided into distinct trust domains with hard boundaries.

3.1 Night Core Worker (Trusted)

The Worker is the only trusted execution authority.

Trusted responsibilities:

Signature verification

Hash integrity checks

Agent inbox ingestion

Policy enforcement

Runtime execution

Guardian Lock decisions

Audit logging

If the Worker is compromised, Night Core’s guarantees no longer apply.

3.2 Night Core Console (Untrusted)

The GUI is not trusted for security enforcement.

The GUI may:

Display state

Request actions

Visualize logs

Trigger approval flows

The GUI may not:

Execute code

Validate signatures

Override policies

Bypass Guardian Lock

Force execution

If the GUI is compromised, execution safety remains intact.

3.3 Human Operator (Conditionally Trusted)

Humans are trusted only for explicit approval actions.

Human trust is:

Required for agent code approval

Limited to signing requests

Logged and auditable

Revocable by policy

Human approval does not bypass verification or runtime enforcement.

3.4 Agent Code (Untrusted by Default)

All agent-originated code is treated as hostile input.

Agent code:

Cannot execute automatically

Cannot self-approve

Cannot sign itself

Cannot bypass the inbox

Cannot escalate privileges

Trust must be explicitly granted by a human via signing.

4. Trust Levels

Night Core defines practical trust tiers.

4.1 Untrusted

Examples:

Agent submissions

Unsigned WASM

Unknown hashes

First-seen modules

Behavior:

Execution denied

Staged only

Visible in inbox

Awaiting approval

4.2 Conditionally Trusted

Examples:

Signed modules

Known SHA values

Modules with policies

Behavior:

Eligible for execution

Subject to Guardian Lock

Continuously monitored

Revocable at runtime

4.3 Revoked Trust

Examples:

Quarantined modules

High-risk executions

Policy violations

Behavior:

Execution blocked

Flagged in logs

Visible in UI

Requires explicit remediation

5. Cryptographic Trust
5.1 Signing Keys

Trust is anchored in Ed25519 keys.

Private keys are held outside the GUI

Public keys are stored with tenants

Signatures are mandatory for execution

Signature verification occurs in the Worker

No signature means no execution.

5.2 Hash Integrity

SHA-256 hashes are used to:

Detect drift

Identify known code

Detect tampering

Track historical execution

A hash change invalidates trust until re-approved.

6. Agent Trust Escalation Path

Agent code follows a strict path:

Ingested into inbox

Converted into inert tenant

Marked as agent-sourced

Awaiting approval

Explicit human signing

Verification and execution eligibility

There is no shortcut.

7. Backend Trust
7.1 Wasmtime

Default backend

Considered lower risk

Subject to WASI restrictions

7.2 Firecracker

Treated as higher risk

Stricter Guardian scoring

Explicit backend selection required

Backend selection does not bypass trust checks.

8. Guardian Lock as Trust Arbiter

Guardian Lock evaluates trust continuously.

It considers:

Pre-execution metadata

Runtime behavior

Panic detection

Exit codes

Resource usage

Historical reputation

Guardian Lock can revoke trust after execution, not just before.

9. Logging and Trust Transparency

Trust decisions are never silent.

Every decision produces:

A timestamped log entry

A reason string

A risk score

An immutable audit trail

Logs are readable but not modifiable by the GUI.

10. Failure and Compromise Scenarios
10.1 GUI Compromise

Impact:

UI manipulation possible

Execution safety unaffected

Worker enforcement remains active

10.2 Agent Misbehavior

Impact:

Execution denied or quarantined

No privilege escalation

Audit trail preserved

10.3 Policy Misconfiguration

Impact:

Execution defaults to deny

Visible in logs

Requires explicit correction

11. Trust Revocation

Trust can be revoked by:

Hash changes

Policy updates

Guardian Lock scoring

Manual quarantine

Backend violations

Revocation is immediate and enforced by the Worker.

12. What Night Core Does Not Trust

Night Core does not trust:

UI state

Client-side checks

Agent self-reports

Unsigned binaries

External automation

Timing assumptions

13. Design Intent

Night Core’s trust model is intentionally conservative.

It is designed to survive:

Malicious agents

Compromised UI

Operator mistakes

Unexpected runtime behavior

This is by design, not by accident.

14. Conclusion

Night Core’s trust model enforces a single rule:

Execution is a privilege, not a default.

Trust must be explicit, limited, auditable, and revocable.