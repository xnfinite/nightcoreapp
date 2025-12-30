import { useMemo, useState } from "react";
import "./guardian.css";

import TenantDropZone from "@/components/TenantDropZone";
import WorkerControlPanel from "@/components/WorkerControlPanel";
import ApprovePanel from "@/components/ApprovePanel";

import { useGuardianDecisions, GuardianDecisionLite } from "@/hooks/useGuardianDecisions";
import { useTenantStates, TenantState } from "@/hooks/useTenantStates";

import useProStatus from "@/hooks/useProStatus";

interface SummaryStats {
  total: number;
  allowed: number;
  denied: number;
  quarantined: number;
  avgThreat: number;
  maxThreat: number;
  lastDecision: GuardianDecisionLite | null;
}

function displayValue(v?: string | null) {
  if (!v || v === "unknown") return "legacy (untracked)";
  return v;
}

export default function Guardian() {
  const pro = useProStatus();

  const {
    decisions,
    loading,
    error,
    refresh
  } = useGuardianDecisions(3000);

  const {
    tenants,
    loading: tenantsLoading,
    refresh: refreshTenants
  } = useTenantStates(3000);

  const [approveTarget, setApproveTarget] = useState<TenantState | null>(null);

  const pendingTenants = useMemo(() => {
    return tenants.filter((t: TenantState) =>
      t.observation.state === "pending_approval" ||
      t.observation.state === "cleared" ||
      t.observation.state === "blocked"
    );
  }, [tenants]);

  const summary: SummaryStats = useMemo(() => {
    if (decisions.length === 0) {
      return {
        total: 0,
        allowed: 0,
        denied: 0,
        quarantined: 0,
        avgThreat: 0,
        maxThreat: 0,
        lastDecision: null
      };
    }

    let allowed = 0;
    let denied = 0;
    let quarantined = 0;
    let sumThreat = 0;
    let maxThreat = 0;

    for (const d of decisions) {
      if (d.decision === "allow") allowed++;
      else denied++;

      const score = d.threat_score ?? 0;
      sumThreat += score;
      if (score > maxThreat) maxThreat = score;
      if (score >= 85) quarantined++;
    }

    return {
      total: decisions.length,
      allowed,
      denied,
      quarantined,
      avgThreat: Math.round(sumThreat / decisions.length),
      maxThreat,
      lastDecision: decisions[0] ?? null
    };
  }, [decisions]);

  const insightText = useMemo(() => {
    if (summary.total === 0) return "No Guardian activity yet.";

    if (summary.quarantined > 0)
      return `Quarantine triggered for ${summary.quarantined} module run(s).`;

    if (summary.avgThreat <= 20) return "Threat posture is low — system stable.";
    if (summary.avgThreat <= 45) return "Threat posture is moderate.";
    if (summary.avgThreat <= 65) return "Threat posture is elevated — monitor closely.";

    return "Threat posture is high — immediate review recommended.";
  }, [summary]);

  function threatClass(d: GuardianDecisionLite): string {
    const score = d.threat_score;
    if (score >= 85) return "threat-quarantine";
    if (score >= 65) return "threat-high";
    if (score >= 45) return "threat-elevated";
    if (score >= 20) return "threat-safe";
    return "threat-trusted";
  }

  return (
    <div className="guardian-page nc-content-inner">
      <h2 className="watchtower-title">Guardian Lock Watchtower</h2>

      {pro.is_pro && (
        <div className="guardian-pro-ribbon">
          Guardian PRO — Advanced Threat Analytics Enabled
        </div>
      )}

      <TenantDropZone onImported={() => { refresh(); refreshTenants(); }} />
      <WorkerControlPanel onRun={() => { refresh(); refreshTenants(); }} />

      {(loading || tenantsLoading) && (
        <div className="guardian-intro">Loading Watchtower…</div>
      )}

      {!loading && !tenantsLoading && (
        <>
          <p className="guardian-intro">
            The Watchtower exposes execution state, authorization, and runtime behavior.
            Threat analysis begins only after execution is authorized.
          </p>

          {error && <p className="guardian-error">{error}</p>}

          {pendingTenants.length > 0 && (
            <>
              <h3 className="section-title">Pending Execution</h3>

              <div className="guardian-tiles-grid">
                {pendingTenants.map((t: TenantState) => {
                  const needsApproval = !t.authorization.approved && !t.execution.has_executed;

                  return (
                    <div key={t.id} className="guardian-tile threat-pending">
                      <div className="tile-header">
                        <span className="tile-tenant">{t.name}</span>
                        <span className="tile-score">—</span>
                      </div>

                      <div className="tile-sub">
                        <span className="tile-label">Execution Pending</span>
                        <span className="tile-decision">{t.observation.state}</span>
                      </div>

                      <div className="tile-reason">
                        Ingestion: {displayValue(t.ingestion.channel)} / {displayValue(t.ingestion.source)}
                      </div>

                      <div className="tile-capabilities">
                        <span className="cap-badge">
                          Approved: {t.authorization.approved ? "Yes" : "No"}
                        </span>
                        <span className="cap-badge">
                          Executed: No
                        </span>
                      </div>

                      <div className="tile-actions">
                        {needsApproval && (
                          <button
                            className="btn-primary"
                            onClick={() => setApproveTarget(t)}
                          >
                            Review & Approve
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          <div className="guardian-summary-grid">
            <div className="guardian-summary-card">
              <div className="summary-label">Total Events</div>
              <div className="summary-value">{summary.total}</div>
            </div>

            <div className="guardian-summary-card">
              <div className="summary-label">Allowed</div>
              <div className="summary-value">{summary.allowed}</div>
            </div>

            <div className="guardian-summary-card">
              <div className="summary-label">Denied</div>
              <div className="summary-value">{summary.denied}</div>
            </div>

            <div className="guardian-summary-card">
              <div className="summary-label">Quarantine Hits</div>
              <div className="summary-value">{summary.quarantined}</div>
            </div>

            <div className="guardian-summary-card">
              <div className="summary-label">Avg Risk</div>
              <div className="summary-value">
                {summary.avgThreat}
                <span className="summary-score-suffix">/100</span>
              </div>
            </div>
          </div>

          <p className="guardian-insight">{insightText}</p>

          <h3 className="section-title">Threat Tiles (Recent Decisions)</h3>

          <div className="guardian-tiles-grid">
            {decisions.length === 0 ? (
              <p className="guardian-empty">No Guardian decisions logged yet.</p>
            ) : (
              decisions.slice(0, 12).map((d, idx) => {
                const cls = threatClass(d);

                return (
                  <div key={idx} className={`guardian-tile ${cls}`}>

                    <div className="tile-header">
                      <span className="tile-tenant">{d.tenant}</span>

                      <span className="tile-backend">
                        {d.backend}
                        {!d.backend_allowed && (
                          <span className="backend-warning">⚠</span>
                        )}
                      </span>

                      <span className="tile-signer">
                        {d.trusted_signer ? "✓ Signer" : "⚠ Untrusted"}
                      </span>

                      <span className="tile-score">{d.threat_score}</span>
                    </div>

                    <div className="tile-sub">
                      <span className="tile-label">{d.threat_label}</span>
                      <span className="tile-decision">{d.decision}</span>
                    </div>

                    <div className="tile-bar">
                      <div
                        className="tile-bar-fill"
                        style={{ width: `${d.threat_score}%` }}
                      />
                    </div>

                    <div className="tile-reason">{d.reason}</div>

                    <div className="tile-capabilities">
                      <span className="cap-badge">FS: {d.wasi_fs_access ? "Yes" : "No"}</span>
                      <span className="cap-badge">NET: {d.wasi_net_access ? "Yes" : "No"}</span>

                      {d.first_seen ? (
                        <span className="cap-badge new-build">NEW</span>
                      ) : (
                        <span className="cap-badge known-build">Known</span>
                      )}

                      <span className="cap-badge mem-badge">{d.memory_request_mb}MB</span>

                      {d.runtime_request_ms > 0 && (
                        <span className="cap-badge rt-badge">{d.runtime_request_ms}ms</span>
                      )}
                    </div>

                    <div className="tile-ts">{d.timestamp}</div>

                  </div>
                );
              })
            )}
          </div>

          <h3 className="section-title">Recent Guardian Decisions</h3>

          <div className="guardian-recent">
            {decisions.slice(0, 20).map((d, idx) => (
              <div key={idx} className="guardian-recent-row">
                <div>{d.threat_score}</div>
                <div>{d.tenant}</div>
                <div>{d.backend}</div>
                <div>{d.decision}</div>
                <div className="mono">{d.reason}</div>
              </div>
            ))}
          </div>
        </>
      )}

      {approveTarget && (
        <ApprovePanel
          tenant={approveTarget}
          onClose={() => setApproveTarget(null)}
          onApproved={() => { refresh(); refreshTenants(); }}
        />
      )}
    </div>
  );
}
