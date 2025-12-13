Night Core Operational Security Model
Version

Night Core Console v1.0.0-beta

1. Purpose of This Document

This document defines how Night Core is expected to be deployed, operated, and maintained securely.

It is not a marketing guide.
It is a statement of operational assumptions, responsibilities, and guardrails.

Night Core enforces execution security.
Operational security ensures that enforcement remains meaningful.

2. Security Responsibility Model

Night Core follows a shared responsibility model.

Night Core Responsibilities

Enforce execution trust

Verify signatures and integrity

Enforce policies

Contain and log violations

Preserve evidence

Prevent unauthorized execution

Operator Responsibilities

Secure the host system

Control access to the GUI

Protect signing keys

Manage policies

Respond to incidents

Review logs and dashboards

Night Core assumes the operator is security-aware.

3. Deployment Environment Assumptions

Night Core assumes:

The host OS is not compromised

The Night Core Console is installed intentionally

File system permissions are respected

The operator controls user access

Night Core does not assume a hardened kernel, but benefits from one.

4. File System Security
4.1 Worker Root Protection

The worker root directory must be protected from unauthorized writes.

Recommended:

Restrict write access to the operator user

Prevent untrusted processes from modifying /modules, /logs, and /keys

If an attacker can write arbitrary files into the worker directory, no execution system can protect you.

4.2 Module Directory (/modules)

Only trusted users should add or modify tenant directories

Agent-ingested tenants must pass through the Inbox workflow

Unsigned modules should never execute

Night Core enforces signature checks, but operators must still protect the directory.

4.3 Log Directory (/logs)

Logs are security artifacts.

Logs should be append-only

Logs should not be deleted during investigations

Logs should be backed up if audit retention is required

Do not treat logs as disposable.

4.4 Quarantine Directory (/quarantine)

Quarantined tenants should be considered hostile until proven otherwise.

Do not manually execute quarantined code

Do not reintroduce quarantined tenants without review

5. Key Management
5.1 Signing Keys

Signing keys represent trust authority.

Recommendations:

Store private keys outside of version control

Restrict file permissions to the operator

Rotate keys if compromise is suspected

Use separate keys for GUI signing and maintainer signing

Night Core does not manage key escrow.

5.2 GUI Signing Keys

GUI-generated keys are convenience keys.

They should:

Be considered lower trust than maintainer keys

Only be used for local approval workflows

Be rotated if the GUI environment is compromised

6. Agent Interaction Security

Agents are treated as untrusted by default.

Operational requirements:

Agent submissions must enter through the Inbox

Approval must be explicit

Unsigned agent code must not execute

Inbox activity should be monitored regularly

Agents are not administrators.

7. Policy Management

Policies are security-critical configuration.

Recommendations:

Treat policy changes as code changes

Review policy edits carefully

Avoid overly permissive defaults

Document policy rationale externally if needed

Night Core enforces policies exactly as written.

8. Backend Security
8.1 Wasmtime

Wasmtime runs in-process.

Operational expectations:

Keep Wasmtime updated

Monitor for CVEs

Use conservative resource limits

Prefer proof mode when evaluating new code

8.2 Firecracker

Firecracker provides stronger isolation but higher complexity.

Operational expectations:

Secure Firecracker binaries

Restrict access to Firecracker sockets

Monitor microVM logs

Use Firecracker for higher-risk tenants

Firecracker is not a substitute for operational discipline.

9. GUI Security

The GUI is a control plane, not a sandbox.

Recommendations:

Restrict GUI access to trusted users

Do not expose GUI over untrusted networks

Lock the session when unattended

Treat GUI actions as privileged operations

If the GUI is compromised, enforcement decisions may be compromised.

10. Kill Switch Usage

The Kill Switch is an operational emergency tool.

Use it when:

Multiple tenants misbehave

Backends become unstable

Immediate containment is required

The Kill Switch halts execution, not investigations.

11. Update and Patch Strategy

Night Core does not auto-update itself.

Operators should:

Monitor upstream dependencies

Apply updates deliberately

Test updates in non-production environments

Validate behavior after updates

Security updates should not be deferred.

12. Backup and Recovery

Recommended backups:

Logs

Policies

Tenant manifests

Signature artifacts (not private keys)

Backups should be read-only and access-controlled.

13. Threats Outside Scope

Night Core does not protect against:

Host OS compromise

Kernel-level malware

Physical access attacks

Side-channel attacks outside execution scope

Night Core is not a replacement for endpoint security.

14. Operational Failure Modes

If Night Core fails operationally, it should fail closed:

Deny execution

Log failures

Require human intervention

If it fails open, treat it as an incident.

15. Design Intent

Operational security is what makes enforcement meaningful.

Night Core assumes:

You want proof, not promises

You prefer denial over ambiguity

You value reconstruction over convenience