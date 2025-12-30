import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { TenantState } from "@/hooks/useTenantStates";
import "./approvePanel.css";

function displayValue(v: string | null | undefined) {
  if (!v || v === "unknown") return "legacy (untracked)";
  return v;
}

export default function ApprovePanel({
  tenant,
  onClose,
  onApproved,
}: {
  tenant: TenantState;
  onClose: () => void;
  onApproved: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function approve() {
    setBusy(true);
    setMessage("Approving…");

    try {
      await invoke("approve_agent_tenant", { tenant: tenant.name });
      setMessage("Approved and signed");
      onApproved();
      onClose();
    } catch (e: any) {
      setMessage(`Approval failed: ${String(e)}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="approve-panel-backdrop" onClick={onClose}>
      <div className="approve-panel" onClick={(e) => e.stopPropagation()}>
        <h3>Authorize Execution</h3>

        <p className="mono">{tenant.name}</p>

        <div className="approve-section">
          <strong>Ingestion</strong>
          <div>Channel: {displayValue(tenant.ingestion.channel)}</div>
          <div>Source: {displayValue(tenant.ingestion.source)}</div>
          <div className="mono">
            Timestamp: {displayValue(tenant.ingestion.timestamp)}
          </div>
        </div>

        <div className="approve-section">
          <strong>Authorization</strong>
          <div>Approved: {tenant.authorization.approved ? "Yes" : "No"}</div>
          <div>Approved by: {displayValue(tenant.authorization.approved_by)}</div>
        </div>

        <div className="approve-section">
          <strong>Execution</strong>
          <div>
            Threat score:{" "}
            {tenant.observation.current_threat_score ??
              "Pending (awaiting execution)"}
          </div>
        </div>

        <p className="approve-warning">
          Approving allows this code to execute on your system. This action is
          logged.
        </p>

        {message && <p className="approve-message">{message}</p>}

        <div className="approve-actions">
          <button onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button
            onClick={approve}
            disabled={busy || tenant.authorization.approved}
          >
            Approve for Execution
          </button>
        </div>
      </div>
    </div>
  );
}
