import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import "./policies.css";
import useProStatus from "../hooks/useProStatus";



interface PolicyFile {
  allow: string[];
  block: string[];
}



export default function Policies() {
  const pro = useProStatus();   // { is_pro, tier, activated_at, refresh }
  const [loading, setLoading] = useState(true);
  const [policies, setPolicies] = useState<PolicyFile>({
    allow: [],
    block: [],
  });

  const [newEntry, setNewEntry] = useState("");

  
  async function loadPolicies() {
    try {
      const data = await invoke<PolicyFile>("pro_load_policies");
      setPolicies(data);
    } catch (err) {
      console.error("Failed to load policies:", err);
    } finally {
      setLoading(false);
    }
  }

  
  async function savePolicies(updated: PolicyFile) {
    setPolicies(updated);
    await invoke("pro_save_policies", { policies: updated });
  }

  

  function addAllow() {
    if (!newEntry.trim()) return;
    const updated = {
      ...policies,
      allow: [...policies.allow, newEntry.trim()],
    };
    savePolicies(updated);
    setNewEntry("");
  }

  function addBlock() {
    if (!newEntry.trim()) return;
    const updated = {
      ...policies,
      block: [...policies.block, newEntry.trim()],
    };
    savePolicies(updated);
    setNewEntry("");
  }

  function removeAllow(item: string) {
    const updated = {
      ...policies,
      allow: policies.allow.filter((x) => x !== item),
    };
    savePolicies(updated);
  }

  function removeBlock(item: string) {
    const updated = {
      ...policies,
      block: policies.block.filter((x) => x !== item),
    };
    savePolicies(updated);
  }

  
  useEffect(() => {
    if (pro.is_pro) loadPolicies();
  }, [pro.is_pro]);

  

  if (!pro.is_pro) {
    return (
      <div className="policies-locked">
        <h2>Policies — PRO Feature</h2>
        <p className="locked-msg">
          Unlock Guardian PRO to enable Allowlist / Blocklist editing.
        </p>
      </div>
    );
  }

  if (loading) return <div className="policies-loading">Loading policies…</div>;

  return (
    <div className="policies-page">
      <h1>Guardian Policies</h1>
      <p className="subtitle">
        Manage Allowlist and Blocklist for Guardian Watchtower.
      </p>

      {/* INPUT */}
      <div className="policy-input">
        <input
          type="text"
          placeholder="Enter pubkey / SHA entry"
          value={newEntry}
          onChange={(e) => setNewEntry(e.target.value)}
        />
      </div>

      <div className="policy-buttons">
        <button onClick={addAllow} className="btn-allow">
          + Add to Allowlist
        </button>
        <button onClick={addBlock} className="btn-block">
          + Add to Blocklist
        </button>
      </div>

      <div className="policy-grid">
        {/* Allowlist */}
        <div className="policy-card allow">
          <h3>Allowlist</h3>
          {policies.allow.length === 0 && (
            <p className="empty">No allowlist entries.</p>
          )}
          {policies.allow.map((item, i) => (
            <div key={i} className="policy-row">
              <span>{item}</span>
              <button onClick={() => removeAllow(item)}>x</button>
            </div>
          ))}
        </div>

        {/* Blocklist */}
        <div className="policy-card block">
          <h3>Blocklist</h3>
          {policies.block.length === 0 && (
            <p className="empty">No blocklist entries.</p>
          )}
          {policies.block.map((item, i) => (
            <div key={i} className="policy-row">
              <span>{item}</span>
              <button onClick={() => removeBlock(item)}>x</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
