use serde::{Deserialize, Serialize};
use std::collections::HashMap;

// ================================================================
//  HTTP
// ================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HttpRequest {
    pub method: String,
    pub url: String,
    pub headers: HashMap<String, String>,
    pub body: Option<String>,
    pub auth: Option<AuthConfig>,
    pub timeout_ms: Option<u64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HttpResponse {
    pub status: u16,
    pub headers: HashMap<String, String>,
    pub body: String,
    pub duration_ms: u64,
    pub size_bytes: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum AuthConfig {
    Bearer { token: String },
    Basic { username: String, password: String },
    ApiKey { key: String, value: String, location: ApiKeyLocation },
    None,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum ApiKeyLocation {
    Header,
    Query,
}

// ================================================================
//  AI
// ================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AIProvider {
    pub id: String,
    pub name: String,
    pub provider_type: AIProviderType,
    pub api_key: Option<String>,
    pub base_url: Option<String>,
    pub model: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum AIProviderType {
    Anthropic,
    OpenAI,
    Gemini,
    Ollama,
    LmStudio,
    Custom,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AIMessage {
    pub role: AIRole,
    pub content: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum AIRole {
    System,
    User,
    Assistant,
}

// ================================================================
//  AGENT
// ================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Agent {
    pub id: String,
    pub name: String,
    pub description: Option<String>,
    pub steps: Vec<AgentStep>,
    pub provider_id: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum AgentStep {
    HttpStep {
        id: String,
        label: String,
        request: HttpRequest,
        save_as: Option<String>,
    },
    AIStep {
        id: String,
        label: String,
        prompt: String,
        context_keys: Vec<String>,
        save_as: Option<String>,
    },
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentRunResult {
    pub success: bool,
    pub steps_log: Vec<AgentStepLog>,
    pub final_output: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentStepLog {
    pub step_id: String,
    pub label: String,
    pub success: bool,
    pub output: String,
    pub duration_ms: u64,
}

// ================================================================
//  COLLECTIONS
// ================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Collection {
    pub id: String,
    pub name: String,
    pub description: Option<String>,
    pub folders: Vec<Folder>,
    pub requests: Vec<SavedRequest>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Folder {
    pub id: String,
    pub name: String,
    pub requests: Vec<SavedRequest>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SavedRequest {
    pub id: String,
    pub name: String,
    pub request: HttpRequest,
    pub collection_id: String,
    pub folder_id: Option<String>,
}

// ================================================================
//  ENVIRONMENTS
// ================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Environment {
    pub id: String,
    pub name: String,
    pub variables: HashMap<String, String>,
    pub is_active: bool,
}

// ================================================================
//  HISTORY
// ================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HistoryEntry {
    pub id: String,
    pub request: HttpRequest,
    pub response: HttpResponse,
    pub timestamp: String,
    pub collection_id: Option<String>,
}