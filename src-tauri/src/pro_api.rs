use serde::{Serialize, Deserialize};
use std::{
    env,
    fs,
    path::{Path, PathBuf},
};
use chrono::Utc;
use reqwest::blocking::Client;

use hmac::{Hmac, Mac};
use sha2::Sha256;
use base64::{engine::general_purpose::STANDARD, Engine as _};
use rand::rngs::OsRng;
use rand::RngCore;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ProLicenseFile {
    pub license_key: String,
    pub tier: String,
    pub activated_at: String,
    pub valid: bool,
    pub device_id: String,

    #[serde(default)]
    pub provider: String,

    #[serde(default)]
    pub signature: Option<String>,
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
    pub path: String,
}

fn home_dir() -> PathBuf {
    PathBuf::from(
        env::var("HOME")
            .or_else(|_| env::var("USERPROFILE"))
            .unwrap_or_else(|_| ".".into()),
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

fn device_secret_path() -> PathBuf {
    pro_root().join("device_secret.b64")
}

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

type HmacSha256 = Hmac<Sha256>;

fn load_or_create_device_secret() -> Result<Vec<u8>, String> {
    let service = "Night Core Console";
    let account = format!("pro-hmac-key:{}", current_device_id());

    if let Ok(entry) = keyring::Entry::new(service, &account) {
        if let Ok(b64) = entry.get_password() {
            if let Ok(bytes) = STANDARD.decode(b64.trim()) {
                if bytes.len() >= 32 {
                    return Ok(bytes);
                }
            }
        }
    }

    let p = device_secret_path();
    if p.exists() {
        let raw = fs::read_to_string(&p)
            .map_err(|e| format!("Failed to read device secret: {e}"))?;
        let bytes = STANDARD
            .decode(raw.trim())
            .map_err(|e| format!("Invalid device secret encoding: {e}"))?;
        if bytes.len() < 32 {
            return Err("Device secret too short".into());
        }

        if let Ok(entry) = keyring::Entry::new(service, &account) {
            let _ = entry.set_password(raw.trim());
        }

        return Ok(bytes);
    }

    let mut secret = vec![0u8; 32];
    OsRng.fill_bytes(&mut secret);
    let b64 = STANDARD.encode(&secret);

    fs::create_dir_all(&pro_root())
        .map_err(|e| format!("Failed to create pro directory: {e}"))?;
    fs::write(&p, &b64)
        .map_err(|e| format!("Failed to write device secret: {e}"))?;

    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        let _ = fs::set_permissions(&p, fs::Permissions::from_mode(0o600));
    }

    if let Ok(entry) = keyring::Entry::new(service, &account) {
        let _ = entry.set_password(&b64);
    }

    Ok(secret)
}

fn canonical_license_string(lic: &ProLicenseFile) -> String {
    format!(
        "license_key={}\n\
tier={}\n\
activated_at={}\n\
valid={}\n\
device_id={}\n\
provider={}\n",
        lic.license_key.trim(),
        lic.tier.trim(),
        lic.activated_at.trim(),
        lic.valid,
        lic.device_id.trim(),
        lic.provider.trim(),
    )
}

fn sign_license(lic: &ProLicenseFile) -> Result<String, String> {
    let secret = load_or_create_device_secret()?;
    let msg = canonical_license_string(lic);

    let mut mac = HmacSha256::new_from_slice(&secret)
        .map_err(|_| "HMAC init failed".to_string())?;
    mac.update(msg.as_bytes());

    Ok(STANDARD.encode(mac.finalize().into_bytes()))
}

fn verify_license(lic: &ProLicenseFile) -> Result<bool, String> {
    let Some(sig_b64) = lic.signature.as_deref() else {
        return Ok(true);
    };

    let secret = load_or_create_device_secret()?;
    let msg = canonical_license_string(lic);

    let sig = STANDARD
        .decode(sig_b64.trim())
        .map_err(|e| format!("Invalid signature encoding: {e}"))?;

    let mut mac = HmacSha256::new_from_slice(&secret)
        .map_err(|_| "HMAC init failed".to_string())?;
    mac.update(msg.as_bytes());

    Ok(mac.verify_slice(&sig).is_ok())
}

#[derive(Debug, Deserialize)]
struct LemonLicenseKey {
    status: String,
}

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
        .form(&[
            ("license_key", license_key),
            ("activation_name", "Night Core Console"),
        ])
        .send()
        .map_err(|e| format!("Network error contacting Lemon Squeezy: {e}"))?;

    let body: LemonValidateResponse =
        resp.json().map_err(|e| format!("Invalid Lemon response: {e}"))?;

    if !body.valid {
        return Err(body.error.unwrap_or_else(|| "License invalid".into()));
    }

    if let Some(lic) = body.license_key {
        if lic.status != "active" {
            return Err(format!("License status is '{}'", lic.status));
        }
    }

    Ok(())
}

