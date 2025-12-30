import { useCallback, useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";

export interface TenantState {
  id: string;
  name: string;

  ingestion: {
    channel: string;
    source: string;
    timestamp: string;
  };

  authorization: {
    approved: boolean;
    approved_at: string | null;
    approved_by: string | null;
  };

  execution: {
    has_executed: boolean;
    last_execution_time: string | null;
  };

  observation: {
    current_threat_score: number | null;
    state: "pending_approval" | "blocked" | "cleared" | "observed";
  };
}

export function useTenantStates(autoRefreshMs?: number) {
  const [tenants, setTenants] = useState<TenantState[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await invoke<TenantState[]>("get_tenant_states");

      if (Array.isArray(data)) {
        setTenants(data);
      } else {
        setTenants([]);
      }

      setError(null);
    } catch (e: any) {
      console.error("Failed to load tenant states:", e);
      setError(String(e));
      setTenants([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();

    if (autoRefreshMs) {
      const id = setInterval(load, autoRefreshMs);
      return () => clearInterval(id);
    }
  }, [autoRefreshMs, load]);

  return {
    tenants,
    loading,
    error,
    refresh: load,
  };
}
