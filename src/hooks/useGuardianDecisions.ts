import { useEffect, useState, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";

// ---------------------------------------------------------
// TypeScript interface for GuardianDecisionLite (matches Worker)
// ---------------------------------------------------------
export interface GuardianDecisionLite {
  timestamp: string;
  tenant: string;
  backend: string;
  proof_mode: boolean;

  decision: string;      // allow | deny
  reason: string;

  // Threat Engine
  threat_score: number;
  threat_label: string;
  threat_color: string;

  // Provenance
  sha256: string;
  first_seen: boolean;
  known_sha: boolean;

  // Metadata v2
  wasm_size_bytes: number;
  memory_request_mb: number;
  runtime_request_ms: number;
  wasi_fs_access: boolean;
  wasi_net_access: boolean;
  wasi_imports: string[];

  // Policy & backend
  policy_exists: boolean;
  backend_allowed: boolean;

  // Enterprise
  trusted_signer: boolean;
}

// ---------------------------------------------------------
// Hook: useGuardianDecisions
// autoRefreshMs (optional): poll Worker every X ms
// ---------------------------------------------------------
export function useGuardianDecisions(autoRefreshMs?: number) {
  const [decisions, setDecisions] = useState<GuardianDecisionLite[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Load once or on refresh
  const load = useCallback(async () => {
    try {
      // Load ALL rows from Worker
      const data = await invoke<GuardianDecisionLite[]>(
        "get_guardian_decisions"
      );

      if (!Array.isArray(data)) {
        setDecisions([]);
        return;
      }

      // ============================================================
      // ⭐ FIXED: Group by tenant and pick ONLY the newest decision
      // ============================================================

      // Sort newest → oldest
      const sorted = [...data].sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      // Map to hold the latest entry per tenant
      const latestByTenant = new Map<string, GuardianDecisionLite>();

      for (const entry of sorted) {
        if (!latestByTenant.has(entry.tenant)) {
          latestByTenant.set(entry.tenant, entry);
        }
      }

      // Result array
      const newest = Array.from(latestByTenant.values());

      setDecisions(newest);
      setError(null);
    } catch (err: any) {
      console.error("Failed to load guardian decisions:", err);
      setError(String(err));
      setDecisions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load + optional polling
  useEffect(() => {
    load();

    if (autoRefreshMs) {
      const interval = setInterval(load, autoRefreshMs);
      return () => clearInterval(interval);
    }
  }, [autoRefreshMs, load]);

  return {
    decisions,     // ⭐ already newest per tenant
    loading,
    error,
    refresh: load
  };
}
