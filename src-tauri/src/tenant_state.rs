use serde::{Serialize, Deserialize};
use std::{fs, path::Path};
use serde_json::Value;
use anyhow::{Context, Result};
use chrono::Utc;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct TenantState {
    pub id: String,
    pub name: String,

    pub ingestion: IngestionState,
    pub authorization: AuthorizationState,
    pub execution: ExecutionState,
    pub observation: ObservationState,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct IngestionState {
    pub channel: String,    // manual | automated | external | legacy | unspecified
    pub source: String,     // gui | agent | legacy | external-system | unspecified
    pub timestamp: String,  // RFC3339 or "unknown"
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AuthorizationState {
    pub approved: bool,
    pub approved_at: Option<String>,
    pub approved_by: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ExecutionState {
    pub has_executed: bool,
    pub last_execution_time: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ObservationState {
    pub current_threat_score: Option<u8>,
    pub state: String, // pending_approval | blocked | cleared | observed
}

fn read_json(path: &Path) -> Result<Value> {
    let raw = fs::read_to_string(path)
        .with_context(|| format!("reading {}", path.display()))?;
    let v: Value = serde_json::from_str(&raw)
        .with_context(|| format!("parsing {}", path.display()))?;
    Ok(v)
}

fn get_str(v: &Value, keys: &[&str]) -> Option<String> {
    let mut cur = v;
    for k in keys {
        cur = cur.get(*k)?;
    }
    cur.as_str().map(|s| s.to_string())
}

fn get_bool(v: &Value, key: &str) -> Option<bool> {
    v.get(key).and_then(|b| b.as_bool())
}

fn build_decision_index(worker_root: &Path)
-> std::collections::HashMap<String, (String, u8)> {
    let mut out = std::collections::HashMap::new();
    let p = worker_root.join("logs").join("guardian_decisions.jsonl");

    let raw = match fs::read_to_string(&p) {
        Ok(s) => s,
        Err(_) => return out,
    };

    for line in raw.lines() {
        let v: Value = match serde_json::from_str(line) {
            Ok(x) => x,
            Err(_) => continue,
        };

        let tenant = match v.get("tenant").and_then(|t| t.as_str()) {
            Some(t) => t.to_string(),
            None => continue,
        };

        let ts = match v.get("timestamp").and_then(|t| t.as_str()) {
            Some(t) => t.to_string(),
            None => continue,
        };

        let score = v.get("threat_score")
            .and_then(|n| n.as_u64())
            .unwrap_or(0) as u8;

        match out.get(&tenant) {
            None => {
                out.insert(tenant, (ts, score));
            }
            Some((prev_ts, _)) => {
                if ts > *prev_ts {
                    out.insert(tenant, (ts, score));
                }
            }
        }
    }

    out
}

pub fn list_tenant_states(worker_root: &Path) -> Result<Vec<TenantState>> {
    let modules_dir = worker_root.join("modules");
    let decision_index = build_decision_index(worker_root);

    let mut tenants = vec![];

    if !modules_dir.exists() {
        return Ok(tenants);
    }

    for entry in fs::read_dir(&modules_dir)
        .with_context(|| format!("reading {}", modules_dir.display()))?
    {
        let entry = entry?;
        let path = entry.path();
        if !path.is_dir() {
            continue;
        }

        let name = entry.file_name().to_string_lossy().to_string();
        let id = name.clone();

        let manifest_path = path.join("manifest.json");
        let manifest = if manifest_path.exists() {
            Some(read_json(&manifest_path)?)
        } else {
            None
        };

        let (channel, source, ts_ingest) = if let Some(m) = &manifest {
            (
                get_str(m, &["ingestion", "channel"]).unwrap_or_else(|| "unknown".into()),
                get_str(m, &["ingestion", "source"]).unwrap_or_else(|| "unknown".into()),
                get_str(m, &["ingestion", "timestamp"]).unwrap_or_else(|| "unknown".into()),
            )
        } else {
            ("unknown".into(), "unknown".into(), "unknown".into())
        };

        let (approved, approved_at, approved_by) = if let Some(m) = &manifest {
            (
                get_bool(m, "approved").unwrap_or(false),
                m.get("approved_at").and_then(|s| s.as_str()).map(|s| s.to_string()),
                m.get("approved_by").and_then(|s| s.as_str()).map(|s| s.to_string()),
            )
        } else {
            (false, None, None)
        };

        let observed = decision_index.get(&name).cloned();
        let has_executed = observed.is_some();

        let (last_execution_time, current_threat_score) = match observed {
            Some((ts, score)) => (Some(ts), Some(score)),
            None => (None, None),
        };

        let state = if !manifest_path.exists() {
            "blocked".to_string()
        } else if has_executed {
            "observed".to_string()
        } else if channel != "manual" && !approved {
            "pending_approval".to_string()
        } else {
            "cleared".to_string()
        };

        tenants.push(TenantState {
            id,
            name,
            ingestion: IngestionState {
                channel,
                source,
                timestamp: ts_ingest,
            },
            authorization: AuthorizationState {
                approved,
                approved_at,
                approved_by,
            },
            execution: ExecutionState {
                has_executed,
                last_execution_time,
            },
            observation: ObservationState {
                current_threat_score,
                state,
            },
        });
    }

    tenants.sort_by(|a, b| a.name.cmp(&b.name));
    Ok(tenants)
}

//
// 🔐 NEW — persist authorization so GUI + Watchtower update correctly
//
pub fn mark_authorized(worker_root: &Path, tenant: &str) -> Result<()> {
    let manifest_path = worker_root
        .join("modules")
        .join(tenant)
        .join("manifest.json");

    let raw = fs::read_to_string(&manifest_path)
        .with_context(|| format!("reading {}", manifest_path.display()))?;

    let mut v: Value = serde_json::from_str(&raw)
        .with_context(|| format!("parsing {}", manifest_path.display()))?;

    v["approved"] = Value::Bool(true);
    v["approved_at"] = Value::String(Utc::now().to_rfc3339());
    v["approved_by"] = Value::String("gui".into());

    fs::write(&manifest_path, serde_json::to_string_pretty(&v)?)?;
    Ok(())
}
