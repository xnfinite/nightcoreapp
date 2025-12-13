use serde::{Serialize, Deserialize};
use std::{
    env,
    fs,
    path::{Path, PathBuf},
};
use chrono::Utc;
use reqwest::blocking::Client;



#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ProLicenseFile {
    pub license_key: String,
    pub tier: String,
    pub activated_at: String,
    pub valid: bool,
    pub device_id: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ProStatus {
    pub is_pro: bool,
    pub tier: String,
    pub activated_at: Option<String>,
}



#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct PolicyFile {
    pub allow: Vec<String>,
    pub block: Vec<String>,
}



#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct QuarantineEntry {
    pub name: String,
    pub tenant: String,
    pub timestamp: String,
    pub path: String,   // Masked (worker://…)
}



fn home_dir() -> PathBuf {
    PathBuf::from(
        env::var("HOME")
            .or_else(|_| env::var("USERPROFILE"))
            .unwrap_or_else(|_| ".".into()),   // FIXED CLOSURE
    )
}

fn pro_root() -> PathBuf {
    home_dir().join(".nightcore").join("pro")
}

fn license_path() -> PathBuf {
    pro_root().join("license.json")
}

fn policies_path() -> PathBuf {
    pro_root().join("policies.json")
}

/// Mask worker filesystem paths so UI never reveals real disk locations.
fn mask_worker_path(worker_root: &Path, full: &str) -> String {
    let root_str = worker_root.to_string_lossy().to_string();

    if full.starts_with(&root_str) {
        full.replacen(&root_str, "worker://", 1).replace('\\', "/")
    } else {
        full.replace('\\', "/")
    }
}

fn current_device_id() -> String {
    let user = env::var("USER")
        .or_else(|_| env::var("USERNAME"))
        .unwrap_or_else(|_| "unknown-user".into())
        .to_lowercase();

    let host = env::var("HOSTNAME")
        .or_else(|_| env::var("COMPUTERNAME"))
        .unwrap_or_else(|_| "unknown-host".into())
        .to_lowercase();

    format!("{user}@{host}")
}



#[derive(Debug, Deserialize)]
struct LemonLicenseKey { status: String }

#[derive(Debug, Deserialize)]
struct LemonValidateResponse {
    valid: bool,
    error: Option<String>,
    license_key: Option<LemonLicenseKey>,
}

fn validate_with_lemon(license_key: &str) -> Result<(), String> {
    let client = Client::new();

    let resp = client
        .post("https://api.lemonsqueezy.com/v1/licenses/validate")
        .header("Accept", "application/json")
        .form(&[("license_key", license_key)])
        .send()
        .map_err(|e| format!("Network error contacting Lemon Squeezy: {e}"))?;

    if !resp.status().is_success() {
        return Err(format!("HTTP Error: {}", resp.status()));
    }

    let body: LemonValidateResponse =
        resp.json().map_err(|e| format!("Invalid response: {e}"))?;

    if !body.valid {
        return Err(body.error.unwrap_or_else(|| "License invalid".into()));
    }

    if let Some(lic) = body.license_key {
        if lic.status == "expired" || lic.status == "disabled" {
            return Err(format!("License status is '{}'", lic.status));
        }
    }

    Ok(())
}



#[tauri::command]
pub fn get_pro_status() -> Result<ProStatus, String> {
    let path = license_path();

    if !path.exists() {
        return Ok(ProStatus {
            is_pro: false,
            tier: "Open Core".into(),
            activated_at: None,
        });
    }

    let raw = fs::read_to_string(&path)
        .map_err(|e| format!("Failed to read license.json: {e}"))?;

    let lic: ProLicenseFile =
        serde_json::from_str(&raw).map_err(|e| format!("Invalid license.json: {e}"))?;

    if !lic.valid || lic.device_id != current_device_id() {
        return Ok(ProStatus {
            is_pro: false,
            tier: "Open Core".into(),
            activated_at: None,
        });
    }

    Ok(ProStatus {
        is_pro: true,
        tier: lic.tier.clone(),
        activated_at: Some(lic.activated_at.clone()),
    })
}



