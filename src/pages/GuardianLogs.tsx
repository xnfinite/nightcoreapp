import { useEffect, useMemo, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useSearchParams } from "react-router-dom";
import "./guardianlogs.css";

interface GuardianDecision {
  timestamp: string;
  tenant: string;
  backend: string;
  proof_mode: boolean;
  decision: string; // "allow" | "deny"
  reason: string;

  // ⭐ NEW — Threat Score
  threat_score?: number;
  threat_level?: string;
}

interface FullSystemStatus {
  worker_root: string;
}

type ViewMode = "table" | "cards";

export default function GuardianLogs() {
  const [events, setEvents] = useState<GuardianDecision[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [filterTenant, setFilterTenant] = useState("all");
  const [filterBackend, setFilterBackend] = useState("all");
  const [filterDecision, setFilterDecision] = useState("all");
  const [limit, setLimit] = useState("50");
  const [viewMode, setViewMode] = useState<ViewMode>("table");

  // ⭐ NEW: support ?tenant= in URL (deep-link from Guardian Dashboard)
  const [params] = useSearchParams();

  useEffect(() => {
    const preFilter = params.get("tenant");
    if (preFilter) setFilterTenant(preFilter);
  }, [params]);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const scan = (await invoke("get_full_system_scan")) as FullSystemStatus;
        const root = scan.worker_root;

        if (!root || root === "unknown") {
          setErrorMsg("Night Core worker root is unknown. Run the worker at least once.");
          return;
        }

        const raw = await invoke("read_file", {
          path: `${root}/logs/guardian_decisions.jsonl`,
        }).catch(() => null);

        if (!raw) {
          setErrorMsg("No Guardian decisions log found yet.");
          return;
        }

        const lines = (raw as string)
          .split("\n")
          .map((l) => l.trim())
          .filter((l) => l.length > 0);

        const parsed: GuardianDecision[] = [];
        for (const line of lines) {
          try {
            parsed.push(JSON.parse(line));
          } catch (e) {
            console.error("Failed to parse Guardian log line:", e, line);
          }
        }

        parsed.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
        setEvents(parsed);
        setErrorMsg(null);
      } catch (e) {
        console.error("Failed to load Guardian decisions:", e);
        setErrorMsg("Failed to load Guardian decisions.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const tenants = useMemo(
    () => Array.from(new Set(events.map((e) => e.tenant))).sort(),
    [events]
  );

  const backends = useMemo(
    () => Array.from(new Set(events.map((e) => e.backend))).sort(),
    [events]
  );

  // ⭐ Threat Level helper
  function threatLabel(score: number | undefined) {
    const s = score ?? 0;
    if (s <= 20) return { label: "Trusted", className: "threat-safe" };
    if (s <= 45) return { label: "Safe", className: "threat-trusted" };
    if (s <= 65) return { label: "Elevated", className: "threat-elevated" };
    if (s <= 84) return { label: "High", className: "threat-high" };
    return { label: "Quarantine", className: "threat-quarantine" };
  }

  // ⭐ Filtering
  const filtered = useMemo(() => {
    let list = events;

    if (filterTenant !== "all") list = list.filter((e) => e.tenant === filterTenant);
    if (filterBackend !== "all") list = list.filter((e) => e.backend === filterBackend);
    if (filterDecision !== "all") list = list.filter((e) => e.decision === filterDecision);

    if (limit !== "all") {
      const n = parseInt(limit, 10);
      if (!isNaN(n)) list = list.slice(0, n);
    }

    return list;
  }, [events, filterTenant, filterBackend, filterDecision, limit]);

  if (loading) {
    return (
      <div className="guardianlogs-page">
        <h2>Guardian Decision Logs</h2>
        <p className="guardianlogs-intro">Loading Guardian decisions…</p>
      </div>
    );
  }

  return (
    <div className="guardianlogs-page">
      <h2>Guardian Decision Logs</h2>
      <p className="guardianlogs-intro">
        Every allow/deny decision, threat score, and enforced policy from Guardian Lock.
      </p>

      {errorMsg && <p className="guardianlogs-error">{errorMsg}</p>}

      {/* Toolbar */}
      <div className="guardianlogs-toolbar">
        <div className="filters">
          <select value={filterTenant} onChange={(e) => setFilterTenant(e.target.value)}>
            <option value="all">All Tenants</option>
            {tenants.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>

          <select value={filterBackend} onChange={(e) => setFilterBackend(e.target.value)}>
            <option value="all">All Backends</option>
            {backends.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>

          <select value={filterDecision} onChange={(e) => setFilterDecision(e.target.value)}>
            <option value="all">All Decisions</option>
            <option value="allow">Allowed only</option>
            <option value="deny">Denied only</option>
          </select>

          <select value={limit} onChange={(e) => setLimit(e.target.value)}>
            <option value="25">Last 25</option>
            <option value="50">Last 50</option>
            <option value="100">Last 100</option>
            <option value="all">All</option>
          </select>
        </div>

        <div className="view-toggle">
          <button
            className={viewMode === "table" ? "mode-btn active" : "mode-btn"}
            onClick={() => setViewMode("table")}
          >
            Table
          </button>
          <button
            className={viewMode === "cards" ? "mode-btn active" : "mode-btn"}
            onClick={() => setViewMode("cards")}
          >
            Cards
          </button>
        </div>
      </div>

      {}
      {filtered.length === 0 ? (
        <p className="empty">No matching Guardian decisions.</p>
      ) : viewMode === "table" ? (
        <div className="guardianlogs-table-wrapper">
          <table className="guardianlogs-table">
            <thead>
              <tr>
                <th>Score</th>
                <th>Tenant</th>
                <th>Decision</th>
                <th>Backend</th>
                <th>Proof</th>
                <th>Timestamp</th>
                <th>Reason</th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((e, idx) => {
                const score = e.threat_score ?? 0;
                const label = threatLabel(score);

                return (
                  <tr key={idx} className={`row-${label.className}`}>
                    <td>
                      <span className={`score-pill ${label.className}`}>
                        {score}
                      </span>
                    </td>
                    <td>{e.tenant}</td>
                    <td>
                      <span
                        className={
                          e.decision === "allow"
                            ? "pill pill-allow"
                            : "pill pill-deny"
                        }
                      >
                        {e.decision}
                      </span>
                    </td>
                    <td>{e.backend}</td>
                    <td>{e.proof_mode ? "yes" : "no"}</td>
                    <td className="mono">{e.timestamp}</td>
                    <td className="reason-cell">{e.reason}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        
        <div className="guardianlogs-cards">
          {filtered.map((e, idx) => {
            const score = e.threat_score ?? 0;
            const label = threatLabel(score);

            return (
              <div className={`guardianlog-card ${label.className}`} key={idx}>
                <div className="gl-top-row">
                  <span className="gl-score">{score}</span>
                  <span className="gl-ts mono">{e.timestamp}</span>
                </div>

                <div className="gl-tenant">{e.tenant}</div>

                <div className="gl-meta">
                  <span>
                    <strong>Backend:</strong> {e.backend}
                  </span>
                  <span>
                    <strong>Decision:</strong>{" "}
                    <span
                      className={
                        e.decision === "allow"
                          ? "pill pill-allow"
                          : "pill pill-deny"
                      }
                    >
                      {e.decision}
                    </span>
                  </span>
                  <span>
                    <strong>Proof:</strong> {e.proof_mode ? "yes" : "no"}
                  </span>
                </div>

                <div className="gl-reason">
                  <strong>Reason:</strong> {e.reason}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
