Night Core is a security-first execution control system for WebAssembly (WASM). It is designed to act as an execution firewall between untrusted code (including AI agents) and the host system. Night Core enforces cryptographic verification, policy checks, runtime isolation, and human approval before any code is allowed to execute.

This repository contains the Night Core Console (GUI) and its integration with the Night Core Worker binary.

Architecture Summary

Night Core is split into two strict layers:

1. Night Core Worker
The Worker is the security authority. It performs:

Ed25519 signature verification
SHA-256 integrity tracking
Policy enforcement (Guardian Lock)
Runtime isolation using Wasmtime
Auto-quarantine signaling and audit logging

The Worker runs independently of the GUI and cannot be bypassed by UI code.

2. Night Core Console (GUI)
The Console is a control surface only. It:

Displays logs, dashboards, timelines, and quarantine state
Submits commands to the Worker
Never executes untrusted code directly
Cannot approve or run code without the Worker enforcing rules

Security Model

Night Core follows a deny-by-default model.

No WASM module can execute unless:

The module exists inside the Worker-controlled modules directory
The module has a valid Ed25519 signature
The module passes Guardian Lock policy checks
Runtime behavior does not exceed risk thresholds

Even if the GUI is compromised, the Worker continues to enforce all security guarantees.

Tenant Import (Browse or Drag-and-Drop)

Night Core supports importing untrusted WASM modules or tenant ZIP bundles through the GUI.

Supported methods:

Drag-and-drop a .wasm or .zip file into the Tenant Drop Zone
Click “Browse for File…” and select a .wasm or .zip file

When a file is imported:

The Worker automatically creates a new tenant directory
A manifest is generated if required
The module is staged but not implicitly trusted
No execution occurs automatically

Importing a file does not grant execution permission.

Agent Ingress Firewall

Night Core includes a dedicated Agent Inbox mechanism to safely handle AI-generated or automated code.

Agent submission flow:

An agent places a WASM file into the Worker inbox directory
The Worker detects the submission before any execution occurs
The module is staged as a tenant-agent-* module
The module cannot run because it is unsigned
The GUI displays the submission in the Inbox page
A human must explicitly approve or reject it
Approval triggers Worker-side signing
Only then can the module execute

At no point does agent code execute automatically.

Inbox Approval Guarantees

Inbox access is gated behind Guardian PRO

Read-only inbox viewer
One-click approval triggers signing via the Worker
Rejection removes the module before execution
All actions are logged and auditable

Inbox Notifications (PRO)

When Guardian PRO is enabled, the Console monitors the Agent Inbox for pending submissions.

If unsigned agent modules are detected:

A popup notification appears in the GUI
The notification displays the number of pending submissions
Clicking the notification navigates directly to the Inbox page
The popup can be dismissed manually

This ensures agent submissions cannot be ignored silently.

Guardian Lock

Guardian Lock is the policy and risk engine.

It evaluates:

Module size
Runtime duration
Memory requests
WASI filesystem access
WASI network access
Signature trust
First-seen vs known modules

Guardian Lock can:

Allow execution
Deny execution
Flag high risk
Trigger critical risk enforcement
Log all decisions

Guardian decisions are persistent and influence future execution attempts.

Quarantine (Beta)

The current beta uses log-based quarantine with persistent enforcement.

Behavior:

High-risk executions are recorded in Guardian logs
Quarantined or critical-risk modules are blocked on future runs
Quarantine entries appear in the Quarantine Vault UI
Restore/Delete actions are intentionally disabled in beta

This ensures visibility and enforcement without destructive automation.

Runtime Isolation (Beta Note)

Night Core enforces isolation using Wasmtime.

Firecracker-based microVM isolation is planned but is not yet connected in this beta build.
The UI may reference Firecracker as a future option, but all execution in the beta runs through Wasmtime only.

Runtime Architecture

Night Core uses a strict separation between bundled execution assets and runtime state.

Bundled Worker Root

src-tauri/resources/worker/

Runtime State Root

~/.nightcore/
  ├─ logs/
  ├─ state/
  ├─ pro/

All telemetry, Guardian decisions, timelines, and anomaly data are written to the runtime state root.

Why WASM (Not Containers)

WASM is used because:

No ambient OS access by default
Strong sandboxing guarantees
Fast startup
Deterministic execution
Easy cryptographic verification

Firecracker integration will be added after the beta stabilization period.

Why This Stops Agent Attacks

Night Core stops autonomous or AI-generated code attacks because:

Agents cannot execute code directly
Agents cannot sign code
Agents cannot bypass the inbox
Agents cannot alter Worker policies
Human approval is required for execution

Night Core turns execution into a gated, auditable act.

Beta Status

Included:

Worker execution engine (Wasmtime)
Guardian Lock
Ingestion Gate enforcement
Tenant import via drag-and-drop or file browse
Agent Inbox (PRO)
Inbox popup notifications (PRO)
Quarantine Vault
Proof dashboards
Timeline and audit logs

Known Beta Limitations:

Firecracker isolation is not yet connected
Reload Worker button in Settings is present but not functional
Some Settings actions are placeholders for post-beta work

License

Open-core model.
Worker core is MIT licensed.
Guardian PRO features require a paid license.

Guardian PRO (Beta)

Guardian PRO unlocks enforcement capabilities that go beyond observation.

PRO enables:

Pre-execution denial of high-risk or quarantined modules
Persistent critical risk enforcement (CRZ)
Policy editing and enforcement controls
Kill switch for active runtimes
Advanced Guardian Lock thresholds
Agent Inbox approval workflow

PRO enforcement is local and does not depend on cloud services.
If a module is denied once, it does not execute again without explicit human action.

Enable Guardian PRO (Beta)

Guardian PRO is enabled with a license key.

Purchase a Guardian PRO (Beta) license here:
https://nightcore-pro.lemonsqueezy.com/checkout/buy/354ecf08-e018-4757-8075-2c1e410e24c7

Activation steps:

Copy the license key provided by Lemon Squeezy
Open Night Core Console
Navigate to the Settings page
Paste the license key into the PRO activation field
PRO features unlock immediately without restarting the app

Licensing Notes (Beta)

Licenses are device-bound locally
Editing license files disables PRO
Copying a license to another machine disables PRO
No always-online requirement

Summary

Night Core is not a monitoring tool.
It is not a scanner.
It is an execution control system.

Nothing runs unless Night Core allows it.