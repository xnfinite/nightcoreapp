Night Core Security FAQ

This document answers common security questions about Night Core in clear, direct terms.
It is intended for engineers, security teams, auditors, and technically skeptical users.

What problem does Night Core solve?

Night Core prevents untrusted or semi-trusted code from executing without explicit control.

It is designed to stop:

Autonomous execution by AI agents

Silent execution of modified code

Execution drift over time

Accidental trust escalation

“It ran because it existed” failure modes

Night Core does not attempt to replace the operating system, container runtime, or kernel security.

Is Night Core a sandbox?

Night Core is not a sandbox by itself.

It orchestrates and enforces execution inside:

Wasmtime (WASM sandbox)

Optional Firecracker microVMs

Night Core controls:

When code is allowed to execute

Under what policies

With what provenance

With what audit trail

Sandboxing is provided by the underlying runtime.

What happens if a WASM module is malicious?

If a module is malicious:

It must pass signature verification

It must pass policy checks

It is time-bounded and memory-bounded

Its behavior is logged

Its threat score increases

It can be quarantined automatically

Night Core assumes WASM modules may be hostile by default.

Can an AI agent execute code automatically?

No.

By design:

Agents cannot self-sign

Agents cannot bypass the Inbox

Agents cannot approve themselves

Agents cannot escalate trust

Every agent-submitted module requires:

Human approval

A valid signature

Policy compliance

What is the Agent Inbox?

The Inbox is a hard execution firewall.

Any agent-submitted WASM:

Is staged, not executed

Appears in the Inbox

Requires manual approval

Can be rejected or deleted

This prevents silent execution and autonomous propagation.

What happens when an agent submission is approved?

Approval performs:

Explicit signing

Immutable provenance creation

Policy evaluation

Full audit logging

Approval does not grant permanent trust.

Every execution is still re-evaluated.

Can Night Core prevent sandbox escapes?

No system can guarantee that.

Night Core mitigates sandbox escape risk by:

Using mature WASM runtimes

Supporting Firecracker isolation

Restricting WASI capabilities

Applying strict execution limits

If a sandbox escape exists in the runtime, Night Core cannot fully prevent it.

Does Night Core hide vulnerabilities?

No.

Night Core:

Logs failures

Logs crashes

Logs panics

Logs execution drift

Failures are treated as security signals, not hidden errors.

How does Night Core detect changes in code?

Night Core uses:

SHA-256 hashing

Drift detection across executions

Signature verification

If code changes:

It is detected

It is re-scored

It may be quarantined

No execution is assumed safe because it ran once.

What is quarantine?

Quarantine is a logical isolation state.

When triggered:

Execution is flagged

Risk is recorded

The module is marked unsafe

Review is required

In beta, quarantine is log-based for transparency.

Physical movement is optional and may be enabled later.

Can logs be tampered with?

If an attacker has full local access, yes.

Night Core assumes:

The host is trusted

Logs are protected by OS controls

Night Core provides:

Append-only log structure

Deterministic formats

Explicit timestamps

Log immutability beyond that is the operator’s responsibility.

Is Night Core suitable for enterprise use?

Yes, with correct expectations.

Night Core provides:

Strong execution control

Clear auditability

Human-in-the-loop approval

Policy enforcement

It does not replace:

SIEM systems

Network security

Endpoint protection

Kernel hardening

What threats does Night Core NOT solve?

Night Core does not defend against:

Malicious local users

Kernel rootkits

Hardware attacks

Side-channel attacks

Network MITM outside execution context

These are outside its scope by design.

Does Night Core collect telemetry?

No by default.

Night Core:

Is local-first

Does not transmit data automatically

Logs only locally

Any external integration must be explicitly configured.

Is Night Core open source?

The Console UI and orchestration layers are open.

The Worker runtime and Guardian logic may be distributed separately depending on edition.

No execution secrets are embedded in the GUI.

Can Night Core be bypassed?

If an attacker:

Controls the OS

Controls the user account

Controls the filesystem

Then Night Core cannot protect against that.

Night Core enforces intent, not absolute control.

Why not just use Docker or containers?

Containers isolate environments.

They do not:

Prevent autonomous execution

Enforce human approval

Detect execution drift

Provide execution provenance

Prevent silent agent behavior

Night Core complements containerization.

What makes Night Core different?

Night Core enforces execution intent.

Code does not run because:

It exists

It was downloaded

It was generated

An agent requested it

Code runs because:

A human approved it

A policy allowed it

A signature verified it

An audit trail recorded it

Where can I report security issues?

Security issues should be reported privately.

A Responsible Disclosure policy will be provided separately.

Summary

Night Core is designed to be:

Explicit

Reviewable

Deterministic

Host-respecting

It does not promise magic.
It promises control.