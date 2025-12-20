
Night Core Console — Beta README

Overview
Night Core is a security-first execution control system for WebAssembly (WASM). It is designed to act as an execution firewall between untrusted code (including AI agents) and the host system. Night Core enforces cryptographic verification, policy checks, runtime isolation, and human approval before any code is allowed to execute.

This repository contains the Night Core Console (GUI) and its integration with the Night Core Worker binary.

Architecture Summary
Night Core is split into two strict layers:

1. Night Core Worker
The Worker is the security authority. It performs:
- Ed25519 signature verification
- SHA-256 integrity tracking
- Policy enforcement (Guardian Lock)
- Runtime isolation using Wasmtime
- Auto-quarantine and audit logging

The Worker runs independently of the GUI and cannot be bypassed by UI code.

2. Night Core Console (GUI)
The Console is a control surface only. It:
- Displays logs, dashboards, and timelines
- Submits commands to the Worker
- Never executes untrusted code directly
- Cannot approve or run code without the Worker enforcing rules

Security Model
Night Core follows a deny-by-default model.

No WASM module can execute unless:
- The module exists inside the Worker-controlled modules directory
- The module has a valid Ed25519 signature
- The module passes Guardian Lock policy checks
- Runtime behavior does not exceed risk thresholds

Even if the GUI is compromised, the Worker continues to enforce all security guarantees.

Tenant Import (Browse or Drag-and-Drop)
Night Core supports importing untrusted WASM modules or tenant ZIP bundles through the GUI.

Supported methods:
- Drag-and-drop a .wasm or .zip file into the Tenant Drop Zone
- Click “Browse for File…” and select a .wasm or .zip file

When a file is imported:
- The Worker automatically creates a new tenant directory
- A manifest is generated if required
- The module is staged but not implicitly trusted
- No execution occurs automatically

Importing a file does not grant execution permission.

Agent Ingress Firewall
Night Core includes a dedicated Agent Inbox mechanism to safely handle AI-generated or automated code.

Agent submission flow:
1. An agent places a WASM file into the Worker inbox directory
2. The Worker detects the submission before any execution occurs
3. The module is staged as a tenant-agent-* module
4. The module cannot run because it is unsigned
5. The GUI displays the submission in the Inbox page
6. A human must explicitly approve or reject it
7. Approval triggers Worker-side signing
8. Only then can the module execute

At no point does agent code execute automatically.

Inbox Approval Guarantees
- Inbox access is gated behind Guardian PRO
- Read-only inbox viewer
- One-click approval triggers signing via the Worker
- Rejection deletes the module before execution
- All actions are logged and auditable

Inbox Notifications (PRO)
When Guardian PRO is enabled, the Console monitors the Agent Inbox for pending submissions.

If unsigned agent modules are detected:
- A popup notification appears in the GUI
- The notification displays the number of pending submissions
- Clicking the notification navigates directly to the Inbox page
- The popup can be dismissed manually

This ensures agent submissions cannot be ignored silently.

Guardian Lock
Guardian Lock is the policy and risk engine.

It evaluates:
- Module size
- Runtime duration
- Memory requests
- WASI filesystem access
- WASI network access
- Signature trust
- First-seen vs known modules

Guardian Lock can:
- Allow execution
- Flag high risk
- Trigger auto-quarantine
- Log all decisions

Quarantine (Beta)
Current beta uses log-based quarantine:
- High-risk executions are marked in logs
- Quarantine entries appear in the Quarantine Vault UI
- Restore/Delete actions are intentionally disabled in beta

This ensures visibility without destructive automation.

Runtime Isolation (Beta Note)
Night Core currently enforces isolation using Wasmtime.

Firecracker-based microVM isolation is planned, but is not yet connected in this beta build.
The UI may reference Firecracker as a future option, but all execution in the beta runs through Wasmtime only.

Why WASM (Not Containers)
WASM is used because:
- No ambient OS access by default
- Strong sandboxing guarantees
- Fast startup
- Deterministic execution
- Easy cryptographic verification

Firecracker integration will be added after the beta stabilization period.

Why This Stops Agent Attacks
Night Core stops autonomous or AI-generated code attacks because:
- Agents cannot execute code directly
- Agents cannot sign code
- Agents cannot bypass the inbox
- Agents cannot alter Worker policies
- Human approval is required for execution

Night Core turns execution into a gated, auditable act.

Beta Status
Included:
- Worker execution engine (Wasmtime)
- Guardian Lock
- Tenant import via drag-and-drop or file browse
- Agent Inbox (PRO)
- Inbox popup notifications (PRO)
- Quarantine Vault
- Proof dashboards
- Timeline and audit logs

Known Beta Limitations:
- Firecracker isolation is not yet connected
- Reload Worker button in Settings is present but not functional
- Some Settings actions are placeholders for post-beta work

License
Open-core model.
Worker core is MIT licensed.
Guardian PRO features require a paid license.

Guardian PRO (Beta)
Guardian PRO unlocks enforcement capabilities that go beyond observation.

PRO enables:
- Pre-execution denial of high-risk or quarantined modules
- Automatic quarantine before execution
- Policy editing and enforcement controls
- Kill switch for active runtimes
- Advanced Guardian Lock thresholds
- Agent Inbox approval workflow

PRO enforcement is local and does not depend on cloud services.
If a module is denied once, it does not get a second chance without human action.

Enable Guardian PRO (Beta)

Guardian PRO is enabled with a license key.

Purchase a Guardian PRO (Beta) license here:
https://nightcore-pro.lemonsqueezy.com/checkout/buy/354ecf08-e018-4757-8075-2c1e410e24c7

Activation steps:
1. Copy the license key provided by Lemon Squeezy
2. Open Night Core Console
3. Navigate to the Settings page
4. Paste the license key into the PRO activation field
5. PRO features unlock immediately without restarting the app

Licensing Notes (Beta)
- Licenses are device-bound locally
- Editing license files disables PRO
- Copying a license to another machine disables PRO
- No always-online requirement

Summary
Night Core is not a monitoring tool.
It is not a scanner.
It is an execution control system.

Nothing runs unless Night Core allows it.
