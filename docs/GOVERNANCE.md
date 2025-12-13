Night Core Governance Model

This document defines how Night Core is governed, how decisions are made, and how trust is maintained over time.

Night Core is a security product. Governance is treated as part of the security surface, not as an afterthought.

Project Ownership

Night Core is currently governed by a single primary maintainer.

The maintainer is responsible for:

Architectural decisions

Security posture

Release approval

Licensing terms

Disclosure handling

Long-term direction

Centralized ownership is intentional at this stage to avoid trust dilution and inconsistent security decisions.

Scope of Governance

Governance applies to:

Execution control logic

Approval flows

Signing and trust boundaries

Audit logging behavior

Policy semantics

Security-relevant UI behavior

Release artifacts

Governance does not dictate:

User-defined policies

Deployment environment choices

Host-level security decisions

Trust Boundaries

Night Core explicitly defines trust boundaries:

Maintainer trust
The maintainer controls releases and signing logic.

Operator trust
The user or organization running Night Core controls:

Host security

Key storage

Policy definitions

Approval actions

Agent trust
Agents are treated as untrusted by default.

Trust is never implicit. It must be explicitly granted and can be revoked.

Decision Authority
Maintainer Decisions

The maintainer has final authority over:

Security model changes

Execution semantics

Approval mechanisms

Cryptographic choices

Dependency inclusion or removal

Security decisions prioritize correctness and clarity over speed or convenience.

Operator Decisions

Operators control:

Which code is approved

Which policies are enforced

When execution is allowed

Whether quarantine is enabled

Whether Firecracker isolation is used

Operators cannot override:

Signature verification requirements

Inbox approval flow semantics

Core audit logging behavior

Contribution Model

Night Core uses a review-only contribution model.

Contributions may include:

Bug reports

Documentation improvements

UI refinements

Non-security-critical enhancements

Contributions that affect security behavior require:

Explicit review

Clear threat analysis

Maintainer approval

Pull requests that weaken security guarantees will not be merged.

Release Governance
Release Criteria

A release is approved only when:

Execution behavior is deterministic

Approval paths are intact

Logging is complete and consistent

No silent execution paths exist

No agent can self-authorize

Security fixes may be released out of band.

Versioning

Night Core follows conservative versioning:

Breaking security changes require explicit version increments

Experimental features are clearly marked

Beta features do not silently become stable

Backward compatibility is secondary to security correctness.

Key and Signing Governance

Signing keys are not embedded in the GUI

Keys are operator-controlled

Approval actions require valid keys

Key rotation is supported by design

Loss of keys does not grant execution rights.

Incident Handling Authority

The maintainer controls:

Security advisories

Patch releases

Disclosure coordination

Operators control:

Local incident response

Log analysis

Quarantine actions

There is no automatic remote intervention.

Transparency Commitments

Night Core commits to:

Clear documentation of security behavior

Explicit execution flows

No hidden execution paths

No silent approvals

No telemetry by default

Security mechanisms are visible and inspectable.

Future Governance Evolution

As Night Core matures:

Additional maintainers may be introduced

A formal security advisory process may be established

Enterprise governance options may be offered

Any governance expansion will preserve:

Explicit trust boundaries

Human-in-the-loop control

Deterministic execution

Non-Goals

Governance explicitly does not aim to:

Maximize community voting

Optimize for speed over safety

Delegate security authority to automation

Hide security decisions behind abstraction

Night Core prioritizes responsibility over popularity.

Summary

Night Core governance is designed to:

Preserve trust

Prevent ambiguity

Maintain accountability

Protect execution intent

Security is enforced not just by code, but by how decisions are made.