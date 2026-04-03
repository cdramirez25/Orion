use std::time::Instant;
use reqwest::{Client, Method, header::{HeaderMap, HeaderName, HeaderValue}};
use std::str::FromStr;
use crate::models::{HttpRequest, HttpResponse, AuthConfig, ApiKeyLocation};

pub async fn execute_request(req: HttpRequest) -> Result<HttpResponse, String> {
    let client = Client::builder()
        .timeout(std::time::Duration::from_millis(
            req.timeout_ms.unwrap_or(30_000),
        ))
        .build()
        .map_err(|e| format!("Error creando cliente HTTP: {}", e))?;

    // Método HTTP
    let method = Method::from_str(&req.method.to_uppercase())
        .map_err(|e| format!("Método inválido '{}': {}", req.method, e))?;

    // Headers base
    let mut headers = HeaderMap::new();
    for (key, value) in &req.headers {
        let header_name = HeaderName::from_str(key)
            .map_err(|e| format!("Header inválido '{}': {}", key, e))?;
        let header_value = HeaderValue::from_str(value)
            .map_err(|e| format!("Valor de header inválido '{}': {}", value, e))?;
        headers.insert(header_name, header_value);
    }

    // URL (puede tener query params de auth tipo ApiKey)
    let mut url = req.url.clone();

    // Autenticación
    if let Some(auth) = &req.auth {
        match auth {
            AuthConfig::Bearer { token } => {
                headers.insert(
                    HeaderName::from_str("Authorization").unwrap(),
                    HeaderValue::from_str(&format!("Bearer {}", token))
                        .map_err(|e| format!("Token Bearer inválido: {}", e))?,
                );
            }
            AuthConfig::Basic { username, password } => {
                use base64::{Engine, engine::general_purpose::STANDARD};
                let encoded = STANDARD.encode(format!("{}:{}", username, password));
                headers.insert(
                    HeaderName::from_str("Authorization").unwrap(),
                    HeaderValue::from_str(&format!("Basic {}", encoded))
                        .map_err(|e| format!("Credenciales Basic inválidas: {}", e))?,
                );
            }
            AuthConfig::ApiKey { key, value, location } => {
                match location {
                    ApiKeyLocation::Header => {
                        let header_name = HeaderName::from_str(key)
                            .map_err(|e| format!("API Key header inválido: {}", e))?;
                        headers.insert(
                            header_name,
                            HeaderValue::from_str(value)
                                .map_err(|e| format!("API Key value inválido: {}", e))?,
                        );
                    }
                    ApiKeyLocation::Query => {
                        let separator = if url.contains('?') { '&' } else { '?' };
                        url = format!("{}{}{}", url, separator, format!("{}={}", key, value));
                    }
                }
            }
            AuthConfig::None => {}
        }
    }

    // Construir request
    let mut request_builder = client.request(method, &url).headers(headers);

    // Body
    if let Some(body) = &req.body {
        // Si no tiene Content-Type definido, asumimos JSON
        let has_content_type = req.headers.keys()
            .any(|k| k.to_lowercase() == "content-type");
        
        if !has_content_type {
            request_builder = request_builder
                .header("Content-Type", "application/json");
        }
        request_builder = request_builder.body(body.clone());
    }

    // Ejecutar y medir tiempo
    let start = Instant::now();
    let response = request_builder
        .send()
        .await
        .map_err(|e| format!("Error enviando request: {}", e))?;
    let duration_ms = start.elapsed().as_millis() as u64;

    // Procesar respuesta
    let status = response.status().as_u16();

    let mut response_headers = std::collections::HashMap::new();
    for (key, value) in response.headers() {
        response_headers.insert(
            key.to_string(),
            value.to_str().unwrap_or("").to_string(),
        );
    }

    let body_bytes = response
        .bytes()
        .await
        .map_err(|e| format!("Error leyendo respuesta: {}", e))?;

    let size_bytes = body_bytes.len();
    let body = String::from_utf8_lossy(&body_bytes).to_string();

    Ok(HttpResponse {
        status,
        headers: response_headers,
        body,
        duration_ms,
        size_bytes,
    })
}