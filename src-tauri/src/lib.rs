use serde::{Serialize, Deserialize};
use std::{env, fs, path::{Path, PathBuf}};

use tauri_plugin_opener::init as opener_init;
use tauri_plugin_shell::init as shell_init;
use tauri_plugin_dialog::init as dialog_init;
use tauri_plugin_opener::OpenerExt;
use tauri::Manager;

use chrono::Utc;
use zip::ZipArchive;

// SIGNING
use ed25519_dalek::SigningKey;
use rand::rngs::OsRng;
use base64::{engine::general_purpose::STANDARD, Engine as _};

// ---------------------------------------------------------
// PRO API MODULE
// ---------------------------------------------------------
mod pro_api;
use pro_api::{
    get_pro_status,
    pro_apply_license,
    pro_deactivate,
    pro_load_policies,
    pro_save_policies,
    pro_list_quarantine,
    pro_restore_quarantine,
    pro_delete_quarantine,
    pro_kill_all_running,
};

// ---------------------------------------------------------
// 🔔 RESTORED INGESTION MODULE
// ---------------------------------------------------------
mod commands;
use commands::import_tenant::import_tenant_from_file;



#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct GuardianDecisionLite {
    pub timestamp: String,
    pub tenant: String,
    pub backend: String,
    pub proof_mode: bool,

    pub decision: String,
    pub reason: String,

    pub threat_score: u8,
    pub threat_label: String,
    pub threat_color: String,

    pub sha256: String,
    pub first_seen: bool,
    pub known_sha: bool,

    pub wasm_size_bytes: u64,
    pub memory_request_mb: u64,
    pub runtime_request_ms: u64,
    pub wasi_fs_access: bool,
    pub wasi_net_access: bool,
    pub wasi_imports: Vec<String>,

    pub policy_exists: bool,
    pub backend_allowed: bool,
    pub trusted_signer: bool,
}

/// ⭐ PUBLIC: Used by Guardian, Watchtower, Vault, Inbox
pub fn resolve_worker_root(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    let base = app.path().resource_dir().map_err(|e| e.to_string())?;
    Ok(base.join("resources").join("worker"))
}

fn resolve_worker_bin(worker_root: &PathBuf) -> Result<PathBuf,String> {
    #[cfg(windows)]
    let path = worker_root.join("nightcore.exe");
    #[cfg(not(windows))]
    let path = worker_root.join("nightcore");

    if !path.exists() {
        return Err(format!("Worker binary missing at {:?}", path));
    }
    Ok(path)
}

#[tauri::command]
fn get_worker_logs_path(app: tauri::AppHandle) -> Result<String, String> {
    let root = resolve_worker_root(&app)?;
    Ok(root.join("logs").to_string_lossy().to_string())
}

#[tauri::command]
fn convert_windows_path_to_wsl(path: String) -> Result<String,String> {
    let output = std::process::Command::new("wslpath")
        .arg("-a")
        .arg(&path)
        .output()
        .map_err(|e| e.to_string())?;

    if !output.status.success() {
        return Err("Failed to convert Windows path".into());
    }

    Ok(String::from_utf8_lossy(&output.stdout).trim().to_string())
}

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}!", name)
}

#[derive(Serialize)]
pub struct TenantInfo {
    name: String,
    has_wasm: bool,
    has_sig: bool,
    has_sha: bool,
    has_pubkey: bool,
    manifest: bool,
}

#[derive(Serialize)]
pub struct LogStatus {
    dashboard_html: bool,
    history_html: bool,
    orchestration_json: bool,
    orchestration_html: bool,
    firecracker_html: bool,
}

#[derive(Serialize)]
pub struct FullSystemStatus {
    worker_root: String,
    worker_display: String,
    tenants: Vec<TenantInfo>,
    logs: LogStatus,
    firecracker_installed: bool,
    worker_version: String,
    sdk_version: String,
}

#[derive(Serialize)]
pub struct BackendTestResult {
    pub ok: bool,
    pub message: String,
}

#[tauri::command]
async fn get_full_system_scan(app: tauri::AppHandle) -> FullSystemStatus {
    let worker_root = resolve_worker_root(&app).unwrap_or_else(|_| PathBuf::from("unknown"));

    let worker_display = worker_root
        .to_string_lossy()
        .to_string()
        .replace(env::var("HOME").unwrap_or_default().as_str(), "~");

    let modules = worker_root.join("modules");
    let logs_dir = worker_root.join("logs");

    let mut tenants = vec![];

    if modules.exists() {
        if let Ok(entries) = fs::read_dir(&modules) {
            for entry in entries.flatten() {
                let path = entry.path();
                if !path.is_dir() { continue; }

                let name = entry.file_name().to_string_lossy().to_string();
                tenants.push(TenantInfo {
                    name,
                    has_wasm: path.join("module.wasm").exists(),
                    has_sig: path.join("module.sig").exists(),
                    has_sha: path.join("module.sha256").exists(),
                    has_pubkey: path.join("pubkey.b64").exists(),
                    manifest: path.join("manifest.json").exists(),
                });
            }
        }
    }

    let logs = LogStatus {
        dashboard_html:       logs_dir.join("nightcore_dashboard.html").exists(),
        history_html:         logs_dir.join("nightcore_history_dashboard.html").exists(),
        orchestration_json:   logs_dir.join("orchestration_report.json").exists(),
        orchestration_html:   logs_dir.join("orchestration_dashboard.html").exists(),
        firecracker_html:     logs_dir.join("firecracker_proof.log").exists(),
    };

    FullSystemStatus {
        worker_root: worker_root.to_string_lossy().to_string(),
        worker_display,
        tenants,
        logs,
        firecracker_installed: which::which("firecracker").is_ok(),
        worker_version: "unknown".into(),
        sdk_version: "v1".into(),
    }
}

