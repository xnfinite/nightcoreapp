Night Core Formal Threat Model
Version

Night Core Console v1.0.0-beta

1. Purpose

This document defines the formal threat model for Night Core.

It answers:

What Night Core is protecting

Who the attackers are

What attacks are in scope

How attacks are mitigated

What risks remain intentionally unsolved

This document is written to support:

Internal security review

External audit

Enterprise evaluation

Responsible disclosure discussions

2. System Overview (Threat Modeling Scope)

Night Core is a local-first execution control and enforcement system for WebAssembly workloads.

Core components:

Night Core Worker (execution engine)

Night Core Console (GUI)

Guardian Lock (policy + scoring engine)

Agent Inbox (controlled ingress)

Audit and proof logging

Night Core runs inside the operator’s trust boundary and is not a network service by default.

3. Assets to Protect
3.1 Primary Assets

Host system integrity

Operator control over execution

Execution boundaries (WASM sandbox)

Cryptographic trust chain

Audit logs and forensic records

3.2 Secondary Assets

Tenant metadata

Policy definitions

Execution history

Threat scoring data

Night Core does not treat tenant code as confidential by default.

4. Trust Boundaries

Night Core defines explicit trust boundaries:

Human Operator

Highest authority

Explicit approval required for execution changes

Night Core Worker

Enforces execution

Does not make trust decisions on its own

GUI (Console)

Mediates human intent

Generates scoped signing keys

Agent Code

Untrusted by default

Cannot self-authorize execution

External Systems

Treated as untrusted

No implicit trust

Trust does not propagate automatically across boundaries.

5. Attacker Models
5.1 Malicious WASM Module

Capabilities:

Arbitrary WASM bytecode

Attempts to crash, loop, panic, or exhaust resources

Attempts to escape sandbox

Constraints:

Runs inside Wasmtime / Firecracker

Subject to time, memory, and policy limits

5.2 Malicious AI Agent

Capabilities:

Can generate or modify code

Can submit modules repeatedly

Can attempt social engineering via volume or naming

Constraints:

Cannot self-sign

Cannot bypass Inbox

Cannot bypass Guardian Lock

5.3 Compromised Tenant

Capabilities:

Previously trusted module turned malicious

Attempts persistence or evasion

Constraints:

SHA drift detection

Re-evaluation on every execution

Quarantine triggers

5.4 Local Attacker (Same User)

Capabilities:

Full file system access

Ability to modify files

Ability to run Night Core directly

Constraints:

Outside Night Core’s protection scope

Equivalent to full compromise

Night Core does not protect against hostile local users.

5.5 Supply Chain Attacker

Capabilities:

Tampered WASM artifacts

Replaced binaries

Modified dependencies

Constraints:

Signature verification

SHA-256 integrity checks

Manual approval requirements

6. Threat Categories (STRIDE-Inspired)
6.1 Spoofing

Threat:

Forged identity

Fake trusted module

Mitigations:

Ed25519 signatures

Explicit key trust lists

No implicit trust

Residual Risk:

Key compromise

6.2 Tampering

Threat:

Modified WASM after signing

Log manipulation

Mitigations:

SHA-256 integrity checks

Append-only logs

Drift detection

Residual Risk:

Local attacker modification

6.3 Repudiation

Threat:

Denying execution or approval actions

Mitigations:

Timestamped audit logs

Explicit approval records

Deterministic signatures

Residual Risk:

Clock manipulation

6.4 Information Disclosure

Threat:

Leaking data from execution

Mitigations:

WASI capability restrictions

No default filesystem or network access

Policy-based allowances

Residual Risk:

Side-channel attacks (out of scope)

6.5 Denial of Service

Threat:

Infinite loops

Resource exhaustion

Fork bombs (logical)

Mitigations:

Execution time limits

Memory limits

Kill Switch

Quarantine triggers

Residual Risk:

Host resource saturation

6.6 Elevation of Privilege

Threat:

Escaping WASM sandbox

Gaining host access

Mitigations:

Wasmtime sandboxing

Optional Firecracker isolation

No privileged syscalls

Residual Risk:

Sandbox vulnerabilities (upstream)

7. Agent-Specific Threats
7.1 Autonomous Execution

Threat:

Agent executing code without approval

Mitigation:

Inbox enforcement

Signature requirement

GUI approval step

7.2 Agent Flooding

Threat:

High-volume submissions

Mitigation:

Manual review

Operator-controlled acceptance

No auto-execution

7.3 Agent Impersonation

Threat:

Agent pretending to be trusted source

Mitigation:

No source-based trust

Signature-based trust only

8. Logging and Detection

Night Core logs:

Every verification attempt

Every execution

Every failure

Every quarantine decision

Logs are:

Append-only

Human-readable

Machine-parseable

Detection is deterministic, not heuristic-only.

9. Out-of-Scope Threats

Night Core does not defend against:

Host OS compromise

Kernel-level malware

Hardware attacks

Physical access attacks

Side-channel attacks

Network MITM outside execution context

These must be handled by system-level security controls.

10. Security Assumptions

Night Core assumes:

The operator controls the host

The OS is not malicious

Keys are stored securely

Dependencies are not intentionally compromised

Violating these assumptions invalidates guarantees.

11. Residual Risk Summary
Risk	Status
Malicious WASM	Mitigated
Malicious agent	Mitigated
Sandbox escape	Reduced, not eliminated
Key compromise	Operator responsibility
Local attacker	Out of scope
12. Design Philosophy

Night Core is designed to:

Fail closed

Require explicit intent

Log everything

Avoid silent trust escalation

Security decisions are visible, reviewable, and reversible.

13. Related Documents

SECURITY_ARCHITECTURE.md

TRUST_MODEL.md

KEY_MANAGEMENT.md

AUDIT_LOGGING.md

INCIDENT_RESPONSE.md

OPERATIONAL_SECURITY.md

COMPLIANCE_AND_LIMITATIONS.md