Night Core Roadmap
Purpose

This document outlines the planned evolution of Night Core as a security-focused execution control platform.

The roadmap prioritizes:

Security correctness over speed

Explicit trust boundaries

Operational stability

Measurable enforcement guarantees

Dates are intentionally omitted. Progress is milestone-driven, not calendar-driven.

Current State (Public Beta)

Night Core currently provides:

WASM module verification (Ed25519 + SHA-256)

Deterministic execution via Wasmtime

Guardian Lock enforcement (pre-exec and post-exec)

Threat scoring and decision logging

Quarantine (log-based)

Agent Inbox with explicit approval flow

Desktop Console (Tauri) with Watchtower dashboards

PRO licensing and policy enforcement

This represents a functional security system, not a prototype.

Phase 1 — Beta Hardening (In Progress)

Focus: Stability, correctness, and operational trust.

Planned work:

Harden Inbox approval workflows

Improve error reporting and failure visibility

Expand Guardian decision explanations

Reduce false positives in threat scoring

Improve documentation clarity and completeness

Finalize security documentation set

Non-goals:

New execution backends

Distributed systems

AI-driven automation

Phase 2 — Stable Release (v1.x)

Focus: Freezing core behavior and APIs.

Planned work:

Declare stable module format

Lock Guardian Lock policy semantics

Freeze audit log structure

Formalize upgrade paths

Add configuration validation

Improve CLI ergonomics

This phase establishes Night Core as a reliable control plane suitable for long-term use.

Phase 3 — Advanced Enforcement

Focus: Stronger execution guarantees.

Planned work:

Memory and execution budget enforcement

Backend-specific policy constraints

Expanded provenance tracking

Improved sandbox escape detection

Policy simulation and dry-run modes

This phase strengthens Night Core’s role as an execution firewall.

Phase 4 — Multi-Backend Expansion

Focus: Controlled backend diversity.

Potential backends:

Firecracker microVMs (expanded support)

Container-based execution (Docker / OCI)

Remote execution targets

All backends must:

Preserve the trust model

Produce auditable results

Remain policy-enforced

Backend support will not compromise security guarantees.

Phase 5 — Enterprise and Operations

Focus: Governance, scale, and compliance.

Planned work:

Role-based access controls

Policy versioning and approvals

Centralized audit export

Multi-node orchestration

Compliance reporting tools

This phase targets regulated and high-assurance environments.

Phase 6 — Automation and Intelligence (Optional)

Focus: Assisted operations, not autonomous control.

Potential features:

Policy recommendation (not auto-enforcement)

Anomaly clustering

Historical behavior analysis

Operator-in-the-loop decision support

Night Core will not:

Autonomously approve execution

Replace human accountability

Hide decision logic behind opaque models

Explicit Non-Goals

Night Core will not become:

A general-purpose orchestrator

A container runtime replacement

An autonomous AI agent framework

A black-box security product

The system exists to enforce, not obscure.

Roadmap Principles

Security beats features

Transparency beats convenience

Human approval beats automation

Logs are authoritative

Trust must be explicit

Any roadmap change must uphold these principles.

Status Updates

Roadmap updates will be published via:

Repository documentation

Release notes

GitHub Discussions

Major changes will never be silent.