#[tauri::command]
fn read_file(path: String) -> Result<String,String> {
    fs::read_to_string(&path).map_err(|e| format!("Failed: {}", e))
}

#[tauri::command]
fn get_guardian_decisions(app: tauri::AppHandle)
-> Result<Vec<GuardianDecisionLite>,String> {
    let worker_root = resolve_worker_root(&app)?;
    let path = worker_root.join("logs/guardian_decisions.jsonl");

    if !path.exists() { return Ok(vec![]); }

    let raw = fs::read_to_string(&path)
        .map_err(|e| format!("Failed to read decisions: {}", e))?;

    let mut results = vec![];

    for line in raw.lines() {
        if let Ok(v) = serde_json::from_str::<GuardianDecisionLite>(line) {
            results.push(v);
        }
    }

    Ok(results)
}

#[tauri::command]
async fn run_worker_cmd(app: tauri::AppHandle, args: Vec<String>)
-> Result<String,String> {
    let worker_root = resolve_worker_root(&app)?;
    let bin = resolve_worker_bin(&worker_root)?;

    let output = std::process::Command::new(bin)
        .current_dir(&worker_root)
        .args(args)
        .output()
        .map_err(|e| e.to_string())?;

    if !output.status.success() {
        return Err(String::from_utf8_lossy(&output.stderr).into());
    }

    Ok(String::from_utf8_lossy(&output.stdout).into())
}

// =========================================================
// 🔔 INBOX COMMANDS
// =========================================================

#[derive(Debug, Serialize, Deserialize)]
pub struct InboxEntry {
    pub tenant: String,
    pub timestamp: String,
    pub signed: bool,
    pub path: String,
}

#[tauri::command]
fn list_agent_inbox(app: tauri::AppHandle) -> Result<Vec<InboxEntry>, String> {
    let worker_root = resolve_worker_root(&app)?;
    let modules_dir = worker_root.join("modules");
    let mut out = vec![];

    if !modules_dir.exists() {
        return Ok(out);
    }

    for entry in fs::read_dir(&modules_dir).map_err(|e| e.to_string())? {
        let entry = entry.map_err(|e| e.to_string())?;
        let path = entry.path();

        let tenant = entry.file_name().to_string_lossy().to_string();
        if !tenant.starts_with("tenant-agent-") { continue; }

        let signed = path.join("module.sig").exists();

        let timestamp = fs::read_to_string(path.join("manifest.json"))
            .ok()
            .and_then(|s| serde_json::from_str::<serde_json::Value>(&s).ok())
            .and_then(|v| v.get("ingested_at").map(|t| t.to_string()))
            .unwrap_or_else(|| "unknown".into());

        let masked = path.to_string_lossy()
            .replace(worker_root.to_string_lossy().as_ref(), "worker://")
            .replace('\\', "/");

        out.push(InboxEntry { tenant, timestamp, signed, path: masked });
    }

    Ok(out)
}

#[tauri::command]
fn approve_agent_tenant(app: tauri::AppHandle, tenant: String) -> Result<bool, String> {
    let worker_root = resolve_worker_root(&app)?;
    let bin = resolve_worker_bin(&worker_root)?;

    let status = std::process::Command::new(bin)
        .current_dir(&worker_root)
        .arg("sign")
        .arg("--dir").arg(worker_root.join("modules").join(&tenant))
        .arg("--key").arg(worker_root.join("keys/maintainers/admin1.key"))
        .status()
        .map_err(|e| e.to_string())?;

    if !status.success() {
        return Err("Approval signing failed".into());
    }

    Ok(true)
}

#[tauri::command]
fn reject_agent_tenant(app: tauri::AppHandle, tenant: String) -> Result<bool, String> {
    let worker_root = resolve_worker_root(&app)?;
    let tenant_dir = worker_root.join("modules").join(&tenant);

    if tenant_dir.exists() {
        fs::remove_dir_all(tenant_dir).map_err(|e| e.to_string())?;
    }

    Ok(true)
}

#[tauri::command]
fn tauri_get_pro_status() -> Result<pro_api::ProStatus, String> {
    get_pro_status()
}

#[tauri::command]
fn unlock_pro_from_license(license_key: String) -> Result<bool, String> {
    pro_apply_license(license_key)
}

#[cfg_attr(mobile, tauri::mobile_builder_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(opener_init())
        .plugin(shell_init())
        .plugin(dialog_init())
        .invoke_handler(tauri::generate_handler![
            greet,
            get_full_system_scan,
            read_file,
            get_guardian_decisions,
            run_worker_cmd,
            get_worker_logs_path,
            convert_windows_path_to_wsl,

            // 🔁 RESTORED INGESTION
            import_tenant_from_file,

            // INBOX
            list_agent_inbox,
            approve_agent_tenant,
            reject_agent_tenant,

            // PRO
            tauri_get_pro_status,
            unlock_pro_from_license,
            pro_deactivate,
            pro_load_policies,
            pro_save_policies,
            pro_list_quarantine,
            pro_restore_quarantine,
            pro_delete_quarantine,
            pro_kill_all_running,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
