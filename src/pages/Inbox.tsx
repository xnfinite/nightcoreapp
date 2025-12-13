import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import useProStatus from "../hooks/useProStatus";
import "./inbox.css";

interface InboxEntry {
  tenant: string;
  timestamp: string;
  signed: boolean;
  path: string;
}

export default function Inbox() {
  const pro = useProStatus();

  const [entries, setEntries] = useState<InboxEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  async function load() {
    try {
      const res = await invoke<InboxEntry[]>("list_agent_inbox");
      setEntries(res || []);
    } catch (e) {
      console.error("Failed to load inbox:", e);
    } finally {
      setLoading(false);
    }
  }

  async function approve(tenant: string) {
    setMsg("Approving agent submission...");
    try {
      await invoke("approve_agent_tenant", { tenant });
      setMsg("✔ Approved and signed");
      load();
    } catch (e) {
      console.error(e);
      setMsg("❌ Approval failed");
    }
  }

  async function reject(tenant: string) {
    setMsg("Rejecting agent submission...");
    try {
      await invoke("reject_agent_tenant", { tenant });
      setMsg("✔ Rejected");
      load();
    } catch (e) {
      console.error(e);
      setMsg("❌ Reject failed");
    }
  }

  // Poll every 3 seconds while page is open
  useEffect(() => {
    if (!pro.is_pro) {
      setLoading(false);
      return;
    }

    load();
    const id = setInterval(load, 3000);
    return () => clearInterval(id);
  }, [pro.is_pro]);

  if (!pro.is_pro) {
    return (
      <div className="policies-locked">
        <h2>Inbox — PRO Feature</h2>
        <p className="locked-msg">
          Agent submissions require Guardian PRO approval.
        </p>
      </div>
    );
  }

  if (loading) {
    return <div className="policies-loading">Loading inbox…</div>;
  }

  return (
    <div className="policies-page">
      <h1>Inbox</h1>
      <p className="subtitle">
        Agent-submitted WASM awaiting approval before execution.
      </p>

      {msg && <div className="q-msg">{msg}</div>}

      {entries.length === 0 && (
        <p className="empty">📭 No agent submissions.</p>
      )}

      <div className="policy-grid">
        {entries.map((e) => (
          <div key={e.tenant} className="policy-card">
            <h3>{e.tenant}</h3>

            <p className="q-field">
              <strong>Source:</strong> Agent
            </p>

            <p className="q-field">
              <strong>Status:</strong>{" "}
              {e.signed ? (
                <span className="status-approved">Approved</span>
              ) : (
                <span className="status-pending">Approval Required</span>
              )}
            </p>

            <p className="q-field small">{e.timestamp}</p>
            <p className="q-field small mono">{e.path}</p>

            {!e.signed && (
              <div className="policy-buttons">
                <button
                  className="btn-allow"
                  onClick={() => approve(e.tenant)}
                >
                  Approve
                </button>

                <button
                  className="btn-block"
                  onClick={() => reject(e.tenant)}
                >
                  Reject
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
