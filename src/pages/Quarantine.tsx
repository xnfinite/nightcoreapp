import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import useProStatus from "../hooks/useProStatus";
import "./quarantine.css";

interface QuarantineEntry {
  name: string;       // folder name
  tenant: string;     // tenant module name
  path: string;       // full quarantined directory
  timestamp: string;  // ISO time
  reason?: string;    // optional
}

export default function Quarantine() {
  const pro = useProStatus();
  const [entries, setEntries] = useState<QuarantineEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  async function load() {
    try {
      const res = await invoke<QuarantineEntry[]>("pro_list_quarantine");
      setEntries(res || []);
    } catch (e) {
      console.error("Failed to load quarantine list:", e);
    } finally {
      setLoading(false);
    }
  }

  async function restore(name: string) {
    setMsg("Restoring...");
    try {
      await invoke("pro_restore_quarantine", { name });
      setMsg("✔ Restored");
      load();
    } catch (e) {
      setMsg("❌ Restore failed: " + e);
    }
  }

  async function remove(name: string) {
    setMsg("Deleting...");
    try {
      await invoke("pro_delete_quarantine", { name });
      setMsg("✔ Deleted");
      load();
    } catch (e) {
      setMsg("❌ Delete failed: " + e);
    }
  }

  useEffect(() => {
    if (pro.is_pro) {
      load();
    } else {
      setLoading(false);
    }
  }, [pro.is_pro]);

  if (!pro.is_pro) {
    return (
      <div className="policies-locked">
        <h2>Quarantine — PRO Feature</h2>
        <p className="locked-msg">
          Activate Guardian PRO to review and manage quarantined tenants.
        </p>
      </div>
    );
  }

  if (loading) {
    return <div className="policies-loading">Loading quarantine…</div>;
  }

  return (
    <div className="policies-page">
      <h1>Quarantine Vault</h1>
      <p className="subtitle">
        Tenants that Guardian PRO isolated for safety. Restore or delete them here.
      </p>

      {msg && <div className="q-msg">{msg}</div>}

      {entries.length === 0 && <p className="empty">🎉 No quarantined tenants.</p>}

      <div className="policy-grid">
        {entries.map((e) => (
          <div key={e.name} className="policy-card block">
            <h3>{e.tenant}</h3>

            {e.reason && <p className="q-field"><strong>Reason:</strong> {e.reason}</p>}

            <p className="q-field small">{e.timestamp}</p>
            <p className="q-field small mono">{e.path}</p>

            <div className="policy-buttons">
              <button className="btn-allow" onClick={() => restore(e.name)}>
                Restore
              </button>
              <button className="btn-block" onClick={() => remove(e.name)}>
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
