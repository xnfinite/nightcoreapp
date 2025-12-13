Night Core Compliance Position and System Limitations
Version

Night Core Console v1.0.0-beta

1. Purpose of This Document

This document defines what Night Core does and does not claim with respect to compliance, certification, and guarantees.

It exists to:

Prevent misrepresentation

Set correct expectations

Protect operators from over-claiming

Provide reviewers with a clear boundary of responsibility

Night Core prioritizes verifiable behavior over compliance labels.

2. Compliance Philosophy

Night Core is designed to support compliance efforts.
It is not itself a compliance certification.

Night Core provides:

Technical enforcement

Audit artifacts

Deterministic behavior

Verifiable logs

Policy enforcement mechanisms

Compliance is achieved through how Night Core is operated, not merely by installing it.

3. Supported Compliance Alignment (Informational)

Night Core can assist organizations working toward alignment with:

SOC 2 (security, integrity, availability controls)

ISO/IEC 27001 (technical controls and evidence)

NIST SP 800-53 (execution control, logging, integrity)

NIST SP 800-207 (Zero Trust principles)

Internal security policies and risk frameworks

Night Core does not certify compliance with any of these standards.

4. What Night Core Explicitly Does NOT Claim

Night Core does not claim:

SOC 2 certification

ISO certification

FedRAMP authorization

FIPS validation

Common Criteria certification

Regulatory approval

Legal compliance guarantees

Any such claims must come from independent audits.

5. Evidence and Audit Support

Night Core provides evidence, not opinions.

Evidence includes:

Immutable execution logs

Signature verification records

Policy decisions

Guardian Lock scores

Quarantine events

Timeline artifacts

Proof dashboards

Auditors evaluate evidence.
Night Core produces it.

6. Trust Boundaries and Assumptions

Night Core assumes:

The host system is trusted

Operators control access

Signing keys are protected

Logs are retained honestly

If these assumptions are violated, compliance claims are invalid.

7. Cryptographic Limitations

Night Core uses modern cryptography (e.g., Ed25519, SHA-256), but:

Cryptography is only as strong as key management

Compromised keys invalidate trust

Night Core does not manage key escrow

Night Core does not prevent deliberate misuse of trusted keys

Cryptography enforces intent, not ethics.

8. Execution Scope Limitations

Night Core enforces execution boundaries for WASM workloads.

It does not:

Inspect source code semantics

Prove functional correctness

Detect all malicious logic

Prevent logic bombs authored by trusted signers

Night Core enforces who may execute, under what conditions, and with what consequences.

9. AI and Agent Limitations

Night Core treats agents as untrusted code submitters.

It does not:

Guarantee AI safety

Analyze model intent

Validate training data

Prevent agents from attempting malicious submissions

Night Core ensures agents cannot execute without approval.

10. Operational Limitations

Night Core cannot compensate for:

Poor operational security

Ignored alerts

Unreviewed policies

Disabled logging

Overly permissive configurations

Misconfiguration weakens enforcement.

11. GUI and Control Plane Limitations

The GUI is a privileged interface.

Night Core does not:

Protect against GUI misuse by authorized users

Prevent intentional abuse by administrators

Enforce separation of duties unless configured externally

Administrative access implies responsibility.

12. Host and Environment Limitations

Night Core does not protect against:

Kernel-level compromise

Hypervisor escape

Physical access attacks

Hardware backdoors

OS-level malware

Night Core is not an endpoint protection platform.

13. Availability Guarantees

Night Core makes no uptime guarantees.

It does not claim:

High availability

Fault tolerance

Distributed redundancy

Availability is an architectural choice made by the operator.

14. Legal and Regulatory Disclaimer

Night Core is a technical system.

It does not provide:

Legal advice

Regulatory interpretation

Compliance certification

Risk acceptance decisions

Organizations remain responsible for their own compliance posture.

15. Intended Audience

This document is written for:

Security engineers

Compliance officers

Auditors

Enterprise reviewers

Legal teams evaluating scope

It is intentionally conservative.

16. Why These Limits Exist

Over-claiming security is a security failure.

Night Core is designed to:

Say exactly what it does

Prove what it enforces

Avoid claims it cannot guarantee

This restraint is intentional.

17. Final Statement

Night Core provides:

Control

Evidence

Enforcement

Transparency

It does not provide absolution.