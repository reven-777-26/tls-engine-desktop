use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HttpMetadata {
    pub x_cache: Option<String>,
    pub cf_cache_status: Option<String>,
    pub server: Option<String>,
    pub date: Option<String>,
    pub x_powered_by: Option<String>,
    pub status_code: u16,
    pub roundtrip_ms: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VerificationIssue {
    pub code: Option<String>,
    pub severity: Option<String>,
    pub message: Option<String>,
    pub certificate: Option<usize>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VerificationInfo {
    pub trusted: bool,
    pub status: String,
    #[serde(default)]
    pub issues: Vec<VerificationIssue>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NegotiatedTls {
    pub protocol: Option<String>,
    pub cipher_name: Option<String>,
    pub cipher_bits: Option<u32>,
    pub cipher_version: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TargetInfo {
    pub host: String,
    pub port: u16,
    pub endpoint: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConnectionInfo {
    pub successful: bool,
    pub connect_time_ms: Option<f64>,
    pub remote_address: Option<String>,
    pub timed_out: Option<bool>,
    pub stream_type: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InspectionMetadata {
    pub timestamp: String,
    pub duration_ms: Option<f64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InspectionEnvelope {
    pub id: Option<i64>,
    pub host: String,
    pub metadata: HttpMetadata,
    pub data: serde_json::Value,
    pub raw_json: String,
    pub from_cache: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HistoryItemSummary {
    pub id: i64,
    pub host: String,
    pub inspected_at: String,
    pub is_trusted: bool,
    pub tls_version: Option<String>,
    pub cipher_name: Option<String>,
    pub x_cache: Option<String>,
    pub duration_ms: Option<f64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HealthStatus {
    pub healthy: bool,
    pub status_code: u16,
    pub message: String,
    pub checked_at: String,
    pub x_powered_by: Option<String>,
}
