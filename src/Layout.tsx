import { Link, useLocation, Outlet } from "react-router-dom";
import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import "./App.css";

// Correct PRO hook
import useProStatus from "./hooks/useProStatus";

// ✅ ADDED: global inbox popup
import InboxPopup from "./components/InboxPopup";

interface DriftRecord {
  tenant: string;
  old_sha: string;
  new_sha: string;
  timestamp: string;
}

/* ===================== NEW ===================== */
interface InboxEntry {
  tenant: string;
  signed: boolean;
}
/* =============================================== */

const IconDashboard = () => (
  <svg className="nc-icon-svg" width="18" height="18" viewBox="0 0 24 24" fill="none" strokeWidth="2">
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
  </svg>
);

const IconTenants = () => (
  <svg className="nc-icon-svg" width="18" height="18" viewBox="0 0 24 24" fill="none" strokeWidth="2">
    <circle cx="12" cy="6" r="3" />
    <circle cx="5" cy="11" r="2" />
    <circle cx="19" cy="11" r="2" />
    <path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
    <path d="M3 21v-2a3 3 0 0 1 3-3" />
    <path d="M18 21v-2a3 3 0 0 0-3-3" />
  </svg>
);

const IconProof = () => (
  <svg className="nc-icon-svg" width="18" height="18" viewBox="0 0 24 24" fill="none" strokeWidth="2">
    <path d="M12 2l7 4v5c0 5-3.5 9-7 11-3.5-2-7-6-7-11V6l7-4z" />
    <path d="M9 12l2 2 4-4" />
  </svg>
);

const IconTimeline = () => (
  <svg className="nc-icon-svg" width="18" height="18" viewBox="0 0 24 24" fill="none" strokeWidth="2">
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 3" />
  </svg>
);

const IconAnomaly = () => (
  <svg className="nc-icon-svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FF4D67" strokeWidth="2">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h17a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <circle cx="12" cy="17" r="1" />
  </svg>
);

/* ===================== NEW ===================== */
const IconInbox = () => (
  <svg className="nc-icon-svg" width="18" height="18" viewBox="0 0 24 24" fill="none" strokeWidth="2">
    <path d="M4 4h16v12H4z" />
    <path d="M22 16h-6l-2 3h-4l-2-3H2" />
  </svg>
);
/* =============================================== */

const IconBackend = () => (
  <svg className="nc-icon-svg" width="18" height="18" viewBox="0 0 24 24" fill="none" strokeWidth="2">
    <rect x="3" y="3" width="18" height="8" rx="2" />
    <rect x="3" y="13" width="18" height="8" rx="2" />
    <circle cx="7" cy="7" r="1" />
    <circle cx="7" cy="17" r="1" />
  </svg>
);

const IconSettings = () => (
  <svg className="nc-icon-svg" width="18" height="18" viewBox="0 0 24 24" fill="none" strokeWidth="2">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.65 1.65 0 0 0 15 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83 0l-.06-.06A1.65 1.65 0 0 0 8.6 19.4 1.65 1.65 0 0 0 6.78 19l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 8.6a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 0l.06.06A1.65 1.65 0 0 0 15 8.6a1.65 1.65 0 0 0 1.82.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 15z" />
  </svg>
);

const IconAbout = () => (
  <svg className="nc-icon-svg" width="18" height="18" viewBox="0 0 24 24" fill="none" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="16" x2="12" y2="12" />
    <circle cx="12" cy="8" r="1" />
  </svg>
);

const IconGuardian = () => (
  <svg className="nc-icon-svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FF4D67" strokeWidth="2">
    <path d="M12 2l7 4v6c0 5-3.4 9.1-7 10-3.6-0.9-7-5-7-10V6l7-4z" />
    <path d="M12 11v3" />
    <circle cx="12" cy="8" r="1" />
  </svg>
);

const IconGuardianLog = () => (
  <svg className="nc-icon-svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9BD3F8" strokeWidth="2">
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <line x1="8" y1="9" x2="16" y2="9" />
    <line x1="8" y1="13" x2="16" y2="13" />
  </svg>
);

const IconShield = () => (
  <svg className="nc-icon-svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#FFD700" strokeWidth="2">
    <path d="M12 2l8 4v6c0 6-4 10-8 12-4-2-8-6-8-12V6l8-4z" />
  </svg>
);

