import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import "./settings.css";

import useProStatus from "../hooks/useProStatus";

interface FullSystemStatus {
  worker_root: string;
  sdk_version: string;
  worker_version: string;
  firecracker_installed: boolean;
}

export default function Settings() {
  const [scan, setScan] = useState<FullSystemStatus | null>(null);

  // --- LOCAL SETTINGS (theme + backend)
  const [theme, setTheme] = useState<string>(
    localStorage.getItem("nc-theme") || "dark"
  );
  const [backend, setBackend] = useState<string>(
    localStorage.getItem("nc-backend") || "wasmtime"
  );

  // --- PRO LICENSE STATE ---
  const pro = useProStatus();
  const [licenseKey, setLicenseKey] = useState("");
  const [applyLoading, setApplyLoading] = useState(false);
  const [applyMsg, setApplyMsg] = useState("");

  // Load system info
  useEffect(() => {
    invoke("get_full_system_scan").then((res) =>
      setScan(res as FullSystemStatus)
    );
  }, []);

  // Persist theme
  useEffect(() => {
    localStorage.setItem("nc-theme", theme);
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  // Persist backend
  useEffect(() => {
    localStorage.setItem("nc-backend", backend);
  }, [backend]);

  const maskedRoot =
    scan?.worker_root && scan.worker_root !== "unknown"
      ? `…/${scan.worker_root.split("/").pop()}`
      : "Not Found";

  // Open folder via Rust
  async function openRootFolder() {
    if (!scan) return;
    await invoke("open_path_universal", { path: scan.worker_root });
  }

  
  async function applyLicense() {
    if (!licenseKey.trim()) {
      setApplyMsg("Please enter a license key.");
      return;
    }

    setApplyLoading(true);
    setApplyMsg("");

    try {
      const ok = await invoke<boolean>("unlock_pro_from_license", {
  licenseKey,
});


      if (ok) {
        setApplyMsg("✔ PRO License Activated");
        setLicenseKey("");
      } else {
        setApplyMsg("❌ License activation failed.");
      }
    } catch (err: any) {
      setApplyMsg("❌ Error: " + err.toString());
    } finally {
      setApplyLoading(false);
    }
  }

  
  async function deactivate() {
    try {
      await invoke("pro_deactivate");
      setApplyMsg("✔ License removed — reverted to Open Core mode.");
    } catch (err: any) {
      setApplyMsg("❌ Unable to remove license: " + err.toString());
    }
  }

  return (
    <div className="settings-page">
      <h2>Settings</h2>
      <p className="settings-intro">
        Configure theme, backend defaults, system paths — and Guardian PRO.
      </p>

      <div className="settings-grid">
        {/* ==== Theme Mode ==== */}
        <div className="settings-card">
          <h3>Theme</h3>
          <p className="card-hint">Choose UI theme.</p>

          <select
            className="settings-select"
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
          >
            <option value="dark">Dark (recommended)</option>
            <option value="light">Light</option>
            <option value="system">System Default</option>
          </select>
        </div>

        {/* ==== Backend ==== */}
        <div className="settings-card">
          <h3>Default Backend</h3>
          <p className="card-hint">Preferred Worker backend.</p>

          <select
            className="settings-select"
            value={backend}
            onChange={(e) => setBackend(e.target.value)}
          >
            <option value="wasmtime">Wasmtime</option>
            <option value="firecracker" disabled={!scan?.firecracker_installed}>
              Firecracker
            </option>
          </select>
        </div>

        {/* ==== Worker Root Path ==== */}
        <div className="settings-card">
          <h3>Night Core Worker Root</h3>
          <p className="card-hint">Where modules and logs live.</p>

          <div className="root-box">
            <span className="root-path">{maskedRoot}</span>
            <button
              className="root-open-btn"
              disabled={!scan || scan.worker_root === "unknown"}
              onClick={openRootFolder}
            >
              Open Folder
            </button>
          </div>
        </div>

        {/* ==== Reload Worker Scan ==== */}
        <div className="settings-card">
          <h3>Reload Worker Scan</h3>
          <p className="card-hint">Refresh worker environment state.</p>
          <button
            className="action-btn"
            onClick={() =>
              invoke("get_full_system_scan").then((res) =>
                setScan(res as FullSystemStatus)
              )
            }
          >
            Reload
          </button>
        </div>

        {}
        <div className="settings-card pro-license-card">
          <h3>Guardian PRO License</h3>

          {!pro.is_pro && (
            <>
              <p className="card-hint">
                Enter your PRO license key from Lemon Squeezy.
              </p>

              <input
                type="text"
                className="license-input"
                placeholder="Enter PRO license key…"
                value={licenseKey}
                onChange={(e) => setLicenseKey(e.target.value)}
              />

              <button
                className="btn-activate-pro"
                disabled={applyLoading}
                onClick={applyLicense}
              >
                {applyLoading ? "Activating…" : "Activate PRO"}
              </button>

              {applyMsg && <p className="license-msg">{applyMsg}</p>}
            </>
          )}

          {pro.is_pro && (
            <>
              <p className="card-hint green">
                ✔ Guardian PRO active — {pro.tier}
              </p>

              <button className="btn-deactivate-pro" onClick={deactivate}>
                Deactivate PRO
              </button>

              {applyMsg && <p className="license-msg">{applyMsg}</p>}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
