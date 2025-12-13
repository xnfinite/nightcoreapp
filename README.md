
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
- Runtime isolation using Wasmtime and optional Firecracker
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

Agent Ingress Firewall
Night Core includes a dedicated Agent Inbox mechanism to safely handle AI-generated or automated code.

Flow:
1. An agent submits a WASM file into inbox/agent/pending
2. The Worker detects the submission before any execution occurs
3. The module is staged as a tenant-agent-* module
4. The module cannot run because it is unsigned
5. The GUI displays the submission in the Inbox
6. A human must explicitly approve it
7. Approval triggers Worker-side signing
8. Only then can the module execute

At no point does agent code execute automatically.

Inbox Approval Guarantees
- Read-only inbox viewer
- One-click approval triggers signing via the Worker
- Rejection deletes the module before execution
- All actions are logged and auditable

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
- Restore/Delete actions are disabled intentionally in beta

This ensures visibility without destructive automation.

Why WASM (Not Containers)
WASM is used because:
- No ambient OS access by default
- Strong sandboxing guarantees
- Fast startup
- Deterministic execution
- Easy cryptographic verification

Firecracker is supported for environments requiring VM-level isolation.

Why This Stops Agent Attacks
Night Core stops Claude-style or autonomous agent attacks because:
- Agents cannot execute code directly
- Agents cannot sign code
- Agents cannot bypass the inbox
- Agents cannot alter Worker policies
- Human approval is required for execution

Night Core turns execution into a gated, auditable act.

Beta Status
Included:
- Worker execution engine
- Guardian Lock
- Agent Inbox
- Inbox popup notifications
- Quarantine Vault
- Proof dashboards
- Timeline and audit logs

Planned Post-Beta:
- Physical quarantine moves
- Policy templates
- Enterprise policy packs
- Remote worker orchestration

License
Open-core model.
Worker core is MIT licensed.
Guardian PRO features require a paid license.

Summary
Night Core is not a monitoring tool.
It is not a scanner.
It is an execution control system.

Nothing runs unless Night Core allows it.
