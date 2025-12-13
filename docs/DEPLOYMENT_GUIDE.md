Night Core Deployment Guide
Version

Night Core Console v1.0.0-beta

1. Purpose of This Document

This document describes how to deploy Night Core safely and correctly.

It is written for:

Security engineers

Platform engineers

Operators responsible for production systems

Reviewers validating deployment practices

This guide assumes familiarity with:

Linux or Windows environments

Command-line tooling

Basic security hygiene

Application lifecycle management

2. Deployment Models Supported

Night Core supports the following deployment models:

2.1 Local Developer Machine

Single-user

Desktop GUI

Local worker runtime

Suitable for testing, demos, and development

2.2 Dedicated Host

One or more users

Controlled access

Centralized execution

Recommended for production use

2.3 Isolated Execution Host

Night Core runs on a hardened system

Access controlled via OS-level permissions

Logs exported externally

Recommended for sensitive workloads

Night Core does not require cloud infrastructure.

3. System Requirements
3.1 Operating System

Linux (preferred)

Windows (supported)

macOS (supported for development)

3.2 Runtime Dependencies

Wasmtime (required)

Firecracker (optional, advanced isolation)

Git (recommended)

Standard system utilities (cp, mv, pkill/taskkill)

3.3 Hardware

x86_64 recommended

Minimum 4 GB RAM

SSD storage recommended for logs

4. Directory Layout

A standard deployment follows this structure:

nightcore/
├── worker/
│   ├── nightcore (binary)
│   ├── modules/
│   ├── logs/
│   ├── guardian/
│   ├── quarantine/
│   ├── inbox/
│   └── keys/
└── console/
    ├── Night Core GUI
    └── resources/


The GUI resolves the worker directory at runtime and does not hardcode paths.

5. Installation Steps (Worker)

Place the Night Core worker binary in a dedicated directory.

Ensure execute permissions are set.

Verify Wasmtime is available in PATH.

Create required directories:

modules/

logs/

guardian/

inbox/

quarantine/

keys/

Run:

nightcore verify-env


This confirms the runtime is functional.

6. Installation Steps (GUI)

Install the Night Core Console application.

Ensure it includes the worker binary as a resource.

Launch the GUI.

Confirm the worker is detected under “System Status”.

Verify logs and modules directories are accessible.

The GUI never executes code directly; it invokes the worker.

7. Key Management Setup
7.1 Maintainer Keys

Stored under keys/maintainers/

Used to sign trusted tenants

Must be protected with filesystem permissions

7.2 GUI Signing Key

Generated automatically on first use

Stored under keys/gui/

Used only for explicit approvals via the GUI

Should not be shared across systems

Key compromise invalidates trust guarantees.

8. Policy Configuration

Policies are stored as JSON under:

guardian/policies.json


Operators should:

Define thresholds conservatively

Enable auto-quarantine only after testing

Review policy changes regularly

Policies are enforced at runtime, not advisory.

9. Agent Ingress Deployment

To enable agent submissions:

Ensure inbox directories exist:

inbox/agent/pending
inbox/agent/processed
inbox/agent/rejected


Verify inbox scanning is enabled in the worker.

Confirm the GUI Inbox page loads.

Test with a benign WASM submission.

Agents cannot bypass this path.

10. Logging Configuration

Logs are written locally under:

logs/


Operators should:

Back up logs regularly

Forward logs if required

Protect logs from modification

Retain logs per policy requirements

Night Core does not rotate logs automatically.

11. Quarantine Deployment

Quarantine behavior depends on configuration:

Log-only quarantine (default)

Physical isolation (future versions)

Operators must review quarantined tenants manually.

12. Firecracker Deployment (Optional)

Firecracker provides stronger isolation.

Requirements:

Linux host

Kernel and rootfs configured

Firecracker binary installed

Firecracker is optional and disabled by default.

13. Permissions and Hardening

Recommended practices:

Run Night Core as a dedicated user

Restrict write access to keys/

Restrict GUI access

Monitor system logs

Disable unused services

Night Core does not harden the OS for you.

14. Upgrade Process

Recommended upgrade flow:

Stop running executions

Back up logs and keys

Replace worker binary

Verify environment

Resume operations

Never overwrite keys during upgrade.

15. Failure Scenarios

If Night Core fails to start:

Check permissions

Verify dependencies

Inspect logs

Confirm paths

If execution fails:

Review Guardian logs

Inspect tenant signatures

Validate policies

Failures are logged deterministically.

16. Decommissioning

To decommission Night Core:

Stop all execution

Archive logs

Secure or destroy keys

Remove binaries

Keys should not be reused elsewhere.

17. Responsibility Statement

Deployment decisions directly affect security posture.

Night Core enforces boundaries.
Operators define them.

18. Related Documents

SECURITY_ARCHITECTURE.md

TRUST_MODEL.md

AUDIT_LOGGING.md

INCIDENT_RESPONSE.md

OPERATIONAL_SECURITY.md

COMPLIANCE_AND_LIMITATIONS.md