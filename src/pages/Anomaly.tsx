// src/pages/Anomaly.tsx
import { useEffect, useState, useMemo } from "react";
import { invoke } from "@tauri-apps/api/core";
import "./anomaly.css";

interface DriftRecord {
  tenant: string;
  old_sha: string;
  new_sha: string;
  timestamp: string;
}

interface AnomalyReport {
  drift: DriftRecord[];
}

interface TimelineEntry {
  timestamp: string;
  tenant: string;
  event: string;
  status: string;
}

interface TimelineRun {
  run_id: string;
  entries: TimelineEntry[];
}

export default function Anomaly() {
  const [drift, setDrift] = useState<DriftRecord[]>([]);
  const [timelineRuns, setTimelineRuns] = useState<TimelineRun[]>([]);
  const [firecrackerLog, setFirecrackerLog] = useState<string>("");

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  
  useEffect(() => {
    (async () => {
      try {
        // Get correct bundled worker logs path from Tauri backend
        const logsDir = await invoke<string>("get_worker_logs_path");
        const logs = logsDir.endsWith("/") ? logsDir : logsDir + "/";

        const [driftRaw, timelineRaw, firecrackerRaw] = await Promise.all([
          invoke("read_file", { path: logs + "anomaly_drift.json" }).catch(() => null),
          invoke("read_file", { path: logs + "timeline.json" }).catch(() => null),
          invoke("read_file", { path: logs + "firecracker_boot.log" }).catch(() => null),
        ]);

        // Parse Drift File
        if (driftRaw) {
          try {
            const parsed = JSON.parse(driftRaw as string) as AnomalyReport;
            setDrift(parsed.drift || []);
          } catch (e) {
            console.error("Failed to parse anomaly_drift.json:", e);
            setErrorMsg("Invalid anomaly_drift.json format.");
          }
        }

        // Parse Timeline
        if (timelineRaw) {
          try {
            const parsed = JSON.parse(timelineRaw as string) as { runs: TimelineRun[] };
            setTimelineRuns(parsed.runs || []);
          } catch (e) {
            console.error("Failed to parse timeline.json:", e);
          }
        }

        // Parse Firecracker log
        if (firecrackerRaw) {
          setFirecrackerLog(firecrackerRaw as string);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  

  // Count drift events per tenant
  const tenantStats = useMemo(() => {
    const stats: Record<string, { count: number; lastTimestamp: string | null }> = {};
    for (const d of drift) {
      if (!stats[d.tenant]) stats[d.tenant] = { count: 0, lastTimestamp: null };
      stats[d.tenant].count += 1;
      stats[d.tenant].lastTimestamp = d.timestamp;
    }
    return stats;
  }, [drift]);

  const totalDrift = drift.length;
  const uniqueTenants = Object.keys(tenantStats).length;
  const lastDrift = drift.length ? drift[drift.length - 1].timestamp : "n/a";

  // Timeline entries (flattened)
  const recentTraceEntries: TimelineEntry[] = useMemo(() => {
    const all: TimelineEntry[] = [];
    for (const run of timelineRuns) {
      for (const e of run.entries || []) all.push(e);
    }
    return all.slice(-30).reverse();
  }, [timelineRuns]);

  const hasTimeout = useMemo(() => {
    if (!firecrackerLog) return false;
    return firecrackerLog.includes("Timeout") || firecrackerLog.includes("timeout");
  }, [firecrackerLog]);

  

  if (loading) {
    return (
      <div className="anomaly-page">
        <h2>Anomaly & Drift</h2>
        <p className="muted">Loading anomaly data…</p>
      </div>
    );
  }

  // Dynamic tenants for heatmap (AUTO instead of hardcoded)
  const driftTenants = Object.keys(tenantStats);

  return (
    <div className="anomaly-page">
      <h2>Security Anomalies & Drift</h2>
      <p className="muted">
        This view surfaces SHA drift, verification traces, and Firecracker boot issues detected by Night Core.
      </p>

      {errorMsg && <p className="error">{errorMsg}</p>}

      {/* Top Metric Cards */}
      <div className="cards-row">
        <div className="card">
          <div className="card-label">Total Drift Events</div>
          <div className="card-value">{totalDrift}</div>
        </div>

        <div className="card">
          <div className="card-label">Tenants Affected</div>
          <div className="card-value">{uniqueTenants}</div>
        </div>

        <div className="card">
          <div className="card-label">Last Drift</div>
          <div className="card-value small">{lastDrift}</div>
        </div>

        <div className={`card ${hasTimeout ? "card-bad" : "card-good"}`}>
          <div className="card-label">Firecracker Boot</div>
          <div className="card-value">
            {hasTimeout ? "Timeout / Error" : "OK / No Timeouts"}
          </div>
        </div>
      </div>

      {}
      <div className="layout-grid">
        <div className="panel">
          <h3>Tenant Drift Heatmap</h3>

          {driftTenants.length === 0 ? (
            <p className="muted">No drift detected.</p>
          ) : (
            driftTenants.map((tenant) => {
              const stat = tenantStats[tenant];
              let level: "none" | "low" | "high" = "none";

              if (stat.count >= 2) level = "high";
              else if (stat.count === 1) level = "low";

              return (
                <div className="heat-row" key={tenant}>
                  <span className="tenant-name">{tenant}</span>
                  <div className={`heatbox ${level}`} />
                </div>
              );
            })
          )}
        </div>

        <div className="panel">
          <h3>Drift Events</h3>
          {drift.length === 0 ? (
            <p className="muted">No drift detected.</p>
          ) : (
            <table className="drift-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Tenant</th>
                  <th>Old SHA</th>
                  <th>New SHA</th>
                </tr>
              </thead>
              <tbody>
                {drift.slice().reverse().map((d, i) => (
                  <tr key={i}>
                    <td>{d.timestamp}</td>
                    <td>{d.tenant}</td>
                    <td>{d.old_sha.slice(0, 16)}…</td>
                    <td>{d.new_sha.slice(0, 16)}…</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {}
      <div className="layout-grid">
        <div className="panel">
          <h3>Verification Trace</h3>

          {recentTraceEntries.length === 0 ? (
            <p className="muted">No trace entries.</p>
          ) : (
            <div className="trace-list">
              {recentTraceEntries.map((e, i) => (
                <div key={i} className="trace-row">
                  {/* NEW: Dot instead of emoji */}
                  <span
                    className={`trace-status-dot ${
                      e.status === "ok" ? "ok" : "error"
                    }`}
                  ></span>

                  <span className="trace-ts mono">{e.timestamp}</span>
                  <span className="trace-tenant mono">{e.tenant}</span>
                  <span className="trace-msg mono">{e.event}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="panel">
          <h3>Firecracker Boot Metrics</h3>
          {!firecrackerLog ? (
            <p className="muted">No Firecracker logs yet.</p>
          ) : (
            <pre className="firecracker-log">{firecrackerLog}</pre>
          )}
        </div>
      </div>
    </div>
  );
}