export default function Layout() {
  const location = useLocation();
  const isActive = (path: string) => (location.pathname === path ? "active" : "");

  const [anomalyCount, setAnomalyCount] = useState(0);
  const [inboxCount, setInboxCount] = useState(0);

  // Read PRO status
  const pro = useProStatus();

  // Load anomaly count
  useEffect(() => {
    invoke("read_file", { path: "logs/anomaly_drift.json" })
      .then((raw) => {
        if (!raw) return;
        try {
          const json = JSON.parse(raw as string) as { drift: DriftRecord[] };
          setAnomalyCount(json.drift?.length || 0);
        } catch {}
      })
      .catch(() => {});
  }, []);

  /* ===================== NEW ===================== */
  useEffect(() => {
    if (!pro.is_pro) return;

    const pollInbox = async () => {
      try {
        const entries = await invoke<InboxEntry[]>("list_agent_inbox");
        setInboxCount(entries.filter(e => !e.signed).length);
      } catch {}
    };

    pollInbox();
    const id = setInterval(pollInbox, 3000);
    return () => clearInterval(id);
  }, [pro.is_pro]);
  /* =============================================== */

  return (
    <div className="nc-app">
      {}
      <aside className="nc-sidebar">

        {/* LOGO */}
        <div className="nc-logo">
          <img src="/nightcore_logo_tm.png" alt="Night Core Logo" />
          <h2>Night Core</h2>
          <span className="nc-version">Console v1.0.0-beta</span>

          {/* PRO BADGE */}
          {pro.is_pro && <div className="nc-pro-badge">PRO</div>}
        </div>

        {/* PRO RIBBON */}
        {pro.is_pro && (
          <div className="nc-pro-ribbon">Guardian PRO Activated</div>
        )}

        {/* NAVIGATION */}
        <nav className="nc-nav">
          <div className="nc-nav-section">Overview</div>

          <Link className={isActive("/")} to="/">
            <span className="nc-icon"><IconDashboard /></span>
            Dashboard
          </Link>

          <Link className={isActive("/tenants")} to="/tenants">
            <span className="nc-icon"><IconTenants /></span>
            Tenants
          </Link>

          <Link className={isActive("/proof-logs")} to="/proof-logs">
            <span className="nc-icon"><IconProof /></span>
            Proof Logs
          </Link>

          <Link className={isActive("/timeline")} to="/timeline">
            <span className="nc-icon"><IconTimeline /></span>
            Timeline
          </Link>

          <div className="nc-nav-section">Security</div>

          <Link className={isActive("/guardian")} to="/guardian">
            <span className="nc-icon"><IconGuardian /></span>
            Guardian Lock
          </Link>

          <Link className={isActive("/guardian-logs")} to="/guardian-logs">
            <span className="nc-icon"><IconGuardianLog /></span>
            Decision Logs
          </Link>

          <Link className={isActive("/anomaly")} to="/anomaly">
            <span className="nc-icon"><IconAnomaly /></span>
            Anomaly
            {anomalyCount > 0 && (
              <span className="nc-alert-pill">{anomalyCount}</span>
            )}
          </Link>

          {/* === PRO ONLY SECTION === */}
          {pro.is_pro && (
            <>
              <div className="nc-nav-section">PRO Tools</div>

              <Link className={isActive("/inbox")} to="/inbox">
                <span className="nc-icon"><IconInbox /></span>
                Inbox
                {inboxCount > 0 && (
                  <span className="nc-alert-pill">{inboxCount}</span>
                )}
              </Link>

              <Link className={isActive("/policies")} to="/policies">
                <span className="nc-icon"><IconShield /></span>
                Policies
              </Link>

              <Link className={isActive("/quarantine")} to="/quarantine">
                <span className="nc-icon"><IconShield /></span>
                Quarantine Vault
              </Link>

              {/* 🔥 FIXED KILL SWITCH BUTTON */}
              <button
                className="nc-nav-btn"
                onClick={async () => {
                  try {
                    await invoke("pro_kill_all_running");
                    alert("🛑 All sandbox runtimes requested to terminate (wasmtime + firecracker).");
                  } catch (e: any) {
                    alert("❌ Kill Switch failed: " + e.toString());
                  }
                }}
              >
                <span className="nc-icon"><IconShield /></span>
                Kill All Sandboxes
              </button>
            </>
          )}

          <div className="nc-nav-section">System</div>

          <Link className={isActive("/backends")} to="/backends">
            <span className="nc-icon"><IconBackend /></span>
            Backends
          </Link>

          <Link className={isActive("/settings")} to="/settings">
            <span className="nc-icon"><IconSettings /></span>
            Settings
          </Link>

          <Link className={isActive("/about")} to="/about">
            <span className="nc-icon"><IconAbout /></span>
            About
          </Link>
        </nav>
      </aside>

      {}
      <main className="nc-main">
        <header className="nc-header">
          <h1>Night Core Console</h1>
          <span className="nc-status verified">
            {pro.is_pro ? "PRO Active" : "SDK Ready"}
          </span>
        </header>

        <section className="nc-content">
          <Outlet />
        </section>
      </main>

      {/* ✅ ADDED: GLOBAL POPUP */}
      <InboxPopup />
    </div>
  );
}
