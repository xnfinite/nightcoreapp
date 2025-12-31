use serde::{Serialize, Deserialize};
use std::{env, fs, path::PathBuf};

use tauri_plugin_opener::init as opener_init;
use tauri_plugin_shell::init as shell_init;
use tauri_plugin_dialog::init as dialog_init;
use tauri::Manager;

// ---------------------------------------------------------
// PRO API
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
// INGESTION + STATE
// ---------------------------------------------------------
mod commands;
use commands::import_tenant::import_tenant_from_file;

mod inbox;
mod tenant_state;

// ---------------------------------------------------------
// GUARDIAN STRUCT (MATCHES WORKER)
// ---------------------------------------------------------
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

// ============================================================
// ROOTS (BETA SAFE)
// ============================================================

fn home_dir() -> Result<PathBuf, String> {
    Ok(PathBuf::from(
        env::var("HOME")
            .or_else(|_| env::var("USERPROFILE"))
            .map_err(|_| "Failed to resolve home directory")?
    ))
}

pub fn resolve_worker_runtime_root() -> Result<PathBuf, String> {
    let home = home_dir()?;
    Ok(home.join(".nightcore"))
}

pub fn resolve_app_root(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    let base = app.path().app_data_dir().map_err(|e| e.to_string())?;
    let root = base.join("NightCore");
    fs::create_dir_all(&root).map_err(|e| e.to_string())?;
    Ok(root)
}

// KEEP NAME — used everywhere
pub fn resolve_worker_root(_app: &tauri::AppHandle) -> Result<PathBuf, String> {
    resolve_worker_runtime_root()
}

fn ensure_worker_runtime_dirs(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    let root = resolve_worker_root(app)?;

    fs::create_dir_all(&root).map_err(|e| e.to_string())?;

    let dirs = [
        "modules",
        "logs",
        "quarantine",
        "proof",
        "guardian",
        "state",
        "keys/maintainers",
    ];

    for d in dirs {
        let _ = fs::create_dir_all(root.join(d));
    }

    Ok(root)
}

// ============================================================
// 🔧 FIXED: WINDOWS-SAFE WORKER BINARY RESOLUTION
// ============================================================
fn resolve_bundled_worker_bin(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    let resource_dir = app.path().resource_dir().map_err(|e| e.to_string())?;

    #[cfg(windows)]
    let exe = "nightcore.exe";
    #[cfg(not(windows))]
    let exe = "nightcore";

    let mut candidates: Vec<PathBuf> = Vec::new();

    // 1) <resource_dir>/worker/nightcore(.exe)
    candidates.push(resource_dir.join("worker").join(exe));

    // 2) <resource_dir>/resources/worker/nightcore(.exe)
    candidates.push(resource_dir.join("resources").join("worker").join(exe));

    // 3) <resource_dir>/../resources/worker/nightcore(.exe)
    if let Some(parent) = resource_dir.parent() {
        candidates.push(parent.join("resources").join("worker").join(exe));
    }

    // 4) <current_exe>/resources/worker/nightcore(.exe)
    if let Ok(cur) = std::env::current_exe() {
        if let Some(dir) = cur.parent() {
            candidates.push(dir.join("resources").join("worker").join(exe));
        }
    }

    for c in candidates {
        if c.exists() {
            return Ok(c);
        }
    }

    Err(format!(
        "Worker binary missing (checked Tauri bundle layouts). resource_dir={}",
        resource_dir.display()
    ))
}

// ============================================================
// BASIC COMMANDS
// ============================================================
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}!", name)
}

#[tauri::command]
fn get_worker_logs_path(app: tauri::AppHandle) -> Result<String, String> {
    let root = ensure_worker_runtime_dirs(&app)?;
    Ok(root.join("logs").to_string_lossy().to_string())
}

// ============================================================
// SYSTEM SCAN
// ============================================================
#[derive(Serialize)]
pub struct TenantInfo {
    pub name: String,
    pub has_wasm: bool,
    pub has_sig: bool,
    pub has_sha: bool,
    pub has_pubkey: bool,
    pub manifest: bool,
}

#[derive(Serialize)]
pub struct LogStatus {
    pub dashboard_html: bool,
    pub history_html: bool,
    pub orchestration_json: bool,
    pub orchestration_html: bool,
    pub firecracker_html: bool,
}

#[derive(Serialize)]
pub struct FullSystemStatus {
    pub worker_root: String,
    pub worker_display: String,
    pub tenants: Vec<TenantInfo>,
    pub logs: LogStatus,
    pub firecracker_installed: bool,
    pub worker_version: String,
    pub sdk_version: String,
}

#[tauri::command]
async fn get_full_system_scan(app: tauri::AppHandle) -> FullSystemStatus {
    let worker_root = ensure_worker_runtime_dirs(&app).unwrap_or_else(|_| PathBuf::from("unknown"));

    let home = env::var("HOME").or_else(|_| env::var("USERPROFILE")).unwrap_or_default();

    let display = worker_root
        .to_string_lossy()
        .to_string()
        .replace(home.as_str(), "~");

    let modules = worker_root.join("modules");
    let logs = worker_root.join("logs");

    let mut tenants = vec![];

    if modules.exists() {
        if let Ok(entries) = fs::read_dir(&modules) {
            for e in entries.flatten() {
                let p = e.path();
                if !p.is_dir() {
                    continue;
                }

                tenants.push(TenantInfo {
                    name: e.file_name().to_string_lossy().to_string(),
                    has_wasm: p.join("module.wasm").exists(),
                    has_sig: p.join("module.sig").exists(),
                    has_sha: p.join("module.sha256").exists(),
                    has_pubkey: p.join("pubkey.b64").exists(),
                    manifest: p.join("manifest.json").exists(),
                });
            }
        }
    }

    let logs_status = LogStatus {
        dashboard_html: logs.join("nightcore_dashboard.html").exists(),
        history_html: logs.join("nightcore_history_dashboard.html").exists(),
        orchestration_json: logs.join("orchestration_report.json").exists(),
        orchestration_html: logs.join("orchestration_dashboard.html").exists(),
        firecracker_html: logs.join("firecracker_proof.log").exists(),
    };

    FullSystemStatus {
        worker_root: worker_root.to_string_lossy().to_string(),
        worker_display: display,
        tenants,
        logs: logs_status,
        firecracker_installed: which::which("firecracker").is_ok(),
        worker_version: "unknown".into(),
        sdk_version: "v1".into(),
    }
}

