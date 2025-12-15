use anyhow::{Result, anyhow};
use reqwest::blocking::Client;
use serde::Deserialize;

#[derive(Debug, Deserialize)]
struct LemonResponse {
    valid: bool,
    error: Option<String>,
    license_key: Option<LemonLicenseKey>,
}

#[derive(Debug, Deserialize)]
struct LemonLicenseKey {
    status: String, // active | expired | disabled
}

pub fn validate_lemon_license(license_key: &str) -> Result<()> {
    let client = Client::new();

    let resp = client
        .post("https://api.lemonsqueezy.com/v1/licenses/validate")
        .form(&[
            ("license_key", license_key),
            ("activation_name", "Night Core Console"),
        ])
        .send()
        .map_err(|e| anyhow!("Failed to reach Lemon Squeezy: {}", e))?;

    if !resp.status().is_success() {
        return Err(anyhow!(
            "Lemon Squeezy returned HTTP {}",
            resp.status()
        ));
    }

    let body: LemonResponse = resp
        .json()
        .map_err(|e| anyhow!("Invalid response from Lemon Squeezy: {}", e))?;

    if !body.valid {
        return Err(anyhow!(
            body.error.unwrap_or_else(|| "License is invalid".into())
        ));
    }

    if let Some(key) = body.license_key {
        if key.status != "active" {
            return Err(anyhow!(
                "License status is '{}' (not active)",
                key.status
            ));
        }
    } else {
        return Err(anyhow!("Missing license status from Lemon"));
    }

    Ok(())
}