#[tauri::command]
pub fn pro_apply_license(license_key: String) -> Result<bool, String> {
    let key = license_key.trim();
    if key.is_empty() {
        return Err("License key cannot be empty".into());
    }

    validate_with_lemon(key)?;

    fs::create_dir_all(&pro_root())
        .map_err(|e| format!("Failed to create ~/.nightcore/pro: {e}"))?;

    let file = ProLicenseFile {
        license_key: key.into(),
        tier: "Guardian PRO".into(),
        activated_at: Utc::now().to_rfc3339(),
        valid: true,
        device_id: current_device_id(),
    };

    fs::write(
        license_path(),
        serde_json::to_string_pretty(&file).unwrap(),
    )
    .map_err(|e| format!("Failed to write license.json: {e}"))?;

    Ok(true)
}



#[tauri::command]
pub fn pro_deactivate() -> Result<bool, String> {
    if license_path().exists() {
        fs::remove_file(license_path())
            .map_err(|e| format!("Failed to remove license: {e}"))?;
    }
    Ok(true)
}



#[tauri::command]
pub fn pro_load_policies() -> Result<PolicyFile, String> {
    let path = policies_path();

    if !path.exists() {
        return Ok(PolicyFile { allow: vec![], block: vec![] });
    }

    let raw = fs::read_to_string(&path)
        .map_err(|e| format!("Failed to read policies.json: {e}"))?;

    Ok(serde_json::from_str(&raw)
        .map_err(|e| format!("Invalid policies.json: {e}"))?)
}

#[tauri::command]
pub fn pro_save_policies(policies: PolicyFile) -> Result<bool, String> {
    fs::create_dir_all(&pro_root())
        .map_err(|e| format!("Failed to create ~/.nightcore/pro: {e}"))?;

    fs::write(
        policies_path(),
        serde_json::to_string_pretty(&policies).unwrap(),
    )
    .map_err(|e| format!("Failed to write policies.json: {e}"))?;

    Ok(true)
}



#[derive(Debug, Serialize, Deserialize, Clone)]
struct GuardianDecisionLiteLog {
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

fn worker_logs_path(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    let worker_root = crate::resolve_worker_root(app)?;
    Ok(worker_root.join("logs"))
}

#[tauri::command]
pub fn pro_list_quarantine(app: tauri::AppHandle) -> Result<Vec<QuarantineEntry>, String> {
    let logs_dir = worker_logs_path(&app)?;
    let path = logs_dir.join("guardian_decisions.jsonl");

    if !path.exists() {
        return Ok(vec![]);
    }

    let worker_root = crate::resolve_worker_root(&app)
        .map_err(|e| format!("resolve_worker_root failed: {e}"))?;

    let raw = fs::read_to_string(&path)
        .map_err(|e| format!("Failed to read guardian_decisions.log: {e}"))?;

    let mut out = vec![];

    for (idx, line) in raw.lines().enumerate() {
        if line.trim().is_empty() { continue; }

        let parsed: GuardianDecisionLiteLog = match serde_json::from_str(line) {
            Ok(v) => v,
            Err(e) => { 
                eprintln!("Parse error line {}: {}", idx + 1, e);
                continue;
            }
        };

        let is_quarantined =
            parsed.threat_score >= 85
            || parsed.reason.to_lowercase().contains("quarantine");

        if !is_quarantined {
            continue;
        }

        let name = format!("{}-{}", parsed.tenant, parsed.timestamp);

        // Construct REAL path, then MASK it
        let real = worker_root.join("quarantine").join(&name);
        let masked = mask_worker_path(&worker_root, &real.to_string_lossy());

        out.push(QuarantineEntry {
            name,
            tenant: parsed.tenant.clone(),
            timestamp: parsed.timestamp.clone(),
            path: masked,
        });
    }

    Ok(out)
}



#[tauri::command]
pub fn pro_restore_quarantine(
    _app: tauri::AppHandle,
    _name: String,
) -> Result<bool, String> {
    Err("Restore is disabled in log-only quarantine mode.".into())
}

#[tauri::command]
pub fn pro_delete_quarantine(
    _app: tauri::AppHandle,
    _name: String,
) -> Result<bool, String> {
    Err("Delete is disabled in log-only quarantine mode.".into())
}



#[tauri::command]
pub fn pro_kill_all_running() -> Result<bool, String> {
    use std::process::Command;

    #[cfg(target_os = "windows")]
    {
        let _ = Command::new("taskkill").args(["/IM", "wasmtime.exe", "/F"]).output();
        let _ = Command::new("taskkill").args(["/IM", "firecracker.exe", "/F"]).output();
    }

    #[cfg(not(target_os = "windows"))]
    {
        let _ = Command::new("pkill").arg("-f").arg("wasmtime").output();
        let _ = Command::new("pkill").arg("-f").arg("firecracker").output();
    }

    Ok(true)
}
