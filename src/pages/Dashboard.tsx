import { useEffect, useState, useMemo } from "react";
import { invoke } from "@tauri-apps/api/core";
import "./dashboard.css";

import {
  useGuardianDecisions,

} from "@/hooks/useGuardianDecisions";



function maskPath(path: string): string {
  if (!path || path === "unknown") return "Not Found";
  const parts = path.split("/");
  return `…/${parts[parts.length - 1]}`;
}



interface TenantInfo {
  name: string;
  has_wasm: boolean;
  has_sig: boolean;
  has_sha: boolean;
  has_pubkey: boolean;
  manifest: boolean;
}

interface LogStatus {
  dashboard_html: boolean;
  history_html: boolean;
  orchestration_json: boolean;
}

interface FullSystemStatus {
  worker_root: string;
  tenants: TenantInfo[];
  logs: LogStatus;
  firecracker_installed: boolean;
  worker_version: string;
  sdk_version: string;
}



export default function Dashboard() {
  const [scan, setScan] = useState<FullSystemStatus | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Guardian decisions (shared with Guardian page)
  const {
    decisions: guardianDecisions,
    loading: guardianLoading,
    error: guardianError,
  } = useGuardianDecisions(5000); // 5s auto-refresh

  
  useEffect(() => {
    invoke("get_full_system_scan")
      .then((res) => {
        setScan(res as FullSystemStatus);
      })
      .catch((err) => {
        console.error("SCAN ERROR:", err);
        setErrorMsg("Failed to load Night Core system scan.");
      });
  }, []);

  

  const totalTenants = useMemo(() => {
    return scan ? scan.tenants.length : 0;
  }, [scan]);

  const fullyReadyTenants = useMemo(() => {
    if (!scan) return 0;
    return scan.tenants.filter(
      (t) =>
        t.has_wasm &&
        t.has_sig &&
        t.has_sha &&
        t.has_pubkey &&
        t.manifest
    ).length;
  }, [scan]);

  const hasWorkerRoot = scan?.worker_root !== "unknown";

  const proofSurfaceOk =
    scan &&
    scan.logs.dashboard_html &&
    scan.logs.history_html &&
    scan.logs.orchestration_json;

  const allTenantsReady =
    scan && totalTenants > 0 && fullyReadyTenants === totalTenants;

  // Guardian stats
  const guardianAllowed = guardianDecisions.filter(
    (d) => d.decision === "allow"
  ).length;
  const guardianDenied = guardianDecisions.filter(
    (d) => d.decision === "deny"
  ).length;
  const guardianTotal = guardianDecisions.length;
  const guardianLast = guardianDecisions[0] || null;

  const guardianCompliance =
    guardianTotal === 0
      ? 100
      : Math.round((guardianAllowed * 100) / guardianTotal);

  const guardianRisk: "low" | "mid" | "high" =
    guardianDenied > 5 ? "high" : guardianDenied > 0 ? "mid" : "low";

  // System health now *includes* Guardian Lock risk
  const systemHealth =
    !scan
      ? "loading"
      : hasWorkerRoot &&
        allTenantsReady &&
        proofSurfaceOk &&
        guardianRisk === "low"
      ? "ok"
      : "warn";

  const backendSummaryText = scan
    ? scan.firecracker_installed
      ? "Wasmtime + Firecracker"
      : "Wasmtime only"
    : "loading";

  // Tenant risk heatmap input (Guardian decisions per-tenant)
  const guardianTenantStats = useMemo(() => {
    const stats: Record<string, { allows: number; denies: number }> = {};
    for (const d of guardianDecisions) {
      if (!stats[d.tenant]) stats[d.tenant] = { allows: 0, denies: 0 };
      if (d.decision === "allow") stats[d.tenant].allows += 1;
      if (d.decision === "deny") stats[d.tenant].denies += 1;
    }
    return stats;
  }, [guardianDecisions]);

  

  if (!scan && !errorMsg) {
    return (
      <div className="dashboard">
        <p>Loading Night Core system scan…</p>
      </div>
    );
  }

  if (!scan && errorMsg) {
    return (
      <div className="dashboard">
        <p className="error">{errorMsg}</p>
      </div>
    );
  }

  const data = scan!;

  

  return (
    <div className="dashboard">
      {}
      <div className="status-row">
        {/* System Health */}
        <div
          className={`status-card ${
            systemHealth === "ok" ? "ok" : "warn"
          }`}
        >
          <span className="label">System Health</span>
          <span className="value">
            {systemHealth === "ok" ? "Verified / Ready" : "Degraded"}
          </span>
          <div className="status-sub">
            {hasWorkerRoot ? "Root detected" : "Root missing"} •{" "}
            {allTenantsReady
              ? "All tenants verified"
              : `${fullyReadyTenants}/${totalTenants} tenants ready`}
          </div>

          <div className="sparkline">
            <div /><div /><div /><div /><div />
          </div>
        </div>

        {/* Tenants Ready */}
        <div className="status-card ok">
          <span className="label">Tenants Ready</span>
          <span className="value">
            {fullyReadyTenants}/{totalTenants}
          </span>
          <div className="status-sub">
            {totalTenants === 0
              ? "No tenants found under /modules"
              : "Tenants with wasm + sig + sha + key + manifest"}
          </div>
        </div>

        {/* Proof Surface */}
        <div
          className={`status-card ${
            proofSurfaceOk ? "ok" : "warn"
          }`}
        >
          <span className="label">Proof Surface</span>
          <span className="value">
            {proofSurfaceOk ? "Complete" : "Partial"}
          </span>
          <div className="status-sub">
            {proofSurfaceOk
              ? "Dashboards + Orchestration present"
              : "One or more proof files missing"}
          </div>
        </div>

        {/* Backend Summary */}
        <div
          className={`status-card ${
            data.firecracker_installed ? "ok" : "warn"
          }`}
        >
          <span className="label">Backends</span>
          <span className="value">{backendSummaryText}</span>
          <div className="status-sub">
            Wasmtime always available • Firecracker optional
          </div>
        </div>
      </div>

      {}
      <div className="guardian-summary">
        <div className="guardian-title">Guardian Lock Summary</div>
        <div className="guardian-sub">
          Mandatory execution-safety enforcement (LITE mode).
        </div>

        <div className="metric-row">
          <div className="metric-label">Compliance:</div>
          <div className="metric-value">{guardianCompliance}%</div>
        </div>

        <div className="metric-row">
          <div className="metric-label">Decisions Allowed:</div>
          <div className="metric-value">{guardianAllowed}</div>
        </div>

        <div className="metric-row">
          <div className="metric-label">Decisions Denied:</div>
          <div
            className="metric-value"
            style={{ color: "var(--nc-red)" }}
          >
            {guardianDenied}
          </div>
        </div>

        {guardianLast && (
          <div className="metric-row" style={{ marginTop: 10 }}>
            <div className="metric-label">Last Decision:</div>
            <div className="metric-value mono">
              {guardianLast.decision.toUpperCase()} — {guardianLast.tenant}
            </div>
          </div>
        )}

        <div className="guardian-strip">
          <div className={`strip-box ${guardianRisk === "low" ? "low" : ""}`} />
          <div className={`strip-box ${guardianRisk === "mid" ? "mid" : ""}`} />
          <div
            className={`strip-box ${guardianRisk === "high" ? "high" : ""}`}
          />
        </div>
      </div>

      {}
      <div className="grid">
        {/* Night Core Root */}
        <div className="dash-card">
          <h3>Night Core Root</h3>
          <p className="mono">{maskPath(data.worker_root)}</p>
          <ul className="card-list">
            <li>
              Worker root:{" "}
              {hasWorkerRoot ? "Detected" : "Not Found (run worker first)"}
            </li>
            <li>SDK: {data.sdk_version || "unknown"}</li>
            <li>Wasmtime: {data.worker_version || "unknown"}</li>
          </ul>
        </div>

        {/* Tenants */}
        <div className="dash-card">
          <h3>Tenants</h3>
          {totalTenants === 0 ? (
            <p>No tenants detected under /modules.</p>
          ) : (
            <div className="tenant-list">
              {data.tenants.map((t) => {
                const ready =
                  t.has_wasm &&
                  t.has_sig &&
                  t.has_sha &&
                  t.has_pubkey &&
                  t.manifest;

                return (
                  <div
                    key={t.name}
                    className={`tenant-row ${
                      ready ? "tenant-ok" : "tenant-warn"
                    }`}
                  >
                    <span className="tenant-name">{t.name}</span>
                    <span className="tenant-badges">
                      <span className={t.has_wasm ? "badge ok" : "badge bad"}>
                        wasm
                      </span>
                      <span className={t.has_sig ? "badge ok" : "badge bad"}>
                        sig
                      </span>
                      <span className={t.has_sha ? "badge ok" : "badge bad"}>
                        sha
                      </span>
                      <span
                        className={t.has_pubkey ? "badge ok" : "badge bad"}
                      >
                        key
                      </span>
                      <span
                        className={t.manifest ? "badge ok" : "badge bad"}
                      >
                        manifest
                      </span>
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Proof Files */}
        <div className="dash-card">
          <h3>Proof Files</h3>
          <ul className="card-list">
            <li>
              Dashboard HTML:{" "}
              <span
                className={data.logs.dashboard_html ? "ok-text" : "bad-text"}
              >
                {data.logs.dashboard_html ? "✔ Present" : "✘ Missing"}
              </span>
            </li>
            <li>
              History HTML:{" "}
              <span
                className={data.logs.history_html ? "ok-text" : "bad-text"}
              >
                {data.logs.history_html ? "✔ Present" : "✘ Missing"}
              </span>
            </li>
            <li>
              Orchestration JSON:{" "}
              <span
                className={
                  data.logs.orchestration_json ? "ok-text" : "bad-text"
                }
              >
                {data.logs.orchestration_json ? "✔ Present" : "✘ Missing"}
              </span>
            </li>
          </ul>
          <p className="card-hint">
            These files power the HTML dashboards and proof views inside the
            Console.
          </p>
        </div>

        {/* Backend Summary */}
        <div className="dash-card">
          <h3>Backend Summary</h3>
          <ul className="card-list">
            <li>Wasmtime backend: active</li>
            <li>
              Firecracker backend:{" "}
              <span
                className={
                  data.firecracker_installed ? "ok-text" : "bad-text"
                }
              >
                {data.firecracker_installed ? "Available" : "Not installed"}
              </span>
            </li>
          </ul>
          <p className="card-hint">
            Use <code>--backend firecracker</code> for microVM isolation when
            configured.
          </p>
        </div>

        {/* Guardian Tenant Risk Heatmap */}
        <div className="dash-card guardian-heatmap-card">
          <h3>Guardian Tenant Risk</h3>
          {data.tenants.length === 0 ? (
            <p className="guardian-heatmap-empty">No tenants registered.</p>
          ) : guardianLoading && guardianDecisions.length === 0 ? (
            <p className="guardian-heatmap-empty">Loading Guardian data…</p>
          ) : (
            <div className="guardian-heatmap-grid">
              {data.tenants.map((t) => {
                const stats = guardianTenantStats[t.name] || {
                  allows: 0,
                  denies: 0,
                };
                const { allows, denies } = stats;

                let level: "none" | "low" | "mid" | "high" = "none";
                if (denies === 0 && allows === 0) level = "none";
                else if (denies === 0 && allows > 0) level = "low";
                else if (denies <= 2) level = "mid";
                else level = "high";

                return (
                  <div
                    key={t.name}
                    className={`guardian-heat-cell guardian-${level}`}
                  >
                    <span className="guardian-heat-name">{t.name}</span>
                    <span className="guardian-heat-stats">
                      {denies > 0
                        ? `${denies} deny`
                        : allows > 0
                        ? `${allows} allow`
                        : "no data"}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {}
      <div className="dash-wide">
        <h3>Next Steps</h3>
        <p>
          Night Core Console is wired to your local worker, Guardian Lock, and
          SDK. For deeper visibility:
        </p>
        <ul>
          <li>
            Visit <strong>Tenants</strong> to see per-tenant health.
          </li>
          <li>
            Open <strong>Proof Logs</strong> and <strong>Timeline</strong> for
            verification traces.
          </li>
          <li>
            Check <strong>Anomaly</strong> for SHA drift and Firecracker boot
            issues.
          </li>
          <li>
            Use <strong>Backends</strong> to inspect Wasmtime / Firecracker
            configuration.
          </li>
          <li>
            Use <strong>Guardian</strong> and <strong>Decision Logs</strong> to
            review enforcement and block unsafe behavior.
          </li>
        </ul>
        {guardianError && (
          <p className="error" style={{ marginTop: "8px" }}>
            Guardian Lock data error: {guardianError}
          </p>
        )}
      </div>
    </div>
  );
}
