import { create } from "zustand";
import { HttpRequest, HttpResponse, HttpMethod } from "../types/http.types";
import { httpService } from "../services/httpService";

interface RequestStore {
  // Estado del request activo
  method: HttpMethod;
  url: string;
  headers: { key: string; value: string; enabled: boolean }[];
  body: string;
  activeTab: "headers" | "body" | "auth";

  // Estado de la respuesta
  response: HttpResponse | null;
  isLoading: boolean;
  error: string | null;

  // Acciones
  setMethod: (method: HttpMethod) => void;
  setUrl: (url: string) => void;
  setBody: (body: string) => void;
  setActiveTab: (tab: "headers" | "body" | "auth") => void;
  addHeader: () => void;
  updateHeader: (index: number, field: "key" | "value" | "enabled", value: string | boolean) => void;
  removeHeader: (index: number) => void;
  sendRequest: () => Promise<void>;
  clearResponse: () => void;
}

export const useRequestStore = create<RequestStore>((set, get) => ({
  method: "GET",
  url: "",
  headers: [{ key: "", value: "", enabled: true }],
  body: "",
  activeTab: "headers",
  response: null,
  isLoading: false,
  error: null,

  setMethod: (method) => set({ method }),
  setUrl: (url) => set({ url }),
  setBody: (body) => set({ body }),
  setActiveTab: (tab) => set({ activeTab: tab }),

  addHeader: () =>
    set((state) => ({
      headers: [...state.headers, { key: "", value: "", enabled: true }],
    })),

  updateHeader: (index, field, value) =>
    set((state) => ({
      headers: state.headers.map((h, i) =>
        i === index ? { ...h, [field]: value } : h
      ),
    })),

  removeHeader: (index) =>
    set((state) => ({
      headers: state.headers.filter((_, i) => i !== index),
    })),

  sendRequest: async () => {
    const { method, url, headers, body } = get();
    if (!url.trim()) return;

    set({ isLoading: true, error: null, response: null });

    // Convertir headers al formato del backend
    const headersMap: Record<string, string> = {};
    headers
      .filter((h) => h.enabled && h.key.trim())
      .forEach((h) => { headersMap[h.key] = h.value; });

    const request: HttpRequest = {
      method,
      url,
      headers: headersMap,
      body: body.trim() || undefined,
    };

    try {
      const response = await httpService.sendRequest(request);
      set({ response, isLoading: false });
    } catch (err) {
      set({ error: String(err), isLoading: false });
    }
  },

  clearResponse: () => set({ response: null, error: null }),
}));