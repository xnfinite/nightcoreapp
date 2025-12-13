Security Contact
Reporting Security Issues

Night Core is a security-focused system. We take vulnerability reports seriously and encourage responsible disclosure.

If you believe you have discovered a security vulnerability in Night Core, please do not open a public GitHub issue.

Instead, report it privately using one of the methods below.

Preferred Contact Method

Email (preferred):

security@nightcore.app


Please include:

A clear description of the issue

Affected component (Worker, GUI, Guardian Lock, Inbox, etc.)

Steps to reproduce, if possible

Potential impact assessment

Any proof-of-concept code (if safe to share)

Encrypted email is supported.
If you require a public PGP key, request one in your initial message.

Alternate Contact (GitHub)

If email is not available, you may use GitHub Security Advisories:

Navigate to the Night Core repository:

https://github.com/xnfinite/nightcoreapp


Go to Security → Advisories

Submit a Private Security Advisory

This method ensures the report is visible only to maintainers.

Response Timeline

We aim to follow these response guidelines:

Initial acknowledgment: within 72 hours

Triage and validation: within 7 days

Mitigation or guidance: as soon as reasonably possible, depending on severity

Complex issues affecting cryptographic verification, sandboxing, or trust boundaries may require additional investigation time.

Responsible Disclosure Policy

We ask that reporters:

Allow reasonable time for investigation and remediation

Avoid public disclosure until an agreed resolution or timeline is reached

Avoid exploiting vulnerabilities beyond what is necessary to demonstrate impact

We commit to:

Treat reporters respectfully and professionally

Credit reporters where appropriate (if desired)

Communicate clearly about risk, scope, and remediation status

Scope

The following are in scope for security reports:

WASM sandbox execution

Guardian Lock enforcement

Signature verification (Ed25519)

Agent Inbox ingestion and approval flow

Policy enforcement and quarantine logic

GUI → Worker trust boundary

Audit logging and integrity guarantees

The following are out of scope:

Denial of service via resource exhaustion outside documented limits

Issues requiring physical access to the host system

Vulnerabilities introduced by user-modified or unsigned modules

Third-party dependencies without a demonstrated Night Core integration flaw

Legal Safe Harbor

Security research conducted in good faith, consistent with this policy, will not result in legal action by the Night Core maintainers.

This safe harbor does not apply to:

Data exfiltration

Service disruption

Unauthorized access to third-party systems

Exploitation beyond proof-of-concept

Status

Night Core is currently in public beta.
Security hardening is ongoing, and feedback from responsible researchers is welcome.