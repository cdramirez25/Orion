export type HttpMethod = 
  | "GET" | "POST" | "PUT" | "DELETE" 
  | "PATCH" | "HEAD" | "OPTIONS";

export type ApiKeyLocation = "header" | "query";

export type AuthConfig =
  | { type: "bearer"; token: string }
  | { type: "basic"; username: string; password: string }
  | { type: "api_key"; key: string; value: string; location: ApiKeyLocation }
  | { type: "none" };

export interface HttpRequest {
  method: HttpMethod;
  url: string;
  headers: Record<string, string>;
  body?: string;
  auth?: AuthConfig;
  timeout_ms?: number;
}

export interface HttpResponse {
  status: number;
  headers: Record<string, string>;
  body: string;
  duration_ms: number;
  size_bytes: number;
}

export interface SavedRequest {
  id: string;
  name: string;
  request: HttpRequest;
  collection_id: string;
  folder_id?: string;
}

export interface Collection {
  id: string;
  name: string;
  description?: string;
  folders: Folder[];
  requests: SavedRequest[];
}

export interface Folder {
  id: string;
  name: string;
  requests: SavedRequest[];
}

export interface HistoryEntry {
  id: string;
  request: HttpRequest;
  response: HttpResponse;
  timestamp: string;
  collection_id?: string;
}

export interface Environment {
  id: string;
  name: string;
  variables: Record<string, string>;
  is_active: boolean;
}