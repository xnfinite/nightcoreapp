import React, { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";   // ⭐ TAURI V2 FILE DIALOG
import "./dropzone.css";

interface TauriFile extends File {
  path: string;
}

export default function TenantDropZone({ onImported }: { onImported: () => void }) {
  const [hover, setHover] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null); // ✅ NEW

  
  async function handleBrowse() {
    setError(null);
    setSuccess(null);

    const selected = await open({
      multiple: false,
      filters: [
        { name: "WASM Modules", extensions: ["wasm"] },
        { name: "Night Core Tenant ZIP", extensions: ["zip"] },
      ],
    });

    if (!selected) return; // user cancelled

    try {
      setImporting(true);
      const tenant = await invoke<string>("import_tenant_from_file", { path: selected });
      setSuccess(`✔ Tenant ${tenant} submitted`);
      onImported();
    } catch (err: any) {
      console.error(err);
      setError("Failed to import file.");
    } finally {
      setImporting(false);
    }
  }

  
  async function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setHover(false);
    setError(null);
    setSuccess(null);

    const file = e.dataTransfer.files?.[0] as TauriFile;

    if (!file || !("path" in file)) {
      setError("Drag rejected — use the Browse button instead.");
      return;
    }

    try {
      setImporting(true);
      const tenant = await invoke<string>("import_tenant_from_file", { path: file.path });
      setSuccess(`✔ Tenant ${tenant} submitted`);
      onImported();
    } catch (err: any) {
      console.error(err);
      setError("Failed to import dropped file.");
    } finally {
      setImporting(false);
    }
  }

  
  return (
    <>
      <div
        className={`tenant-dropzone ${hover ? "hover" : ""}`}
        onDragOver={(e) => {
          e.preventDefault();
          setHover(true);
        }}
        onDragLeave={() => setHover(false)}
        onDrop={handleDrop}
      >
        <p>{importing ? "Importing…" : "Drop WASM or ZIP here"}</p>
        <p className="sub">Night Core will auto-create a tenant</p>

        {error && <p className="error">{error}</p>}
        {success && <p className="success">{success}</p>} {/* ✅ NEW */}
      </div>

      {/* ⭐ Browse Button */}
      <div style={{ textAlign: "center", marginTop: "10px" }}>
        <button className="browse-btn" onClick={handleBrowse} disabled={importing}>
          Browse for File…
        </button>
      </div>
    </>
  );
}
