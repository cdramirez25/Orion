use sqlx::{SqlitePool, sqlite::SqlitePoolOptions, Row};
use crate::models::{
    Collection, SavedRequest, Environment, HistoryEntry,
    HttpRequest, HttpResponse,
};
use std::collections::HashMap;
use serde_json;

// ================================================================
//  INICIALIZACIÓN
// ================================================================

pub async fn init_db(db_path: &str) -> Result<SqlitePool, String> {
    let pool = SqlitePoolOptions::new()
        .max_connections(5)
        .connect(&format!("sqlite:{}?mode=rwc", db_path))
        .await
        .map_err(|e| format!("Error conectando a SQLite: {}", e))?;

    create_tables(&pool).await?;
    Ok(pool)
}

async fn create_tables(pool: &SqlitePool) -> Result<(), String> {
    sqlx::query(
        "CREATE TABLE IF NOT EXISTS collections (
            id          TEXT PRIMARY KEY,
            name        TEXT NOT NULL,
            description TEXT,
            created_at  TEXT NOT NULL DEFAULT (datetime('now'))
        )"
    ).execute(pool).await.map_err(|e| e.to_string())?;

    sqlx::query(
        "CREATE TABLE IF NOT EXISTS folders (
            id            TEXT PRIMARY KEY,
            name          TEXT NOT NULL,
            collection_id TEXT NOT NULL,
            FOREIGN KEY (collection_id) REFERENCES collections(id) ON DELETE CASCADE
        )"
    ).execute(pool).await.map_err(|e| e.to_string())?;

    sqlx::query(
        "CREATE TABLE IF NOT EXISTS requests (
            id            TEXT PRIMARY KEY,
            name          TEXT NOT NULL,
            collection_id TEXT NOT NULL,
            folder_id     TEXT,
            request_json  TEXT NOT NULL,
            created_at    TEXT NOT NULL DEFAULT (datetime('now')),
            FOREIGN KEY (collection_id) REFERENCES collections(id) ON DELETE CASCADE
        )"
    ).execute(pool).await.map_err(|e| e.to_string())?;

    sqlx::query(
        "CREATE TABLE IF NOT EXISTS history (
            id            TEXT PRIMARY KEY,
            request_json  TEXT NOT NULL,
            response_json TEXT NOT NULL,
            timestamp     TEXT NOT NULL DEFAULT (datetime('now')),
            collection_id TEXT
        )"
    ).execute(pool).await.map_err(|e| e.to_string())?;

    sqlx::query(
        "CREATE TABLE IF NOT EXISTS environments (
            id        TEXT PRIMARY KEY,
            name      TEXT NOT NULL,
            variables TEXT NOT NULL DEFAULT '{}',
            is_active INTEGER NOT NULL DEFAULT 0
        )"
    ).execute(pool).await.map_err(|e| e.to_string())?;

    sqlx::query(
        "CREATE TABLE IF NOT EXISTS ai_providers (
            id            TEXT PRIMARY KEY,
            name          TEXT NOT NULL,
            provider_type TEXT NOT NULL,
            api_key       TEXT,
            base_url      TEXT,
            model         TEXT NOT NULL
        )"
    ).execute(pool).await.map_err(|e| e.to_string())?;

    sqlx::query(
        "CREATE TABLE IF NOT EXISTS agents (
            id          TEXT PRIMARY KEY,
            name        TEXT NOT NULL,
            description TEXT,
            steps_json  TEXT NOT NULL DEFAULT '[]',
            provider_id TEXT NOT NULL,
            created_at  TEXT NOT NULL DEFAULT (datetime('now'))
        )"
    ).execute(pool).await.map_err(|e| e.to_string())?;

    Ok(())
}

// ================================================================
//  COLLECTIONS
// ================================================================

