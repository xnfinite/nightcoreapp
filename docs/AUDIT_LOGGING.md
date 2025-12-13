Night Core Audit Logging Model
Version

Night Core Console v1.0.0-beta

1. Purpose of This Document

This document defines what Night Core logs, why it logs it, and how audit data is used to support:

Security investigations

Incident response

Compliance reviews

Trust verification

Forensic analysis

Audit logging is not a UI feature. It is a core security control.

2. Audit Philosophy

Night Core logging follows four principles:

Completeness – all security-relevant actions are logged

Immutability – logs cannot be altered by the GUI

Attribution – actions are tied to tenants, backends, and timestamps

Explainability – logs explain why a decision occurred, not just that it occurred

If an action affects execution trust, it is logged.

3. What Is Logged
3.1 Execution Events

Every execution attempt produces an audit record, including:

Tenant name

Backend used

Proof mode status

Timestamp

Execution duration

Exit status (success, failure, panic)

Runtime behavior summary

This applies even when execution is denied.

3.2 Verification Events

Verification logs include:

Module path (masked)

Signature verification result

Public key hash

SHA-256 hash

File size

First-seen vs known hash state

Unsigned or mismatched artifacts are always logged.

3.3 Guardian Lock Decisions

Guardian Lock produces structured logs containing:

Risk score

Risk label

Decision (allow, deny, quarantine)

Reason string

Metadata snapshot at time of decision

These logs are the authoritative explanation for trust outcomes.

3.4 Agent Ingress Events

Agent-originated activity is explicitly logged:

Inbox ingestion timestamp

Generated tenant name

Source attribution (“agent”)

Approval state

Signing event (if approved)

Rejection or deletion (if denied)

Agent code cannot silently enter execution paths.

3.5 Policy Evaluation

Policy enforcement logs capture:

Policy existence

Policy match results

Allow / block outcome

Policy file used

Policy changes do not retroactively alter prior logs.

3.6 Quarantine Events

Quarantine logs include:

Tenant identifier

Trigger condition

Guardian score at time of quarantine

Timestamp

Reason text

Quarantine is treated as a high-severity security event.

4. Log Storage Model
4.1 Log Location

All logs are written by the Worker under:

logs/


Key files include:

guardian_decisions.jsonl

orchestration_report.json

timeline.json

anomaly_drift.json

proof dashboards (HTML)

The GUI only reads these files.

4.2 Format

Primary audit logs use JSON Lines (JSONL) format.

Reasons:

Append-only behavior

Stream-friendly

Easy ingestion into SIEM tools

Line-level integrity

Each log entry is self-contained.

5. Immutability Guarantees

The following guarantees apply:

Logs are written by the Worker only

GUI has no write access

Logs are append-only

No UI action can delete or modify logs

Historical logs remain intact even after tenant deletion

If logs are missing, that absence is itself evidence.

6. Path Masking

All filesystem paths exposed to logs intended for UI use are masked.

Example:

/home/user/dev/nightcore-worker/modules/tenantA/module.wasm
→ worker://modules/tenantA/module.wasm


This prevents:

Host information leakage

Directory disclosure

Environment fingerprinting

Raw paths exist only inside the Worker runtime.

7. Audit Attribution

Each log entry includes enough context to answer:

What happened?

When did it happen?

To which tenant?

Under which backend?

Why was this decision made?

Human approval events are distinguishable from automated decisions.

8. Failure Logging

Failures are first-class audit events.

This includes:

Verification failures

Execution panics

Runtime errors

Backend crashes

Policy violations

Failure logs are not suppressed or summarized away.

9. Log Consumption

Logs are designed to support:

Manual review via the GUI

Export to external tools

Incident reconstruction

Compliance evidence

The GUI is a viewer, not an authority.

10. Compliance Alignment

Night Core audit logging aligns with common security expectations:

Zero-trust systems

Execution provenance

Least privilege enforcement

Change accountability

Post-incident traceability

No compliance claims are implied, but evidence is preserved.

11. What Is Not Logged

Night Core intentionally does not log:

Sensitive host secrets

Private signing keys

Full filesystem listings

GUI user interface actions unrelated to execution

Arbitrary stdout content beyond execution context

Logs are security-focused, not surveillance-oriented.

12. Log Retention

Log retention is user-controlled.

Night Core does not:

Auto-delete logs

Rotate logs silently

Transmit logs externally

Retention policies are explicit and external to the core runtime.

13. Incident Response Use

In an incident, audit logs allow operators to:

Identify the triggering tenant

Trace the execution path

Review Guardian decisions

Determine whether approval occurred

Validate whether trust was violated

This supports both internal response and external review.

14. Design Intent

Audit logging in Night Core is not cosmetic.

It exists to ensure that execution can always be explained.

If an execution cannot be explained, it is considered a failure.