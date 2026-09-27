use std::path::PathBuf;
use std::sync::Mutex;
use rusqlite::{params, Connection, Result};

use crate::models::{HistoryItemSummary, HttpMetadata, InspectionEnvelope};

pub struct Database {
    conn: Mutex<Connection>,
}

impl Database {
    /// Opens or creates the SQLite database at the specified path.
    pub fn new(path: PathBuf) -> Result<Self> {
        if let Some(parent) = path.parent() {
            let _ = std::fs::create_dir_all(parent);
        }
        let conn = Connection::open(path)?;
        let db = Self {
            conn: Mutex::new(conn),
        };
        db.init_schema()?;
        Ok(db)
    }

    /// Creates an in-memory database for testing.
    #[cfg(test)]
    pub fn new_in_memory() -> Result<Self> {
        let conn = Connection::open_in_memory()?;
        let db = Self {
            conn: Mutex::new(conn),
        };
        db.init_schema()?;
        Ok(db)
    }

    /// Initializes tables and indexes.
    pub fn init_schema(&self) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute_batch(
            r#"
            CREATE TABLE IF NOT EXISTS inspections (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                host TEXT NOT NULL,
                inspected_at TEXT NOT NULL,
                is_trusted INTEGER NOT NULL,
                tls_version TEXT,
                cipher_name TEXT,
                x_cache TEXT,
                duration_ms REAL,
                metadata_json TEXT NOT NULL,
                raw_json TEXT NOT NULL
            );

            CREATE INDEX IF NOT EXISTS idx_inspections_host ON inspections(host);
            CREATE INDEX IF NOT EXISTS idx_inspections_date ON inspections(inspected_at DESC);
            "#,
        )?;
        Ok(())
    }

    /// Inserts a successful inspection into history.
    pub fn insert_inspection(
        &self,
        host: &str,
        inspected_at: &str,
        is_trusted: bool,
        tls_version: Option<&str>,
        cipher_name: Option<&str>,
        x_cache: Option<&str>,
        duration_ms: Option<f64>,
        metadata: &HttpMetadata,
        raw_json: &str,
    ) -> Result<i64> {
        let conn = self.conn.lock().unwrap();
        let metadata_str = serde_json::to_string(metadata).unwrap_or_default();

        conn.execute(
            r#"
            INSERT INTO inspections (
                host, inspected_at, is_trusted, tls_version, cipher_name, x_cache, duration_ms, metadata_json, raw_json
            ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)
            "#,
            params![
                host,
                inspected_at,
                if is_trusted { 1 } else { 0 },
                tls_version,
                cipher_name,
                x_cache,
                duration_ms,
                metadata_str,
                raw_json
            ],
        )?;

        Ok(conn.last_insert_rowid())
    }

    /// Retrieves history summaries, optionally filtered by a search term.
    pub fn list_history(&self, search: Option<&str>) -> Result<Vec<HistoryItemSummary>> {
        let conn = self.conn.lock().unwrap();
        let mut items = Vec::new();

        if let Some(query) = search.map(|s| s.trim()).filter(|s| !s.is_empty()) {
            let pattern = format!("%{}%", query.to_lowercase());
            let mut stmt = conn.prepare(
                r#"
                SELECT id, host, inspected_at, is_trusted, tls_version, cipher_name, x_cache, duration_ms
                FROM inspections
                WHERE LOWER(host) LIKE ?1
                ORDER BY id DESC
                LIMIT 100
                "#,
            )?;
            let rows = stmt.query_map(params![pattern], |row| {
                Ok(HistoryItemSummary {
                    id: row.get(0)?,
                    host: row.get(1)?,
                    inspected_at: row.get(2)?,
                    is_trusted: row.get::<_, i32>(3)? != 0,
                    tls_version: row.get(4)?,
                    cipher_name: row.get(5)?,
                    x_cache: row.get(6)?,
                    duration_ms: row.get(7)?,
                })
            })?;
            for row in rows {
                items.push(row?);
            }
        } else {
            let mut stmt = conn.prepare(
                r#"
                SELECT id, host, inspected_at, is_trusted, tls_version, cipher_name, x_cache, duration_ms
                FROM inspections
                ORDER BY id DESC
                LIMIT 100
                "#,
            )?;
            let rows = stmt.query_map([], |row| {
                Ok(HistoryItemSummary {
                    id: row.get(0)?,
                    host: row.get(1)?,
                    inspected_at: row.get(2)?,
                    is_trusted: row.get::<_, i32>(3)? != 0,
                    tls_version: row.get(4)?,
                    cipher_name: row.get(5)?,
                    x_cache: row.get(6)?,
                    duration_ms: row.get(7)?,
                })
            })?;
            for row in rows {
                items.push(row?);
            }
        }

        Ok(items)
    }

    /// Loads a full previous inspection by ID without making any network requests.
    pub fn get_inspection_by_id(&self, id: i64) -> Result<Option<InspectionEnvelope>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            r#"
            SELECT host, metadata_json, raw_json
            FROM inspections
            WHERE id = ?1
            "#,
        )?;

        let mut rows = stmt.query(params![id])?;
        if let Some(row) = rows.next()? {
            let host: String = row.get(0)?;
            let metadata_json: String = row.get(1)?;
            let raw_json: String = row.get(2)?;

            let metadata: HttpMetadata = serde_json::from_str(&metadata_json).unwrap_or(HttpMetadata {
                x_cache: None,
                cf_cache_status: None,
                server: None,
                date: None,
                x_powered_by: None,
                status_code: 200,
                roundtrip_ms: 0.0,
            });

            let data: serde_json::Value = serde_json::from_str(&raw_json).unwrap_or(serde_json::Value::Null);

            Ok(Some(InspectionEnvelope {
                id: Some(id),
                host,
                metadata,
                data,
                raw_json,
                from_cache: true,
            }))
        } else {
            Ok(None)
        }
    }

    /// Deletes a specific history record by ID.
    pub fn delete_inspection(&self, id: i64) -> Result<bool> {
        let conn = self.conn.lock().unwrap();
        let affected = conn.execute("DELETE FROM inspections WHERE id = ?1", params![id])?;
        Ok(affected > 0)
    }

    /// Clears all history records.
    pub fn clear_history(&self) -> Result<usize> {
        let conn = self.conn.lock().unwrap();
        let affected = conn.execute("DELETE FROM inspections", [])?;
        Ok(affected)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_db_crud() {
        let db = Database::new_in_memory().unwrap();
        let metadata = HttpMetadata {
            x_cache: Some("HIT".to_string()),
            cf_cache_status: Some("DYNAMIC".to_string()),
            server: Some("cloudflare".to_string()),
            date: Some("Sun, 27 Sep 2026 12:00:00 GMT".to_string()),
            x_powered_by: Some("TLS Engine".to_string()),
            status_code: 200,
            roundtrip_ms: 45.2,
        };

        // Insert
        let id = db.insert_inspection(
            "example.com",
            "2026-09-27T12:00:00Z",
            true,
            Some("TLSv1.3"),
            Some("TLS_AES_256_GCM_SHA384"),
            Some("HIT"),
            Some(45.2),
            &metadata,
            r#"{"status":"valid"}"#,
        ).unwrap();

        assert!(id > 0);

        // List
        let list = db.list_history(None).unwrap();
        assert_eq!(list.len(), 1);
        assert_eq!(list[0].host, "example.com");
        assert_eq!(list[0].x_cache.as_deref(), Some("HIT"));

        // Search
        let filtered = db.list_history(Some("exam")).unwrap();
        assert_eq!(filtered.len(), 1);
        let none_found = db.list_history(Some("nomatch")).unwrap();
        assert_eq!(none_found.len(), 0);

        // Get by ID
        let envelope = db.get_inspection_by_id(id).unwrap().unwrap();
        assert_eq!(envelope.host, "example.com");
        assert!(envelope.from_cache);
        assert_eq!(envelope.metadata.x_cache.as_deref(), Some("HIT"));

        // Delete
        assert!(db.delete_inspection(id).unwrap());
        assert_eq!(db.list_history(None).unwrap().len(), 0);

        // Clear all
        db.insert_inspection("a.com", "t1", true, None, None, None, None, &metadata, "{}").unwrap();
        db.insert_inspection("b.com", "t2", true, None, None, None, None, &metadata, "{}").unwrap();
        assert_eq!(db.list_history(None).unwrap().len(), 2);
        db.clear_history().unwrap();
        assert_eq!(db.list_history(None).unwrap().len(), 0);
    }
}