pub async fn save_collection(pool: &SqlitePool, collection: &Collection) -> Result<(), String> {
    sqlx::query(
        "INSERT INTO collections (id, name, description)
         VALUES (?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
            name = excluded.name,
            description = excluded.description"
    )
    .bind(&collection.id)
    .bind(&collection.name)
    .bind(&collection.description)
    .execute(pool)
    .await
    .map_err(|e| format!("Error guardando colección: {}", e))?;

    Ok(())
}

pub async fn get_collections(pool: &SqlitePool) -> Result<Vec<Collection>, String> {
    let rows = sqlx::query(
        "SELECT id, name, description FROM collections ORDER BY created_at DESC"
    )
    .fetch_all(pool)
    .await
    .map_err(|e| format!("Error obteniendo colecciones: {}", e))?;

    let mut collections = vec![];
    for row in rows {
        let id: String = row.get("id");
        let requests = get_requests_by_collection(pool, &id).await?;
        collections.push(Collection {
            id,
            name: row.get("name"),
            description: row.get("description"),
            folders: vec![],
            requests,
        });
    }

    Ok(collections)
}

pub async fn delete_collection(pool: &SqlitePool, id: &str) -> Result<(), String> {
    sqlx::query("DELETE FROM collections WHERE id = ?")
        .bind(id)
        .execute(pool)
        .await
        .map_err(|e| format!("Error eliminando colección: {}", e))?;
    Ok(())
}

// ================================================================
//  REQUESTS
// ================================================================

pub async fn save_request(pool: &SqlitePool, saved: &SavedRequest) -> Result<(), String> {
    let request_json = serde_json::to_string(&saved.request)
        .map_err(|e| format!("Error serializando request: {}", e))?;

    sqlx::query(
        "INSERT INTO requests (id, name, collection_id, folder_id, request_json)
         VALUES (?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
            name = excluded.name,
            request_json = excluded.request_json,
            folder_id = excluded.folder_id"
    )
    .bind(&saved.id)
    .bind(&saved.name)
    .bind(&saved.collection_id)
    .bind(&saved.folder_id)
    .bind(&request_json)
    .execute(pool)
    .await
    .map_err(|e| format!("Error guardando request: {}", e))?;

    Ok(())
}

pub async fn get_requests_by_collection(
    pool: &SqlitePool,
    collection_id: &str,
) -> Result<Vec<SavedRequest>, String> {
    let rows = sqlx::query(
        "SELECT id, name, collection_id, folder_id, request_json
         FROM requests WHERE collection_id = ? ORDER BY created_at ASC"
    )
    .bind(collection_id)
    .fetch_all(pool)
    .await
    .map_err(|e| format!("Error obteniendo requests: {}", e))?;

    let mut requests = vec![];
    for row in rows {
        let request_json: String = row.get("request_json");
        let request: HttpRequest = serde_json::from_str(&request_json)
            .map_err(|e| format!("Error deserializando request: {}", e))?;

        requests.push(SavedRequest {
            id: row.get("id"),
            name: row.get("name"),
            collection_id: row.get("collection_id"),
            folder_id: row.get("folder_id"),
            request,
        });
    }

    Ok(requests)
}

pub async fn delete_request(pool: &SqlitePool, id: &str) -> Result<(), String> {
    sqlx::query("DELETE FROM requests WHERE id = ?")
        .bind(id)
        .execute(pool)
        .await
        .map_err(|e| format!("Error eliminando request: {}", e))?;
    Ok(())
}

// ================================================================
//  HISTORY
// ================================================================

pub async fn save_history(pool: &SqlitePool, entry: &HistoryEntry) -> Result<(), String> {
    let request_json = serde_json::to_string(&entry.request)
        .map_err(|e| format!("Error serializando request: {}", e))?;
    let response_json = serde_json::to_string(&entry.response)
        .map_err(|e| format!("Error serializando response: {}", e))?;

    sqlx::query(
        "INSERT INTO history (id, request_json, response_json, timestamp, collection_id)
         VALUES (?, ?, ?, ?, ?)"
    )
    .bind(&entry.id)
    .bind(&request_json)
    .bind(&response_json)
    .bind(&entry.timestamp)
    .bind(&entry.collection_id)
    .execute(pool)
    .await
    .map_err(|e| format!("Error guardando historial: {}", e))?;

    Ok(())
}

pub async fn get_history(pool: &SqlitePool, limit: i64) -> Result<Vec<HistoryEntry>, String> {
    let rows = sqlx::query(
        "SELECT id, request_json, response_json, timestamp, collection_id
         FROM history ORDER BY timestamp DESC LIMIT ?"
    )
    .bind(limit)
    .fetch_all(pool)
    .await
    .map_err(|e| format!("Error obteniendo historial: {}", e))?;

    let mut entries = vec![];
    for row in rows {
        let request: HttpRequest = serde_json::from_str(row.get("request_json"))
            .map_err(|e| format!("Error deserializando request: {}", e))?;
        let response: HttpResponse = serde_json::from_str(row.get("response_json"))
            .map_err(|e| format!("Error deserializando response: {}", e))?;

        entries.push(HistoryEntry {
            id: row.get("id"),
            request,
            response,
            timestamp: row.get("timestamp"),
            collection_id: row.get("collection_id"),
        });
    }

    Ok(entries)
}

pub async fn clear_history(pool: &SqlitePool) -> Result<(), String> {
    sqlx::query("DELETE FROM history")
        .execute(pool)
        .await
        .map_err(|e| format!("Error limpiando historial: {}", e))?;
    Ok(())
}

// ================================================================
//  ENVIRONMENTS
// ================================================================

pub async fn save_environment(pool: &SqlitePool, env: &Environment) -> Result<(), String> {
    let variables_json = serde_json::to_string(&env.variables)
        .map_err(|e| format!("Error serializando variables: {}", e))?;

    sqlx::query(
        "INSERT INTO environments (id, name, variables, is_active)
         VALUES (?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
            name = excluded.name,
            variables = excluded.variables,
            is_active = excluded.is_active"
    )
    .bind(&env.id)
    .bind(&env.name)
    .bind(&variables_json)
    .bind(env.is_active as i32)
    .execute(pool)
    .await
    .map_err(|e| format!("Error guardando entorno: {}", e))?;

    Ok(())
}

pub async fn get_environments(pool: &SqlitePool) -> Result<Vec<Environment>, String> {
    let rows = sqlx::query(
        "SELECT id, name, variables, is_active FROM environments"
    )
    .fetch_all(pool)
    .await
    .map_err(|e| format!("Error obteniendo entornos: {}", e))?;

    let mut envs = vec![];
    for row in rows {
        let variables: HashMap<String, String> =
            serde_json::from_str(row.get("variables")).unwrap_or_default();
        let is_active: i32 = row.get("is_active");

        envs.push(Environment {
            id: row.get("id"),
            name: row.get("name"),
            variables,
            is_active: is_active != 0,
        });
    }

    Ok(envs)
}

pub async fn delete_environment(pool: &SqlitePool, id: &str) -> Result<(), String> {
    sqlx::query("DELETE FROM environments WHERE id = ?")
        .bind(id)
        .execute(pool)
        .await
        .map_err(|e| format!("Error eliminando entorno: {}", e))?;
    Ok(())
}