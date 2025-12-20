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

export default function WorkerControlPanel({ onRun }: { onRun: () => void }) {
  const [busy, setBusy] = useState(false);
  const [output, setOutput] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasTenants, setHasTenants] = useState(false);

  // Read backend choice from localStorage
  const backendPref =
    localStorage.getItem("nc-backend") || "wasmtime";

  // Detect tenants (staged OR installed)
  useEffect(() => {
    (async () => {
      try {
        const scan: any = await invoke("get_full_system_scan");

        const hasAnyTenants =
          (scan.tenants && scan.tenants.length > 0) ||
          (scan.staged && scan.staged.length > 0);

        setHasTenants(!!hasAnyTenants);
      } catch (err) {
        console.error("Tenant scan failed:", err);
        setHasTenants(false);
      }
    })();
  }, [onRun]);

  async function run(args: string[]) {
    setBusy(true);
    setError(null);
    setOutput(null);

    try {
      const result = await invoke<string>("run_worker_cmd", { args });
      setOutput(result);
      onRun();
    } catch (err: any) {
      setError(err.toString());
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="worker-panel">
      <h3 className="worker-title">Worker Control Panel</h3>

      {!hasTenants && (
        <div className="worker-no-tenants">
          <p>No tenants detected.</p>
          <p>Drop a WASM or ZIP file to stage your first tenant.</p>
        </div>
      )}

      <div className="worker-actions">
        {/* RUN ALL TENANTS */}
        <button
          disabled={busy || !hasTenants}
          onClick={() =>
            run([
              "run",
              "--all",
              "--backend",
              backendPref,
            ])
          }
        >
          <IconRun /> Run All Tenants
        </button>

        {/* PROOF MODE */}
        <button
          disabled={busy || !hasTenants}
          onClick={() =>
            run([
              "run",
              "--all",
              "--proof",
              "--backend",
              backendPref,
            ])
          }
        >
          <IconProof /> Proof Mode
        </button>

        {/* VERIFY ENV */}
        <button disabled={busy} onClick={() => run(["verify-env"])}>
          <IconEnv /> Verify Environment
        </button>

        {/* EXPORT DASHBOARD */}
        <button
          disabled={busy || !hasTenants}
          onClick={() => run(["export-dashboard"])}
        >
          <IconDashboard /> Export Dashboard
        </button>

        {/* INSPECT STATE */}
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
