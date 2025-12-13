import "./about.css";

export default function About() {
  return (
    <div className="about-page">
      <h2>About Night Core</h2>
      <p className="about-sub">
        Secure • Autonomous • Verified — A B106 Labs Project
      </p>

      {/* LOGO */}
      <div className="about-logo-wrap">
        <img
          src="/nightcore_logo_tm.png"
          alt="Night Core Logo"
          className="about-logo"
        />
      </div>

      {/* VERSION INFO */}
      <div className="about-grid">
        <div className="about-card">
          <h3>Night Core Worker</h3>
          <p>v39.x — WASI P1 • Wasmtime Runtime</p>
        </div>

        <div className="about-card">
          <h3>Night Core Console</h3>
          <p>v0.1 — Tauri + React Neon UI</p>
        </div>

        <div className="about-card">
          <h3>Night Core SDK</h3>
          <p>Rust, Python, TypeScript Multi-Runtime</p>
        </div>

        <div className="about-card">
          <h3>Security Framework</h3>
          <p>Ed25519 • SHA-256 • WASM Attestation</p>
        </div>
      </div>

      {/* DESCRIPTION */}
      <div className="about-section">
        <h3>What is Night Core?</h3>
        <p>
          Night Core is a secure WebAssembly orchestration engine designed to
          verify, isolate, and execute tenant modules with cryptographic
          guarantees. It implements strong sandboxing through Wasmtime and
          supports optional micro-VM isolation via Firecracker.
        </p>
        <p>
          Every execution is cryptographically proven using Ed25519 signatures,
          SHA-256 integrity checks, persistent audit history, and
          anomaly-detection telemetry through Timeline + Drift systems.
        </p>
      </div>

      {/* BRAND + LICENSE */}
      <div className="about-section">
        <h3>Brand & Licensing</h3>
        <p>
          Night Core is an open-core project by{" "}
          <strong>B106 Labs</strong>. The Worker is MIT-licensed. The
          Console UI, branding, and trademarks (B106 Edition visuals, Night
          Core shield, Guardian Lock architecture, and Vesper AI designs) are
          proprietary.
        </p>
      </div>

      {/* FOOTER */}
      <div className="about-footer">
        <p>© {new Date().getFullYear()} B106 Labs — All Rights Reserved</p>
      </div>
    </div>
  );
}
