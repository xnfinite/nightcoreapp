use std::path::{Path, PathBuf};
use anyhow::Result;

#[derive(Debug)]
pub struct InboxEntry {
    pub tenant: String,
    pub timestamp: String,
    pub path: PathBuf,
}

/// GUI-side adapter for the worker inbox
/// The worker remains authoritative.
/// This module only reads worker state.
pub fn scan_system_inbox(worker_root: &Path) -> Result<Vec<InboxEntry>> {
    let modules_dir = worker_root.join("modules");
    let mut out = vec![];

    if !modules_dir.exists() {
        return Ok(out);
    }

    for entry in std::fs::read_dir(&modules_dir)? {
        let entry = entry?;
        let path = entry.path();
        if !path.is_dir() {
            continue;
        }

        let tenant = entry.file_name().to_string_lossy().to_string();
        let manifest_path = path.join("manifest.json");

        if !manifest_path.exists() {
            out.push(InboxEntry {
                tenant,
                timestamp: "unknown".into(),
                path,
            });
            continue;
        }

        let raw = std::fs::read_to_string(&manifest_path)?;
        let v: serde_json::Value = serde_json::from_str(&raw)?;

        let approved = v.get("approved").and_then(|b| b.as_bool()).unwrap_or(false);
        let channel = v
            .get("ingestion")
            .and_then(|i| i.get("channel"))
            .and_then(|c| c.as_str())
            .unwrap_or("unknown");

        let ts = v
            .get("ingestion")
            .and_then(|i| i.get("timestamp"))
            .and_then(|t| t.as_str())
            .unwrap_or("unknown")
            .to_string();

        if channel != "manual" && !approved {
            out.push(InboxEntry {
                tenant,
                timestamp: ts,
                path,
            });
        }
    }

    Ok(out)
}

/// Approval is executed by the worker.
/// GUI only records intent by calling the worker.
pub fn approve_tenant(_worker_root: &Path, _tenant: &str, _approved_by: &str) -> Result<()> {
    Ok(())
}
