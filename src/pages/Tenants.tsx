import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import "./tenants.css";

interface TenantInfo {
  name: string;
  has_wasm: boolean;
  has_sig: boolean;
  has_sha: boolean;
  has_pubkey: boolean;
  manifest: boolean;
}

interface FullSystemStatus {
  tenants: TenantInfo[];
}

export default function Tenants() {
  const [scan, setScan] = useState<FullSystemStatus | null>(null);

  useEffect(() => {
    invoke("get_full_system_scan")
      .then((res) => setScan(res as FullSystemStatus))
      .catch((err) => console.error(err));
  }, []);

  if (!scan) {
    return <div className="tenants-page">Loading tenants...</div>;
  }

  return (
    <div className="tenants-page">
      <h2 className="tenants-title">Tenants</h2>

      {/* Empty state */}
      {scan.tenants.length === 0 ? (
        <p className="empty-msg">No tenants detected</p>
      ) : (
        <div className="tenant-grid">
          {scan.tenants.map((t) => {
            const healthy =
              t.has_wasm &&
              t.has_sig &&
              t.has_sha &&
              t.has_pubkey &&
              t.manifest;

            return (
              <div className="tenant-card" key={t.name}>
                {/* Header */}
                <div className="tenant-header">
                  <h3 className="tenant-name">{t.name}</h3>

                  <span
                    className={`health-pill ${healthy ? "ok" : "bad"}`}
                  >
                    {healthy ? "Verified" : "Issue"}
                  </span>
                </div>

                {/* File status */}
                <div className="tenant-status">
                  <p className={t.has_wasm ? "good" : "bad"}>module.wasm</p>
                  <p className={t.has_sig ? "good" : "bad"}>module.sig</p>
                  <p className={t.has_sha ? "good" : "bad"}>module.sha256</p>
                  <p className={t.has_pubkey ? "good" : "bad"}>pubkey.b64</p>
                  <p className={t.manifest ? "good" : "bad"}>manifest.json</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
