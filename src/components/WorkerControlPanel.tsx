import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import "./workerpanel.css";

// SVG icons
const IconRun = () => (
  <svg width="16" height="16" strokeWidth="2" viewBox="0 0 24 24" fill="none">
    <polygon points="5 3 19 12 5 21 5 3" />
  </svg>
);

const IconProof = () => (
  <svg width="16" height="16" strokeWidth="2" viewBox="0 0 24 24" fill="none">
    <path d="M12 2l7 4v5c0 5-3.5 9-7 11-3.5-2-7-6-7-11V6l7-4z" />
  </svg>
);

const IconEnv = () => (
  <svg width="16" height="16" strokeWidth="2" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 6v6l4 2" />
  </svg>
);

const IconDashboard = () => (
  <svg width="16" height="16" strokeWidth="2" viewBox="0 0 24 24" fill="none">
    <rect x="3" y="3" width="7" height="7" />
    <rect x="14" y="3" width="7" height="7" />
    <rect x="14" y="14" width="7" height="7" />
    <rect x="3" y="14" width="7" height="7" />
  </svg>
);

const IconBrain = () => (
  <svg width="16" height="16" strokeWidth="2" viewBox="0 0 24 24" fill="none">
    <circle cx="8" cy="12" r="4" />
    <circle cx="16" cy="12" r="4" />
  </svg>
);

type TenantState = {
  id: string;
  name: string;
  ingestion: { channel: string; source: string; timestamp: string };
  authorization: { approved: boolean; approved_at: string | null; approved_by: string | null };
  execution: { has_executed: boolean; last_execution_time: string | null };
  observation: { current_threat_score: number | null; state: string };
};

export default function WorkerControlPanel({ onRun }: { onRun: () => void }) {
  const [busy, setBusy] = useState(false);
  const [output, setOutput] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasTenants, setHasTenants] = useState(false);
  const [hasPendingApproval, setHasPendingApproval] = useState(false);

  const backendPref = localStorage.getItem("nc-backend") || "wasmtime";

  async function refreshState() {
    try {
      const scan: any = await invoke("get_full_system_scan");
      const tenants = Array.isArray(scan?.tenants) ? scan.tenants : [];
      setHasTenants(tenants.length > 0);

      const states = await invoke<TenantState[]>("get_tenant_states");
      const pending = (states || []).some(
        (t) => !t.authorization.approved && !t.execution.has_executed
      );
      setHasPendingApproval(pending);
    } catch (err) {
      console.error("WorkerControlPanel refresh failed:", err);
      setHasTenants(false);
      setHasPendingApproval(false);
    }
  }

  useEffect(() => {
    refreshState();
  }, [onRun]);

  async function run(args: string[]) {
    setBusy(true);
    setError(null);

    try {
      const result = await invoke<string>("run_worker_cmd", { args });
      setOutput(result);
      onRun();
      refreshState();
    } catch (err: any) {
      setError(String(err));
    } finally {
      setBusy(false);
    }
  }

  function explainApprovalBlock() {
    setError(null);
    setOutput(
      [
        "Execution blocked: pending approvals detected.",
        "Approve tenants in Guardian Lock Watchtower (Pending Execution) first, then run again.",
      ].join("\n")
    );
  }

  const runBlocked = hasPendingApproval;

  return (
    <div className="worker-panel">
      <h3 className="worker-title">Worker Control Panel</h3>

      {!hasTenants && (
        <div className="worker-no-tenants">
          <p>No tenants detected.</p>
          <p>Drop a WASM or ZIP file to stage your first tenant.</p>
        </div>
      )}

      {hasTenants && hasPendingApproval && (
        <div className="worker-no-tenants">
          <p>Execution paused.</p>
          <p>One or more tenants require approval before running.</p>
        </div>
      )}

      <div className="worker-actions">
        <button
          disabled={busy || !hasTenants}
          onClick={() => {
            if (runBlocked) return explainApprovalBlock();
            return run(["run", "--all", "--backend", backendPref]);
          }}
        >
          <IconRun /> Run All Tenants
        </button>

        <button
          disabled={busy || !hasTenants}
          onClick={() => {
            if (runBlocked) return explainApprovalBlock();
            return run(["run", "--all", "--proof", "--backend", backendPref]);
          }}
        >
          <IconProof /> Proof Mode
        </button>

        <button disabled={busy} onClick={() => run(["verify-env"])}>
          <IconEnv /> Verify Environment
        </button>

        <button
          disabled={busy || !hasTenants}
          onClick={() => run(["export-dashboard"])}
        >
          <IconDashboard /> Export Dashboard
        </button>

        <button
          disabled={busy || !hasTenants}
          onClick={() => run(["inspect-state", "--all-tenants"])}
        >
          <IconBrain /> Inspect State
        </button>
      </div>

      {(output || error) && (
        <pre className={`worker-output ${error ? "err" : ""}`}>
          {error || output}
        </pre>
      )}
    </div>
  );
}