// ============================================================
// GUARDIAN + TENANT STATE
// ============================================================
#[tauri::command]
fn get_guardian_decisions(_app: tauri::AppHandle)
-> Result<Vec<GuardianDecisionLite>, String> {

    let raw = match read_runtime_file("logs/guardian_decisions.jsonl".into()) {
        Ok(v) => v,
        Err(_) => return Ok(vec![]),
    };

    let mut out = vec![];
    for line in raw.lines() {
        if let Ok(v) = serde_json::from_str::<GuardianDecisionLite>(line) {
            out.push(v);
        }
    }

    Ok(out)
}

#[tauri::command]
fn get_tenant_states(app: tauri::AppHandle)
-> Result<Vec<tenant_state::TenantState>, String> {
    let root = ensure_worker_runtime_dirs(&app)?;
    tenant_state::list_tenant_states(&root).map_err(|e| e.to_string())
}

// ============================================================
// RUNTIME FILE READER
// ============================================================
#[tauri::command]
fn read_runtime_file(rel: String) -> Result<String, String> {
    let root = resolve_worker_runtime_root()?;
    let path = root.join(rel);

    if !path.starts_with(&root) {
        return Err("Invalid runtime file path".into());
    }

    fs::read_to_string(&path)
        .map_err(|e| format!("Failed to read {}: {}", path.display(), e))
}

// ============================================================
// WORKER COMMAND EXECUTION
// ============================================================
#[tauri::command]
async fn run_worker_cmd(
    app: tauri::AppHandle,
    args: Vec<String>
) -> Result<String, String> {
    let runtime_root = ensure_worker_runtime_dirs(&app)?;
    let bin = resolve_bundled_worker_bin(&app)?;

    let home = env::var("HOME")
        .or_else(|_| env::var("USERPROFILE"))
        .unwrap_or_default();

    let output = std::process::Command::new(bin)
        .current_dir(&runtime_root)
        .env("HOME", home)
        .args(args)
        .output()
        .map_err(|e| e.to_string())?;

    if !output.status.success() {
        return Err(String::from_utf8_lossy(&output.stderr).into());
    }

    Ok(String::from_utf8_lossy(&output.stdout).into())
}

// ============================================================
// INBOX / APPROVAL
// ============================================================
#[derive(Debug, Serialize, Deserialize)]
pub struct InboxEntry {
    pub tenant: String,
    pub timestamp: String,
    pub signed: bool,
    pub path: String,
}

#[tauri::command]
fn list_agent_inbox(app: tauri::AppHandle)
-> Result<Vec<InboxEntry>, String> {
    let root = ensure_worker_runtime_dirs(&app)?;
    let entries = inbox::scan_system_inbox(&root).map_err(|e| e.to_string())?;

    let mut out = vec![];

    for e in entries {
        let signed = e.path.join("module.sig").exists();
        let masked = e.path.to_string_lossy()
            .replace(root.to_string_lossy().as_ref(), "worker://");

        out.push(InboxEntry {
            tenant: e.tenant,
            timestamp: e.timestamp,
            signed,
            path: masked,
        });
    }

    Ok(out)
}

#[tauri::command]
fn approve_agent_tenant(app: tauri::AppHandle, tenant: String)
-> Result<bool, String> {
    let root = ensure_worker_runtime_dirs(&app)?;

    tenant_state::mark_authorized(&root, &tenant)
        .map_err(|e| e.to_string())?;

    let bin = resolve_bundled_worker_bin(&app)?;

    let key_path = root.join("keys/maintainers/admin1.key");
    if !key_path.exists() {
        return Err(format!("Signing key missing at {}", key_path.display()));
    }

    let status = std::process::Command::new(bin)
        .current_dir(&root)
        .env("HOME", env::var("HOME").or_else(|_| env::var("USERPROFILE")).unwrap_or_default())
        .arg("sign")
        .arg("--dir").arg(root.join("modules").join(&tenant))
        .arg("--key").arg(&key_path)
        .status()
        .map_err(|e| e.to_string())?;

    if !status.success() {
        return Err("Approval signing failed".into());
    }

    Ok(true)
}

// ============================================================
// PRO
// ============================================================
#[tauri::command]
fn tauri_get_pro_status() -> Result<pro_api::ProStatus, String> {
    get_pro_status()
}

#[tauri::command]
fn unlock_pro_from_license(license_key: String) -> Result<bool, String> {
    pro_apply_license(license_key)
}

// ============================================================
// APP BOOT
// ============================================================
#[cfg_attr(mobile, tauri::mobile_builder_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(opener_init())
        .plugin(shell_init())
        .plugin(dialog_init())
        .invoke_handler(tauri::generate_handler![
            greet,
            get_worker_logs_path,
            get_full_system_scan,
            get_guardian_decisions,
            get_tenant_states,
            read_runtime_file,
            run_worker_cmd,

            import_tenant_from_file,

            list_agent_inbox,
            approve_agent_tenant,

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

