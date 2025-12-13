Support and Lifecycle Policy
Overview

This document defines how Night Core is supported, maintained, and evolved over time.
Because Night Core is a security-critical system, stability, predictability, and transparency take priority over rapid feature churn.

Night Core follows a deliberate lifecycle model with clear support boundaries.

Product Status

Night Core is currently in public beta.

This means:

Core security architecture is implemented and enforced

APIs and file formats are largely stable

Additional hardening and refinements are ongoing

Some interfaces may change before a final stable release

Beta status does not mean experimental or unsafe, but it does mean continued iteration.

Editions and Support Scope
Open Core (MIT)

Applies to:

Core Worker runtime

Basic Guardian Lock enforcement

WASM verification and execution

CLI usage

Support level:

Best-effort via GitHub Issues

Community discussion and documentation

No guaranteed response time

Night Core Console (GUI)

Applies to:

Desktop application (Tauri)

Dashboard, Watchtower, Inbox, and Quarantine UI

Local orchestration and monitoring

Support level:

Best-effort during beta

Bug reports and reproducible issues prioritized

UI regressions treated as high priority if security-related

Guardian PRO

Applies to:

Policy engine

Quarantine management

Agent Inbox approval flow

Kill Switch

License-gated features

Support level:

Direct maintainer support

Faster triage for security and enforcement issues

Backward compatibility prioritized

Supported Platforms

During beta, Night Core officially supports:

Linux (x86_64)

Windows (via native or WSL)

macOS (x86_64 and Apple Silicon)

Other platforms may work but are not guaranteed.

Versioning Policy

Night Core uses semantic versioning:

MAJOR.MINOR.PATCH


MAJOR: Breaking changes to architecture, trust model, or APIs

MINOR: New features that do not break existing behavior

PATCH: Bug fixes, performance improvements, and security updates

During beta:

Minor versions may still include limited breaking changes

All breaking changes will be documented clearly

Security Updates

Security fixes follow a priority path:

Critical vulnerabilities: patched as soon as possible

High-risk issues: patched in the next scheduled release

Low-risk issues: patched as part of normal maintenance

When applicable:

Security advisories will be published

Mitigation guidance will be provided

Users will be informed of upgrade urgency

Backward Compatibility

Night Core aims to preserve:

Module formats

Signature verification behavior

Audit log structure

Policy semantics

If compatibility must be broken:

The change will be documented

Migration guidance will be provided

Old behavior will be deprecated before removal when feasible

Deprecation Policy

Features may be deprecated when:

They weaken security guarantees

They are replaced by safer mechanisms

They are no longer maintainable

Deprecation process:

Feature marked as deprecated in documentation

Warning added (CLI or logs where applicable)

Removal scheduled for a future major version

End of Support

End-of-support decisions may occur when:

A version is superseded by a safer architecture

Dependencies reach end-of-life

Continued support creates security risk

End-of-support notices will:

Be announced in advance

Include recommended upgrade paths

Never silently remove functionality

Support Channels

GitHub Issues (non-security issues)

GitHub Discussions (usage and design questions)

Security issues must follow SECURITY_CONTACT.md

Support is provided on a best-effort basis during beta.

Long-Term Vision

Night Core is designed as a long-lived security platform, not a disposable tool.

The goal is:

Stable foundations

Conservative evolution

Explicit trust boundaries

Clear accountability

This lifecycle policy exists to make those commitments explicit.