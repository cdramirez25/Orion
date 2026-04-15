import { create } from "zustand";
import { Collection, SavedRequest, HttpRequest } from "../types/http.types";
import { httpService } from "../services/httpService";

interface SaveRequestParams {
  collectionId: string;
  name: string;
  request: HttpRequest;
  folderId?: string;
}

interface CollectionStore {
  collections: Collection[];
  activeRequestId: string | null;
  expandedCollections: Set<string>;
  expandedFolders: Set<string>;
  isLoading: boolean;

  loadCollections: () => Promise<void>;
  createCollection: (name: string) => Promise<void>;
  deleteCollection: (id: string) => Promise<void>;
  toggleCollection: (id: string) => void;
  toggleFolder: (id: string) => void;
  setActiveRequestId: (id: string | null) => void;
  getActiveRequest: () => SavedRequest | null;
  saveRequestToCollection: (params: SaveRequestParams) => Promise<void>;
  removeRequest: (requestId: string, collectionId: string) => Promise<void>;
  renameCollection: (id: string, name: string) => Promise<void>;
}

export const useCollectionStore = create<CollectionStore>((set, get) => ({
  collections: [],
  activeRequestId: null,
  expandedCollections: new Set(),
  expandedFolders: new Set(),
  isLoading: false,

  loadCollections: async () => {
    set({ isLoading: true });
    try {
      const collections = await httpService.getCollections();
      set({ collections, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  createCollection: async (name: string) => {
    const collection: Collection = {
      id: crypto.randomUUID(),
      name,
      folders: [],
      requests: [],
    };
    try {
      await httpService.saveCollection(collection);
      set((state) => ({
        collections: [...state.collections, collection],
        expandedCollections: new Set([...state.expandedCollections, collection.id]),
      }));
    } catch (err) {
      console.error("Failed to create collection:", err);
    }
  },

  deleteCollection: async (id: string) => {
    try {
      await httpService.deleteCollection(id);
      set((state) => {
        const deleted = state.collections.find((c) => c.id === id);
        const deletedRequestIds = new Set([
          ...(deleted?.requests.map((r) => r.id) ?? []),
          ...(deleted?.folders.flatMap((f) => f.requests.map((r) => r.id)) ?? []),
        ]);
        return {
          collections: state.collections.filter((c) => c.id !== id),
          activeRequestId: deletedRequestIds.has(state.activeRequestId ?? "")
            ? null
            : state.activeRequestId,
        };
      });
    } catch (err) {
      console.error("Failed to delete collection:", err);
    }
  },

  toggleCollection: (id: string) =>
    set((state) => {
      const next = new Set(state.expandedCollections);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return { expandedCollections: next };
    }),

  toggleFolder: (id: string) =>
    set((state) => {
      const next = new Set(state.expandedFolders);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return { expandedFolders: next };
    }),

  setActiveRequestId: (id) => set({ activeRequestId: id }),

  getActiveRequest: () => {
    const { collections, activeRequestId } = get();
    if (!activeRequestId) return null;
    for (const col of collections) {
      const req = col.requests.find((r) => r.id === activeRequestId);
      if (req) return req;
      for (const folder of col.folders) {
        const r = folder.requests.find((r) => r.id === activeRequestId);
        if (r) return r;
      }
    }
    return null;
  },

  saveRequestToCollection: async ({ collectionId, name, request, folderId }) => {
    const savedRequest: SavedRequest = {
      id: crypto.randomUUID(),
      name,
      request,
      collection_id: collectionId,
      folder_id: folderId,
    };
    try {
      await httpService.saveRequest(savedRequest);
      set((state) => ({
        collections: state.collections.map((col) => {
          if (col.id !== collectionId) return col;
          if (folderId) {
            return {
              ...col,
              folders: col.folders.map((f) =>
                f.id === folderId ? { ...f, requests: [...f.requests, savedRequest] } : f
              ),
            };
          }
          return { ...col, requests: [...col.requests, savedRequest] };
        }),
      }));
    } catch (err) {
      console.error("Failed to save request:", err);
    }
  },

  renameCollection: async (id: string, name: string) => {
    const collection = get().collections.find((c) => c.id === id);
    if (!collection) return;
    const updated = { ...collection, name };
    try {
      await httpService.saveCollection(updated);
      set((state) => ({
        collections: state.collections.map((c) => (c.id === id ? updated : c)),
      }));
    } catch (err) {
      console.error("Failed to rename collection:", err);
    }
  },

  removeRequest: async (requestId: string, collectionId: string) => {
    try {
      await httpService.deleteRequest(requestId);
      set((state) => ({
        collections: state.collections.map((col) => {
          if (col.id !== collectionId) return col;
          return {
            ...col,
            requests: col.requests.filter((r) => r.id !== requestId),
            folders: col.folders.map((f) => ({
              ...f,
              requests: f.requests.filter((r) => r.id !== requestId),
            })),
          };
        }),
        activeRequestId:
          state.activeRequestId === requestId ? null : state.activeRequestId,
      }));
    } catch (err) {
      console.error("Failed to delete request:", err);
    }
  },
}));
