Night Core Security Architecture
Version

Night Core Console v1.0.0-beta

1. Architectural Overview

Night Core is a security-first execution control system designed to gate, inspect, authorize, and observe untrusted WebAssembly workloads, including agent-originated code.

The system is intentionally split into two hard security domains:

Night Core Console (GUI)

Night Core Worker (Execution Runtime)

These domains are separated by process boundaries and strict command interfaces.
The GUI is not trusted to enforce execution rules.
All enforcement occurs inside the Worker.

2. Core Security Principles

Night Core is built on the following non-negotiable principles:

Enforcement lives in the execution runtime, not the UI

All code must be verified before execution

Agent-originated code is untrusted by default

Human approval is required for agent execution

All execution produces an auditable trail

Failure defaults to deny

3. Trust Boundaries
3.1 GUI (Untrusted Control Plane)

The Night Core Console:

Displays system state

Visualizes logs and decisions

Requests actions from the Worker

Never executes WASM

Never validates signatures

Never evaluates policies

Never overrides enforcement

The GUI can request, but cannot force, execution.

If the GUI is compromised, execution guarantees remain intact.

3.2 Worker (Trusted Enforcement Plane)

The Night Core Worker is the sole authority for:

Module verification

Signature validation

Agent inbox ingestion

Policy enforcement

Runtime execution

Quarantine decisions

Audit logging

All security-critical logic lives here.

4. Execution Flow (High Level)

Code enters the system (human or agent)

Code is staged, never executed immediately

Verification and policy checks are applied

Execution is allowed or denied

Results are logged immutably

There is no code path where unverified code is executed.

5. Module Verification Pipeline

Every module must pass the following checks before execution:

5.1 File Integrity

Module must exist as module.wasm

SHA-256 hash is calculated

Hash is recorded for drift detection

5.2 Signature Verification

Ed25519 signature required

Public key must be present

Signature must match module bytes exactly

Unsigned modules cannot execute.

6. Agent Ingress Firewall

Agent-submitted code is treated as hostile input.

6.1 Inbox Model

Agent submissions are placed into a dedicated inbox flow:

inbox/agent/pending/
inbox/agent/processed/
inbox/agent/rejected/


Code in the inbox cannot execute.

6.2 Ingestion Rules

Only .wasm files are accepted.

On ingestion:

A new tenant sandbox is created

A minimal manifest is generated

The source is labeled as agent

No signing is performed automatically

The resulting tenant is inert.

6.3 Approval Requirement

Agent tenants require explicit approval:

Human review via GUI

One-click approval triggers Worker signing

Signing uses a trusted maintainer key

Only after signing can execution occur

Without approval, the module is permanently blocked.

7. Policy Enforcement

Policies are evaluated inside the Worker before execution.

Current enforcement includes:

Signature presence

Manifest existence

First-seen SHA detection

Resource request evaluation

Backend allowance

Policy file presence

Policy failures result in:

Execution denial

Audit log entry

Optional quarantine marking

8. Runtime Isolation
8.1 Wasmtime Execution

WASI Preview 1

No host filesystem access unless explicitly allowed

No network access unless explicitly allowed

Deterministic entrypoint execution

8.2 Optional Firecracker Backend

MicroVM isolation

Separate kernel boundary

Treated as higher-risk backend

Subject to stricter scoring

9. Guardian Lock

Guardian Lock evaluates pre-execution and post-execution signals.

Inputs include:

Signature state

Runtime behavior

Exit status

Panic detection

Resource usage

Known SHA history

Guardian Lock cannot be bypassed by:

CLI flags

GUI actions

Agent behavior

Backend selection

10. Quarantine Model
10.1 Log-Based Quarantine (Current)

In beta, quarantine is enforced logically:

High-risk executions are flagged

Entries are written to immutable logs

UI displays quarantined tenants

Execution visibility is preserved

Physical isolation is planned for future versions.

11. Audit and Logging

Every meaningful action produces logs:

Verification events

Guardian decisions

Execution results

Anomaly detection

Timeline events

Logs are:

Append-only

Time-stamped

Deterministic

Read-only from the GUI

12. Anti-Bypass Guarantees

Night Core is explicitly designed to prevent:

GUI-initiated execution bypass

Agent self-approval

Signature spoofing

Silent execution

Hidden code paths

If a bypass is discovered, it is considered a security defect.

13. Failure Behavior

On any failure:

Execution is denied

State is preserved

Logs are written

System remains operational

Night Core does not fail open.

14. Security Posture Summary

Night Core provides:

Deterministic execution control

Human-in-the-loop agent governance

Cryptographic integrity

Strong runtime isolation

Transparent auditability

This architecture is intentionally conservative and biased toward safety.

15. Future Hardening (Planned)

Physical quarantine directories

Multi-key approval thresholds

Hardware-backed key storage

Formal policy schemas

External audit integrations

16. Scope Disclaimer

Night Core is not:

An antivirus

A network firewall

A sandbox escape detector

It is an execution governance system.

17. Conclusion

Night Core’s security architecture enforces a clear rule:

Code does not run unless the system explicitly allows it.

This rule applies equally to humans, agents, and automation.