use tauri::Manager;
use tauri::AppHandle;

use std::fs;
use std::path::PathBuf;
use chrono::Utc;
use zip::ZipArchive;

use crate::resolve_worker_root;

#[tauri::command]
pub fn import_tenant_from_file(app: AppHandle, path: String) -> Result<String, String> {
    let src = PathBuf::from(&path);
    if !src.exists() {
        return Err("File not found".into());
    }

    // ------------------------------------------------------------
    // CRITICAL FIX:
    // Use the SAME worker root as execution and dashboards
    // ------------------------------------------------------------
    let worker_root = resolve_worker_root(&app)?;
    let modules = worker_root.join("modules");

    fs::create_dir_all(&modules)
        .map_err(|e| format!("Failed to ensure modules dir: {e}"))?;

    let ext = src
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or("")
        .to_lowercase();

    if ext != "wasm" && ext != "zip" {
        return Err("Unsupported file type. Only .wasm or .zip allowed.".into());
    }

    // Create tenant directory
    let tenant = format!("tenant-{}", Utc::now().timestamp());
    let tenant_dir = modules.join(&tenant);
    fs::create_dir_all(&tenant_dir)
        .map_err(|e| format!("Failed to create tenant dir: {e}"))?;

    // Handle WASM
    if ext == "wasm" {
        fs::copy(&src, tenant_dir.join("module.wasm"))
            .map_err(|e| format!("Failed to copy wasm: {e}"))?;
    }

    // Handle ZIP
    if ext == "zip" {
        let file = fs::File::open(&src)
            .map_err(|e| format!("Failed to open zip: {e}"))?;
        let mut archive =
            ZipArchive::new(file).map_err(|e| format!("Invalid zip: {e}"))?;

        archive
            .extract(&tenant_dir)
            .map_err(|e| format!("Failed to extract zip: {e}"))?;
    }

    // Mandatory ingestion metadata (manual channel)
    let manifest = serde_json::json!({
        "tenant": tenant,
        "ingestion": {
            "channel": "manual",
            "source": "gui",
            "timestamp": Utc::now().to_rfc3339()
        }
    });

    fs::write(
        tenant_dir.join("manifest.json"),
        serde_json::to_string_pretty(&manifest).unwrap(),
    )
    .map_err(|e| format!("Failed to write manifest: {e}"))?;

    Ok(tenant)
}
