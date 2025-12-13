Threat Model — Night Core
1. Purpose

This document defines the threat model for Night Core, a local-first security platform for controlled execution of untrusted WebAssembly (WASM) workloads, including agent-submitted code.

It describes:

What Night Core is designed to protect

What attackers are assumed capable of

What threats are mitigated

What threats are explicitly out of scope

This model is intentionally conservative. Night Core does not claim to eliminate all risk; it is designed to contain, gate, observe, and enforce execution boundaries.

2. System Overview (Threat-Relevant)

Night Core consists of two primary components:

Worker Runtime

A standalone binary responsible for all execution

Enforces verification, policy checks, signing requirements, and sandboxing

Executes WASM via Wasmtime or Firecracker-backed isolation

Maintains logs and audit artifacts

GUI Console

A management interface only

Cannot execute code independently

Communicates with the Worker via explicit commands

Cannot bypass Worker enforcement logic

All execution authority lives exclusively in the Worker.

3. Assets to Protect

Night Core prioritizes protection of the following assets:

Host system integrity

User filesystem outside approved sandbox scope

Execution policy integrity

Audit logs and execution history

Signing keys and trust metadata

User awareness and consent over execution

Night Core does not treat the executed code itself as a protected asset.

4. Trust Boundaries

The following trust boundaries are enforced:

GUI → Worker
The GUI is untrusted for execution decisions. All enforcement occurs in the Worker.

Agent → Inbox
Agent-submitted code is treated as untrusted and non-executable until explicitly approved.

Unsigned → Signed Code
Unsigned WASM is never executed.

Execution → Observation
Execution results do not modify policies or trust state automatically.

5. Attacker Model

Night Core assumes attackers may have the following capabilities:

Ability to generate malicious WASM

Ability to submit code as an “agent”

Ability to attempt repeated submissions

Ability to induce runtime panics or crashes

Ability to exploit logic errors in executed code

Ability to observe their own execution results

Night Core does not assume attackers can:

Modify the Worker binary

Extract signing keys without filesystem access

Bypass OS-level permissions

Gain root/admin privileges through Night Core alone

6. In-Scope Threats (Mitigated)
6.1 Rogue Agent Execution

Threat:

An AI agent submits WASM that executes automatically.

Mitigation:

All agent submissions are routed into an Inbox.

Inbox entries are non-executable by default.

Explicit human approval and signing is required.

Execution without a valid signature is blocked.

6.2 Malicious WASM Payloads

Threat:

WASM attempts filesystem access, network access, or runtime abuse.

Mitigation:

WASI capability restrictions

Pre-execution policy checks

Post-execution threat scoring

Execution is contained within sandboxed runtime

6.3 Claude-Style Autonomous Agent Attacks

Threat:

Autonomous agents repeatedly generating and executing code to escalate behavior.

Mitigation:

Agents cannot execute directly.

Each submission requires human approval.

No automatic trust elevation.

No self-signing capability.

Night Core enforces a human-in-the-loop execution gate.

6.4 Execution Flooding / Abuse

Threat:

Rapid submission or execution attempts to overwhelm the system.

Mitigation:

Inbox staging prevents execution storms.

Execution concurrency limits

Manual approval breaks automation loops

6.5 Supply Chain Substitution

Threat:

Replacing a previously trusted module with a modified payload.

Mitigation:

SHA-256 hashing

First-seen vs known-hash tracking

Drift detection

Audit logs retain historical state

6.6 Silent Execution

Threat:

Code executes without the user realizing it ran.

Mitigation:

No background execution paths

GUI visibility of execution state

Dashboard and timeline logging

Popup notification for pending agent submissions

7. Out-of-Scope Threats (Not Mitigated)

Night Core explicitly does not claim to mitigate:

Kernel-level exploits

Hypervisor escapes

Compromised operating systems

Physical access attacks

Malicious hardware

Side-channel attacks

Compiler backdoors

Attacks requiring root/admin privileges

These are outside the design scope of a user-space execution controller.

8. Residual Risk

Night Core acknowledges residual risk in:

Sandbox implementation bugs

Zero-day vulnerabilities in WASM runtimes

Misconfiguration by users

Over-trusting signed modules

Night Core reduces risk; it does not eliminate it.

9. Design Philosophy

Night Core follows three principles:

Explicit Execution

Nothing runs without being clearly approved.

Separation of Control

UI cannot execute.

Worker cannot be bypassed.

Auditability Over Automation

Logs over heuristics.

Visibility over silent prevention.

10. Summary

Night Core is designed as an execution gate, not an autonomous defense system.

It assumes attackers are creative, persistent, and capable — and responds by enforcing:

Clear boundaries

Human approval

Cryptographic verification

Observable execution