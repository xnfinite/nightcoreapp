import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import "./backends.css";

interface Result {
  ok: boolean;
  message: string;
}

interface BackendState {
  loading: boolean;
  result: Result | null;
  lastChecked: string | null;
}

function nowLabel() {
  return new Date().toLocaleString();
}

export default function Backends() {
  const [wasmtime, setWasmtime] = useState<BackendState>({
    loading: false,
    result: null,
    lastChecked: null,
  });

  const [firecracker, setFirecracker] = useState<BackendState>({
    loading: false,
    result: null,
    lastChecked: null,
  });

  async function testWasmtime() {
    setWasmtime((prev) => ({ ...prev, loading: true }));
    try {
      const res = (await invoke("test_wasmtime_backend")) as Result;
      setWasmtime({
        loading: false,
        result: res,
        lastChecked: nowLabel(),
      });
    } catch (e) {
      console.error("Wasmtime test error:", e);
      setWasmtime({
        loading: false,
        result: { ok: false, message: "Wasmtime check failed (see logs)" },
        lastChecked: nowLabel(),
      });
    }
  }

  async function testFirecracker() {
    setFirecracker((prev) => ({ ...prev, loading: true }));
    try {
      const res = (await invoke("test_firecracker_backend")) as Result;
      setFirecracker({
        loading: false,
        result: res,
        lastChecked: nowLabel(),
      });
    } catch (e) {
      console.error("Firecracker test error:", e);
      setFirecracker({
        loading: false,
        result: { ok: false, message: "Firecracker check failed (see logs)" },
        lastChecked: nowLabel(),
      });
    }
  }

  return (
    <div className="backends-page">
      <h2>Backend Diagnostics</h2>
      <p className="backends-intro">
        Verify that Night Core&apos;s execution backends are correctly installed
        and reachable from this console.
      </p>

      <div className="backend-grid">
        {/* WASMTIME CARD */}
        <div className="backend-card">
          <div className="backend-header">
            <div className="backend-icon wasmtime-icon" />
            <div>
              <h3>Wasmtime Backend</h3>
              <div className="backend-subtitle">Local WASM runtime</div>
            </div>
          </div>

          <div className="backend-status-row">
            <span
              className={
                wasmtime.result?.ok ? "status-pill ok" : "status-pill bad"
              }
            >
              {wasmtime.result
                ? wasmtime.result.ok
                  ? "Online"
                  : "Unavailable"
                : "Not tested"}
            </span>
            {wasmtime.lastChecked && (
              <span className="status-meta">
                Last checked: {wasmtime.lastChecked}
              </span>
            )}
          </div>

          {wasmtime.result && (
            <p className="backend-message">{wasmtime.result.message}</p>
          )}

          <div className="backend-actions">
            <button onClick={testWasmtime} disabled={wasmtime.loading}>
              {wasmtime.loading ? "Running diagnostics…" : "Run diagnostics"}
            </button>
          </div>

          <ul className="backend-meta-list">
            <li>Used for: local WASM execution</li>
            <li>Night Core mode: Wasmtime + AUFS</li>
          </ul>
        </div>

        {/* FIRECRACKER CARD */}
        <div className="backend-card">
          <div className="backend-header">
            <div className="backend-icon firecracker-icon" />
            <div>
              <h3>Firecracker Backend</h3>
              <div className="backend-subtitle">MicroVM sandbox</div>
            </div>
          </div>

          <div className="backend-status-row">
            <span
              className={
                firecracker.result?.ok ? "status-pill ok" : "status-pill bad"
              }
            >
              {firecracker.result
                ? firecracker.result.ok
                  ? "Online"
                  : "Unavailable"
                : "Not tested"}
            </span>
            {firecracker.lastChecked && (
              <span className="status-meta">
                Last checked: {firecracker.lastChecked}
              </span>
            )}
          </div>

          {firecracker.result && (
            <p className="backend-message">{firecracker.result.message}</p>
          )}

          <div className="backend-actions">
            <button onClick={testFirecracker} disabled={firecracker.loading}>
              {firecracker.loading ? "Running diagnostics…" : "Run diagnostics"}
            </button>
          </div>

          <ul className="backend-meta-list">
            <li>Used for: microVM isolation</li>
            <li>Night Core mode: Firecracker + Wasmtime</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
