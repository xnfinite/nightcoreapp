use tauri::AppHandle;
use anyhow::Result;
use std::fs;
use std::path::{PathBuf};
use chrono::Utc;
use zip::ZipArchive;

#[tauri::command]
pub fn import_tenant_from_file(app: AppHandle, path: String) -> Result<String, String> {
    let p = PathBuf::from(&path);
    if !p.exists() {
        return Err("File not found".into());
    }

    // Resolve worker/modules directory
    let modules = app
        .path_resolver()
        .resolve_resource("worker/modules")
        .ok_or("modules folder not found")?;

    let ext = p.extension()
        .and_then(|e| e.to_str())
        .unwrap_or("")
        .to_lowercase();

    // Tenant naming format
    let tenant_name = format!("tenant-{}", Utc::now().timestamp());
    let tenant_dir = PathBuf::from(&modules).join(&tenant_name);
    fs::create_dir_all(&tenant_dir).map_err(|e| e.to_string())?;

    
    if ext == "wasm" {
        fs::copy(&p, tenant_dir.join("module.wasm"))
            .map_err(|e| e.to_string())?;

        let manifest = serde_json::json!({
            "tenant": tenant_name,
            "memory_request_mb": 50,
            "runtime_request_ms": 100
        });

        fs::write(
            tenant_dir.join("manifest.json"),
            serde_json::to_string_pretty(&manifest).unwrap()
        ).map_err(|e| e.to_string())?;

        return Ok(tenant_name);
    }

    
    if ext == "zip" {
        let file = fs::File::open(&p).map_err(|e| e.to_string())?;
        let mut archive =
            ZipArchive::new(file).map_err(|e| e.to_string())?;

        archive.extract(&tenant_dir)
            .map_err(|e| e.to_string())?;

        return Ok(tenant_name);
    }

    Err("Unsupported file type. Only .wasm or .zip allowed.".into())
}
