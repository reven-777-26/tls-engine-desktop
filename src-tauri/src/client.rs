use std::time::Instant;
use chrono::Utc;
use reqwest::header::HeaderMap;

use crate::db::Database;
use crate::models::{HealthStatus, HttpMetadata, InspectionEnvelope};
use crate::validator::sanitize_and_validate_host;

const BASE_API_URL: &str = "https://tls.kroatenwerk.com";

pub struct ApiClient {
    client: reqwest::Client,
}

impl ApiClient {
    pub fn new() -> Result<Self, String> {
        // Enforce secure TLS verification and sensible timeout
        let client = reqwest::Client::builder()
            .timeout(std::time::Duration::from_secs(20))
            .user_agent("TLS-Engine-Desktop/1.0")
            .build()
            .map_err(|e| format!("Failed to initialize HTTP client: {}", e))?;

        Ok(Self { client })
    }

    /// Performs a TLS inspection for the given host input.
    pub async fn inspect_host(
        &self,
        raw_input: &str,
        db: &Database,
    ) -> Result<InspectionEnvelope, String> {
        let clean_host = sanitize_and_validate_host(raw_input)?;
        let url = format!("{}/v1/{}", BASE_API_URL, clean_host);

        let start = Instant::now();
        let resp = self
            .client
            .get(&url)
            .send()
            .await
            .map_err(|e| format!("Network request failed: {}", e))?;

        let roundtrip_ms = start.elapsed().as_secs_f64() * 1000.0;
        let status = resp.status();
        let headers = resp.headers().clone();

        let metadata = extract_metadata(&headers, status.as_u16(), roundtrip_ms);

        let raw_text = resp
            .text()
            .await
            .map_err(|e| format!("Failed to read response body: {}", e))?;

        if !status.is_success() {
            if status.as_u16() == 500 || status.is_server_error() {
                return Err(format!(
                    "The website '{}' does not have a valid security certificate or is currently offline. Please check the spelling of the domain and try again.",
                    clean_host
                ));
            }

            if let Ok(err_json) = serde_json::from_str::<serde_json::Value>(&raw_text) {
                if let Some(msg) = err_json.get("error").and_then(|v| v.as_str()) {
                    return Err(format!("Could not scan '{}': {}", clean_host, msg));
                }
            }

            return Err(format!(
                "Could not connect to '{}'. Please check the domain spelling or verify that the website is online.",
                clean_host
            ));
        }

        let parsed_json: serde_json::Value = serde_json::from_str(&raw_text)
            .map_err(|e| format!("Failed to parse TLS response JSON: {}", e))?;

        // Extract key summary metrics for database persistence
        let is_trusted = parsed_json
            .get("verification")
            .and_then(|v| v.get("trusted"))
            .and_then(|t| t.as_bool())
            .unwrap_or(false);

        let tls_version = parsed_json
            .get("tls")
            .and_then(|t| t.get("negotiated"))
            .and_then(|n| n.get("protocol"))
            .and_then(|p| p.as_str())
            .map(|s| s.to_string());

        let cipher_name = parsed_json
            .get("tls")
            .and_then(|t| t.get("negotiated"))
            .and_then(|n| n.get("cipher_name"))
            .and_then(|c| c.as_str())
            .map(|s| s.to_string());

        let duration_ms = parsed_json
            .get("inspection")
            .and_then(|i| i.get("duration_ms"))
            .and_then(|d| d.as_f64())
            .or_else(|| {
                parsed_json
                    .get("connection")
                    .and_then(|c| c.get("connect_time_ms"))
                    .and_then(|d| d.as_f64())
            })
            .or(Some(roundtrip_ms));

        let now_iso = Utc::now().to_rfc3339();

        // Only store SUCCESSFUL inspections in local history (as mandated by spec)
        let inserted_id = db
            .insert_inspection(
                &clean_host,
                &now_iso,
                is_trusted,
                tls_version.as_deref(),
                cipher_name.as_deref(),
                metadata.x_cache.as_deref(),
                duration_ms,
                &metadata,
                &raw_text,
            )
            .ok();

        Ok(InspectionEnvelope {
            id: inserted_id,
            host: clean_host,
            metadata,
            data: parsed_json,
            raw_json: raw_text,
            from_cache: false,
        })
    }

    /// Queries the health endpoint.
    pub async fn check_health(&self) -> Result<HealthStatus, String> {
        let url = format!("{}/health", BASE_API_URL);
        let resp = self
            .client
            .get(&url)
            .send()
            .await
            .map_err(|e| format!("Health check request failed: {}", e))?;

        let status = resp.status();
        let headers = resp.headers();
        let x_powered_by = headers
            .get("x-powered-by")
            .and_then(|v| v.to_str().ok())
            .map(|s| s.to_string());

        let body = resp.text().await.unwrap_or_default();
        let is_ok = status.is_success() && body.trim() == "OK";

        Ok(HealthStatus {
            healthy: is_ok,
            status_code: status.as_u16(),
            message: if is_ok {
                "TLS Engine Service is operational".to_string()
            } else {
                format!("Unexpected response: {}", body.trim())
            },
            checked_at: Utc::now().to_rfc3339(),
            x_powered_by,
        })
    }
}

fn extract_metadata(headers: &HeaderMap, status_code: u16, roundtrip_ms: f64) -> HttpMetadata {
    let x_cache = headers
        .get("x-cache")
        .and_then(|v| v.to_str().ok())
        .map(|s| s.to_string());

    let cf_cache_status = headers
        .get("cf-cache-status")
        .and_then(|v| v.to_str().ok())
        .map(|s| s.to_string());

    let server = headers
        .get("server")
        .and_then(|v| v.to_str().ok())
        .map(|s| s.to_string());

    let date = headers
        .get("date")
        .and_then(|v| v.to_str().ok())
        .map(|s| s.to_string());

    let x_powered_by = headers
        .get("x-powered-by")
        .and_then(|v| v.to_str().ok())
        .map(|s| s.to_string());

    HttpMetadata {
        x_cache,
        cf_cache_status,
        server,
        date,
        x_powered_by,
        status_code,
        roundtrip_ms: (roundtrip_ms * 10.0).round() / 10.0,
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use reqwest::header::{HeaderMap, HeaderValue};

    #[test]
    fn test_extract_metadata_headers() {
        let mut headers = HeaderMap::new();
        headers.insert("x-cache", HeaderValue::from_static("HIT"));
        headers.insert("server", HeaderValue::from_static("cloudflare"));
        headers.insert("cf-cache-status", HeaderValue::from_static("DYNAMIC"));
        headers.insert("x-powered-by", HeaderValue::from_static("TLS Engine/2026.1.0"));

        let meta = extract_metadata(&headers, 200, 34.56);
        assert_eq!(meta.x_cache.as_deref(), Some("HIT"));
        assert_eq!(meta.server.as_deref(), Some("cloudflare"));
        assert_eq!(meta.cf_cache_status.as_deref(), Some("DYNAMIC"));
        assert_eq!(meta.x_powered_by.as_deref(), Some("TLS Engine/2026.1.0"));
        assert_eq!(meta.status_code, 200);
        assert_eq!(meta.roundtrip_ms, 34.6);
    }

    #[test]
    fn test_extract_metadata_missing_headers() {
        let headers = HeaderMap::new();
        let meta = extract_metadata(&headers, 404, 12.0);
        assert_eq!(meta.x_cache, None);
        assert_eq!(meta.server, None);
        assert_eq!(meta.status_code, 404);
        assert_eq!(meta.roundtrip_ms, 12.0);
    }
}

