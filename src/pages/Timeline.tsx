import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import "./timeline.css";

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

interface FullSystemStatus {
  worker_root: string;
  tenants: { name: string }[];
}

/* SVG STATUS DOTS (never show squares again) */
const StatusDot = ({ status }: { status: string }) => {
  const color =
    status === "ok"
      ? "#3BFF84"
      : status === "warn"
      ? "#FFD047"
      : "#FF4D67";

  return (
    <svg width="14" height="14">
      <circle cx="7" cy="7" r="6" fill={color} />
    </svg>
  );
};

export default function Timeline() {
  const [runs, setRuns] = useState<TimelineRun[]>([]);
  const [tenants, setTenants] = useState<string[]>([]);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [filterTenant, setFilterTenant] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  useEffect(() => {
    invoke("get_full_system_scan")
      .then(async (res) => {
        const scan = res as FullSystemStatus;

        // Keep tenant list exactly as before
        if (scan.tenants) {
          setTenants(scan.tenants.map((t) => t.name));
        }

        try {
          // ✅ Read runtime timeline log
          const raw = await invoke<string>("read_runtime_file", {
            rel: "logs/timeline.json",
          });

          if (!raw) return;

          const json = JSON.parse(raw);
          if (Array.isArray(json.runs)) {
            setRuns(json.runs);
          }
        } catch (e) {
          console.error("Failed to load timeline:", e);
        }
      })
      .catch(console.error);
  }, []);

  const toggle = (id: string) =>
    setCollapsed((p) => ({ ...p, [id]: !p[id] }));

  return (
    <div className="timeline-page">
      <h2>Timeline</h2>

      {/* Filters */}
      <div className="filters">
        <select
          value={filterTenant}
          onChange={(e) => setFilterTenant(e.target.value)}
        >
          <option value="all">All Tenants</option>
          {tenants.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="all">All Events</option>
          <option value="ok">Success</option>
          <option value="warn">Warning</option>
          <option value="error">Errors</option>
        </select>
      </div>

      {/* Runs */}
      {runs.map((run) => {
        const isClosed = collapsed[run.run_id] ?? false;

        return (
          <div className="timeline-run" key={run.run_id}>
            <div className="run-header" onClick={() => toggle(run.run_id)}>
              <span className="chevron">{isClosed ? "▶" : "▼"}</span>
              <span className="run-id">{run.run_id}</span>
            </div>

            {!isClosed && (
              <div className="run-entries">
                {run.entries
                  .filter(
                    (e) =>
                      (filterTenant === "all" || e.tenant === filterTenant) &&
                      (filterStatus === "all" || e.status === filterStatus)
                  )
                  .map((e, i) => (
                    <div className="timeline-entry" key={i}>
                      <div className="icon">
                        <StatusDot status={e.status} />
                      </div>

                      <div className="timestamp">{e.timestamp}</div>
                      <div className="tenant">{e.tenant}</div>
                      <div className="msg">{e.event}</div>
                    </div>
                  ))}

                {run.entries.filter(
                  (e) =>
                    (filterTenant === "all" || e.tenant === filterTenant) &&
                    (filterStatus === "all" || e.status === filterStatus)
                ).length === 0 && (
                  <p className="empty">No matching entries</p>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
