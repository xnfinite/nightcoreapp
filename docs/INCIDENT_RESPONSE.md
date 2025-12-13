Night Core Incident Response Model
Version

Night Core Console v1.0.0-beta

1. Purpose of This Document

This document defines how operators respond to security incidents detected or enforced by Night Core.

It answers:

What constitutes an incident

How incidents are detected

What actions are expected

What evidence is preserved

What Night Core does automatically

What requires human judgment

Night Core is not an alerting toy. It is an enforcement system.

2. Definition of an Incident

An incident is any event where execution trust is violated or degraded.

This includes, but is not limited to:

Execution of untrusted or unsigned code

Runtime behavior exceeding declared constraints

Policy violations

Unexpected WASM behavior

Agent-originated code attempting execution without approval

Repeated anomalous behavior across executions

Backend instability caused by tenant execution

Incidents can be prevented, contained, or observed, but all are logged.

3. Incident Detection
3.1 Automatic Detection

Night Core automatically detects incidents via:

Guardian Lock threat scoring

Signature verification failures

Runtime exit failures or panics

Resource usage anomalies

First-seen or unexpected SHA drift

Policy mismatches

Agent ingress violations

Detection is continuous and inline with execution.

3.2 Human Detection

Operators may identify incidents via:

Watchtower dashboards

Guardian decision logs

Timeline view

Quarantine vault entries

Inbox review (agent submissions)

Manual detection supplements automated controls.

4. Incident Severity Levels
4.1 Informational

Examples:

First-time execution of new tenant

Proof-mode verification only

Benign execution failures

Action:

Review optional

No enforcement required

4.2 Suspicious

Examples:

Elevated Guardian risk score

Unexpected runtime behavior

Repeated execution failures

Unknown SHA with valid signature

Action:

Review logs

Monitor tenant

Consider policy adjustment

4.3 High Risk

Examples:

Guardian score exceeds quarantine threshold

Runtime panic or abnormal exit

Policy violation

Repeated anomalous behavior

Action:

Automatic quarantine (if enabled)

Immediate review required

4.4 Critical

Examples:

Agent-submitted code executed without approval

Signature verification bypass attempt

Backend instability caused by tenant

Evidence of sandbox escape attempt

Action:

Immediate containment

Manual intervention required

External investigation recommended

5. Automatic Response Actions

Night Core performs the following automatically when configured:

Deny execution before runtime

Quarantine tenants exceeding risk thresholds

Prevent execution of unsigned code

Enforce policy constraints

Log all enforcement decisions

Automatic actions are deterministic and logged.

6. Quarantine Response
6.1 When Quarantine Occurs

Quarantine may be triggered by:

Guardian Lock risk score threshold

Explicit policy configuration

Repeated runtime failures

Suspected malicious behavior

Quarantine prevents further execution.

6.2 Operator Responsibilities

After quarantine:

Review Guardian decision logs

Inspect tenant metadata

Verify signature and provenance

Determine whether the behavior was expected

Decide whether to restore, delete, or leave quarantined

Quarantine is reversible only by human action.

7. Agent-Related Incidents
7.1 Detection

Agent-originated code is always marked and logged.

Incidents include:

Agent submission without approval

Unexpected agent execution attempts

Repeated agent submissions with anomalies

7.2 Required Response

For agent-related incidents:

Review Inbox entries

Inspect unsigned agent tenants

Verify whether approval occurred

Reject or delete suspicious submissions

Update policies if needed

Agents do not have implicit trust.

8. Evidence Preservation

Night Core preserves the following evidence automatically:

Guardian decision logs

Execution timelines

SHA history

Signature verification results

Quarantine events

Policy evaluation outcomes

Operators should not modify logs during investigation.

If logs are exported, originals must remain intact.

9. Forensic Review Process

A recommended forensic review includes:

Identify incident timestamp

Locate Guardian decision entry

Review tenant metadata

Check SHA drift history

Verify signing key used

Inspect execution duration and backend

Correlate with prior executions

Night Core provides all required data for this process.

10. Kill Switch Usage

The Kill Switch is a last-resort containment tool.

Use it when:

Multiple tenants misbehave simultaneously

Backend instability is observed

Immediate halt is required

Kill Switch terminates active runtimes but does not erase evidence.

11. Recovery Actions

After incident resolution:

Restore tenant only if trust is re-established

Re-sign code if appropriate

Update policies to prevent recurrence

Document findings externally if required

Night Core does not auto-recover from trust violations.

12. External Reporting

Night Core does not transmit incident data externally.

If reporting is required:

Export logs manually

Share masked paths only

Retain original logs for audit purposes

13. What Night Core Does Not Do

Night Core does not:

Automatically notify third parties

Suppress incident logs

Conceal execution failures

Override human judgment

Claim compliance certifications

It provides evidence, not opinions.

14. Design Intent

Night Core is designed so that every incident can be reconstructed.

If an incident cannot be reconstructed, the system has failed.