fn validate_with_gumroad(license_key: &str) -> Result<(), String> {
    let key = license_key.trim().to_uppercase();
    let parts: Vec<&str> = key.split('-').collect();

    if parts.len() != 4 {
        return Err("Invalid Gumroad license format".into());
    }

    for part in &parts {
        if part.len() != 8 || !part.chars().all(|c| c.is_ascii_hexdigit()) {
            return Err("Invalid Gumroad license format".into());
        }
    }

    Ok(())
}

#[tauri::command]
pub fn get_pro_status() -> Result<ProStatus, String> {
    if !license_path().exists() {
        return Ok(ProStatus {
            is_pro: false,
            tier: "Open Core".into(),
            activated_at: None,
        });
    }

    let raw = fs::read_to_string(license_path())
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

    if !verify_license(&lic)? {
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

    let provider = if key.contains('-') {
        validate_with_gumroad(key)?;
        "gumroad"
    } else {
        validate_with_lemon(key)?;
        "lemon"
    };

    let mut file = ProLicenseFile {
        license_key: key.into(),
        tier: "Guardian PRO".into(),
        activated_at: Utc::now().to_rfc3339(),
        valid: true,
        device_id: current_device_id(),
        provider: provider.into(),
        signature: None,
    };

    file.signature = Some(sign_license(&file)?);

    fs::create_dir_all(&pro_root())
        .map_err(|e| format!("Failed to create ~/.nightcore/pro: {e}"))?;

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
    if !policies_path().exists() {
        return Ok(PolicyFile {
            allow: vec![],
            block: vec![],
        });
    }

    let raw = fs::read_to_string(policies_path())
        .map_err(|e| format!("Failed to read policies.json: {e}"))?;

    serde_json::from_str(&raw)
        .map_err(|e| format!("Invalid policies.json: {e}"))
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

#[tauri::command]
pub fn pro_list_quarantine(app: tauri::AppHandle) -> Result<Vec<QuarantineEntry>, String> {
    // ✅ Read from authoritative runtime guardian log (beta: log-only quarantine)
    let raw = match crate::read_runtime_file("logs/guardian_decisions.jsonl".into()) {
        Ok(v) => v,
        Err(_) => return Ok(vec![]),
    };

    let worker_root = crate::resolve_worker_root(&app)
        .map_err(|e| format!("resolve_worker_root failed: {e}"))?;

    let mut out = vec![];

    for line in raw.lines() {
        if let Ok(parsed) = serde_json::from_str::<GuardianDecisionLiteLog>(line) {
            let is_quarantined =
                parsed.threat_score >= 85
                || parsed.reason.to_lowercase().contains("quarantine");

            if !is_quarantined {
                continue;
            }

            let name = format!("{}-{}", parsed.tenant, parsed.timestamp);

            let runtime_path = home_dir()
                .join(".nightcore")
                .join("logs")
                .join("guardian_decisions.jsonl");

            let masked = mask_worker_path(&worker_root, &runtime_path.to_string_lossy());

            out.push(QuarantineEntry {
                name,
                tenant: parsed.tenant,
                timestamp: parsed.timestamp,
                path: masked,
            });
        }
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
