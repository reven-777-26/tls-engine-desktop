pub mod client;
pub mod db;
pub mod models;
pub mod validator;

use std::path::PathBuf;
use std::sync::Arc;
use tauri::{Manager, State};

use crate::client::ApiClient;
use crate::db::Database;
use crate::models::{HealthStatus, HistoryItemSummary, InspectionEnvelope};

pub struct AppState {
    pub client: Arc<ApiClient>,
    pub db: Arc<Database>,
}

#[tauri::command]
async fn inspect_host(
    host: String,
    state: State<'_, AppState>,
) -> Result<InspectionEnvelope, String> {
    state.client.inspect_host(&host, &state.db).await
}

#[tauri::command]
async fn check_health(state: State<'_, AppState>) -> Result<HealthStatus, String> {
    state.client.check_health().await
}

#[tauri::command]
fn get_history(
    search: Option<String>,
    state: State<'_, AppState>,
) -> Result<Vec<HistoryItemSummary>, String> {
    state
        .db
        .list_history(search.as_deref())
        .map_err(|e| format!("Failed to read history from database: {}", e))
}

#[tauri::command]
fn get_inspection_detail(
    id: i64,
    state: State<'_, AppState>,
) -> Result<InspectionEnvelope, String> {
    state
        .db
        .get_inspection_by_id(id)
        .map_err(|e| format!("Failed to retrieve inspection from database: {}", e))?
        .ok_or_else(|| format!("Inspection with ID {} not found", id))
}

#[tauri::command]
fn delete_history_item(id: i64, state: State<'_, AppState>) -> Result<bool, String> {
    state
        .db
        .delete_inspection(id)
        .map_err(|e| format!("Failed to delete history record: {}", e))
}

#[tauri::command]
fn clear_history(state: State<'_, AppState>) -> Result<usize, String> {
    state
        .db
        .clear_history()
        .map_err(|e| format!("Failed to clear history: {}", e))
}

#[tauri::command]
fn sanitize_input(input: String) -> Result<String, String> {
    validator::sanitize_and_validate_host(&input)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            // Locate or create OS-standard app data directory
            let db_dir = match app.path().app_data_dir() {
                Ok(path) => path,
                Err(_) => PathBuf::from("."),
            };
            let db_path = db_dir.join("tls_engine_history.db");

            let db = Database::new(db_path)
                .expect("Failed to initialize SQLite history database");
            let client = ApiClient::new()
                .expect("Failed to initialize TLS HTTP client");

            app.manage(AppState {
                client: Arc::new(client),
                db: Arc::new(db),
            });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            inspect_host,
            check_health,
            get_history,
            get_inspection_detail,
            delete_history_item,
            clear_history,
            sanitize_input,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
