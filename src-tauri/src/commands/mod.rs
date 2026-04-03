use tauri::State;
use sqlx::SqlitePool;
use uuid::Uuid;
use chrono::Utc;

use crate::models::{
    HttpRequest, HttpResponse,
    Collection, SavedRequest,
    Environment, HistoryEntry,
};
use crate::http;
use crate::storage;

// ================================================================
//  HTTP
// ================================================================

#[tauri::command]
pub async fn send_http_request(
    request: HttpRequest,
    pool: State<'_, SqlitePool>,
) -> Result<HttpResponse, String> {
    let response = http::execute_request(request.clone()).await?;

    // Guardar en historial automáticamente
    let entry = HistoryEntry {
        id: Uuid::new_v4().to_string(),
        request,
        response: response.clone(),
        timestamp: Utc::now().to_rfc3339(),
        collection_id: None,
    };
    storage::save_history(&pool, &entry).await?;

    Ok(response)
}

// ================================================================
//  COLLECTIONS
// ================================================================

#[tauri::command]
pub async fn save_collection(
    collection: Collection,
    pool: State<'_, SqlitePool>,
) -> Result<(), String> {
    storage::save_collection(&pool, &collection).await
}

#[tauri::command]
pub async fn get_collections(
    pool: State<'_, SqlitePool>,
) -> Result<Vec<Collection>, String> {
    storage::get_collections(&pool).await
}

#[tauri::command]
pub async fn delete_collection(
    id: String,
    pool: State<'_, SqlitePool>,
) -> Result<(), String> {
    storage::delete_collection(&pool, &id).await
}

// ================================================================
//  REQUESTS
// ================================================================

#[tauri::command]
pub async fn save_request(
    request: SavedRequest,
    pool: State<'_, SqlitePool>,
) -> Result<(), String> {
    storage::save_request(&pool, &request).await
}

#[tauri::command]
pub async fn delete_request(
    id: String,
    pool: State<'_, SqlitePool>,
) -> Result<(), String> {
    storage::delete_request(&pool, &id).await
}

// ================================================================
//  HISTORY
// ================================================================

#[tauri::command]
pub async fn get_history(
    limit: Option<i64>,
    pool: State<'_, SqlitePool>,
) -> Result<Vec<HistoryEntry>, String> {
    storage::get_history(&pool, limit.unwrap_or(100)).await
}

#[tauri::command]
pub async fn clear_history(
    pool: State<'_, SqlitePool>,
) -> Result<(), String> {
    storage::clear_history(&pool).await
}

// ================================================================
//  ENVIRONMENTS
// ================================================================

#[tauri::command]
pub async fn save_environment(
    environment: Environment,
    pool: State<'_, SqlitePool>,
) -> Result<(), String> {
    storage::save_environment(&pool, &environment).await
}

#[tauri::command]
pub async fn get_environments(
    pool: State<'_, SqlitePool>,
) -> Result<Vec<Environment>, String> {
    storage::get_environments(&pool).await
}

#[tauri::command]
pub async fn delete_environment(
    id: String,
    pool: State<'_, SqlitePool>,
) -> Result<(), String> {
    storage::delete_environment(&pool, &id).await
}