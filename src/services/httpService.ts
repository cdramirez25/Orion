import { invoke } from "@tauri-apps/api/core";
import {
  HttpRequest,
  HttpResponse,
  Collection,
  SavedRequest,
  HistoryEntry,
  Environment,
} from "../types/http.types";

export const httpService = {
  sendRequest: (request: HttpRequest): Promise<HttpResponse> =>
    invoke("send_http_request", { request }),

  // Collections
  getCollections: (): Promise<Collection[]> =>
    invoke("get_collections"),

  saveCollection: (collection: Collection): Promise<void> =>
    invoke("save_collection", { collection }),

  deleteCollection: (id: string): Promise<void> =>
    invoke("delete_collection", { id }),

  // Requests
  saveRequest: (request: SavedRequest): Promise<void> =>
    invoke("save_request", { request }),

  deleteRequest: (id: string): Promise<void> =>
    invoke("delete_request", { id }),

  // History
  getHistory: (limit?: number): Promise<HistoryEntry[]> =>
    invoke("get_history", { limit }),

  clearHistory: (): Promise<void> =>
    invoke("clear_history"),

  // Environments
  getEnvironments: (): Promise<Environment[]> =>
    invoke("get_environments"),

  saveEnvironment: (environment: Environment): Promise<void> =>
    invoke("save_environment", { environment }),

  deleteEnvironment: (id: string): Promise<void> =>
    invoke("delete_environment", { id }),
};