import { useState, useEffect, useRef, useCallback } from "react";
import {
  Plus, ChevronRight, Search, Trash2, X, Check, FolderOpen,
  Folder as FolderIcon, Pencil,
} from "lucide-react";
import { useCollectionStore } from "../../store/collectionStore";
import { useRequestStore } from "../../store/requestStore";
import type { HttpMethod, SavedRequest, Collection, Folder } from "../../types/http.types";

// ── Method badge ──────────────────────────────────────────────────────────

const METHOD_COLOR: Record<HttpMethod, string> = {
  GET:     "text-emerald-400",
  POST:    "text-blue-400",
  PUT:     "text-amber-400",
  DELETE:  "text-red-400",
  PATCH:   "text-violet-400",
  HEAD:    "text-zinc-500",
  OPTIONS: "text-zinc-500",
};
const METHOD_SHORT: Record<HttpMethod, string> = {
  GET: "GET", POST: "POST", PUT: "PUT", DELETE: "DEL",
  PATCH: "PAT", HEAD: "HEAD", OPTIONS: "OPT",
};

function MethodBadge({ method }: { method: HttpMethod }) {
  return (
    <span className={`font-mono text-[10px] font-bold w-[28px] shrink-0 ${METHOD_COLOR[method]}`}>
      {METHOD_SHORT[method]}
    </span>
  );
}

// ── Context menu ──────────────────────────────────────────────────────────

interface ContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  onRename: () => void;
  onDelete: () => void;
}

function ContextMenu({ x, y, onClose, onRename, onDelete }: ContextMenuProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    // Use timeout so the event that triggered the menu doesn't immediately close it
    const id = setTimeout(() => window.addEventListener("mousedown", close), 0);
    return () => { clearTimeout(id); window.removeEventListener("mousedown", close); };
  }, [onClose]);

  // Clamp to viewport
  const safeX = Math.min(x, window.innerWidth - 168);
  const safeY = Math.min(y, window.innerHeight - 90);

  return (
    <div
      ref={ref}
      style={{ left: safeX, top: safeY }}
      className="fixed z-50 min-w-[152px] py-1 rounded-md bg-zinc-800 border border-zinc-700 shadow-xl shadow-black/50"
    >
      <button
        className="w-full flex items-center gap-2 px-3 py-[7px] text-xs text-zinc-300 hover:bg-zinc-700 transition-colors"
        onMouseDown={(e) => { e.stopPropagation(); onRename(); onClose(); }}
      >
        <Pencil size={12} className="text-zinc-500" />
        Rename
      </button>
      <div className="mx-2 border-t border-zinc-700/60" />
      <button
        className="w-full flex items-center gap-2 px-3 py-[7px] text-xs text-red-400 hover:bg-zinc-700 transition-colors"
        onMouseDown={(e) => { e.stopPropagation(); onDelete(); onClose(); }}
      >
        <Trash2 size={12} />
        Delete
      </button>
    </div>
  );
}

// ── Add-request inline form ───────────────────────────────────────────────

interface AddRequestFormProps {
  onConfirm: (name: string) => void;
  onCancel: () => void;
}

function AddRequestForm({ onConfirm, onCancel }: AddRequestFormProps) {
  const [name, setName] = useState("");
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => { ref.current?.focus(); }, []);

  const submit = () => {
    const trimmed = name.trim();
    if (trimmed) onConfirm(trimmed);
    else onCancel();
  };

  return (
    <div className="mx-2 mt-0.5 mb-1 flex items-center gap-1 px-2 py-[5px] rounded bg-zinc-800/80 border border-zinc-700/60">
      <input
        ref={ref}
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") submit();
          if (e.key === "Escape") onCancel();
        }}
        placeholder="Request name..."
        className="flex-1 min-w-0 bg-transparent text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none"
      />
      <button onClick={submit} className="text-emerald-500 hover:text-emerald-400 p-0.5 shrink-0">
        <Check size={11} />
      </button>
      <button onClick={onCancel} className="text-zinc-600 hover:text-zinc-400 p-0.5 shrink-0">
        <X size={11} />
      </button>
    </div>
  );
}

// ── RequestItem ───────────────────────────────────────────────────────────

interface RequestItemProps {
  request: SavedRequest;
  isActive: boolean;
  depth?: number;
  onSelect: () => void;
  onDelete: () => void;
}

function RequestItem({ request, isActive, depth = 0, onSelect, onDelete }: RequestItemProps) {
  return (
    <button
      className={`group w-full flex items-center gap-1.5 rounded py-[5px] pr-2 text-left transition-colors ${
        isActive
          ? "bg-zinc-800 text-zinc-100"
          : "text-zinc-500 hover:bg-zinc-800/50 hover:text-zinc-300"
      }`}
      style={{ paddingLeft: `${8 + depth * 14}px` }}
      onClick={onSelect}
    >
      <MethodBadge method={request.request.method} />
      <span className="flex-1 truncate text-xs">{request.name}</span>
      <span
        role="button"
        aria-label="Delete request"
        onClick={(e) => { e.stopPropagation(); onDelete(); }}
        className="opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-red-400 transition-all p-0.5 rounded shrink-0"
      >
        <Trash2 size={11} />
      </span>
    </button>
  );
}

// ── FolderItem ────────────────────────────────────────────────────────────

interface FolderItemProps {
  folder: Folder;
  isExpanded: boolean;
  depth: number;
  activeRequestId: string | null;
  forceExpand: boolean;
  onToggle: () => void;
  onSelectRequest: (req: SavedRequest) => void;
  onDeleteRequest: (reqId: string) => void;
}

function FolderItem({
  folder, isExpanded, depth, activeRequestId, forceExpand,
  onToggle, onSelectRequest, onDeleteRequest,
}: FolderItemProps) {
  const expanded = isExpanded || forceExpand;
  return (
    <div>
      <button
        className="w-full flex items-center gap-1.5 py-[5px] pr-2 rounded text-left hover:bg-zinc-800/40 transition-colors text-zinc-500 hover:text-zinc-300"
        style={{ paddingLeft: `${8 + depth * 14}px` }}
        onClick={onToggle}
      >
        <ChevronRight
          size={11}
          className={`shrink-0 transition-transform duration-150 ${expanded ? "rotate-90" : ""}`}
        />
        {expanded
          ? <FolderOpen size={12} className="shrink-0 text-zinc-500" />
          : <FolderIcon size={12} className="shrink-0 text-zinc-600" />
        }
        <span className="flex-1 truncate text-xs">{folder.name}</span>
        <span className="text-[10px] text-zinc-700 tabular-nums shrink-0">{folder.requests.length}</span>
      </button>
      {expanded && folder.requests.map((req) => (
        <RequestItem
          key={req.id}
          request={req}
          isActive={req.id === activeRequestId}
          depth={depth + 1}
          onSelect={() => onSelectRequest(req)}
          onDelete={() => onDeleteRequest(req.id)}
        />
      ))}
    </div>
  );
}

// ── CollectionItem ────────────────────────────────────────────────────────

interface CollectionItemProps {
  collection: Collection;
  isExpanded: boolean;
  expandedFolders: Set<string>;
  activeRequestId: string | null;
  forceExpand: boolean;
  onToggle: () => void;
  onToggleFolder: (id: string) => void;
  onRename: (id: string, name: string) => void;
  onDelete: () => void;
  onSelectRequest: (req: SavedRequest) => void;
  onDeleteRequest: (reqId: string) => void;
  onAddRequest: (collectionId: string, name: string) => void;
}

function CollectionItem({
  collection, isExpanded, expandedFolders, activeRequestId, forceExpand,
  onToggle, onToggleFolder, onRename, onDelete,
  onSelectRequest, onDeleteRequest, onAddRequest,
}: CollectionItemProps) {
  const expanded = isExpanded || forceExpand;
  const total =
    collection.requests.length +
    collection.folders.reduce((n, f) => n + f.requests.length, 0);

  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(collection.name);
  const [isAddingReq, setIsAddingReq] = useState(false);
  const editRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing) {
      editRef.current?.focus();
      editRef.current?.select();
    }
  }, [isEditing]);

  // Keep editName in sync when collection.name changes externally
  useEffect(() => { setEditName(collection.name); }, [collection.name]);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  const handleSaveRename = () => {
    const name = editName.trim();
    if (name && name !== collection.name) onRename(collection.id, name);
    setIsEditing(false);
  };

  return (
    <div className="mb-px">
      {/* Collection header */}
      <div
        className="group flex items-center gap-1.5 px-2 py-[6px] rounded cursor-pointer hover:bg-zinc-800/40 transition-colors mx-1"
        onClick={isEditing ? undefined : onToggle}
        onContextMenu={handleContextMenu}
      >
        <ChevronRight
          size={12}
          className={`text-zinc-600 shrink-0 transition-transform duration-150 ${expanded ? "rotate-90" : ""}`}
        />
        {expanded
          ? <FolderOpen size={13} className="text-violet-400 shrink-0" />
          : <FolderIcon size={13} className="text-zinc-500 shrink-0" />
        }

        {/* Inline rename input OR collection name */}
        {isEditing ? (
          <input
            ref={editRef}
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onKeyDown={(e) => {
              e.stopPropagation();
              if (e.key === "Enter") handleSaveRename();
              if (e.key === "Escape") { setIsEditing(false); setEditName(collection.name); }
            }}
            onBlur={handleSaveRename}
            onClick={(e) => e.stopPropagation()}
            className="flex-1 min-w-0 bg-zinc-900 border border-violet-500/60 text-zinc-200 text-xs px-1.5 py-0.5 rounded focus:outline-none"
          />
        ) : (
          <span className="flex-1 truncate text-xs font-medium text-zinc-300 select-none">
            {collection.name}
          </span>
        )}

        {/* Hover actions: add-request "+" and request count */}
        {!isEditing && (
          <>
            <button
              title="Add current request to this collection"
              onClick={(e) => { e.stopPropagation(); setIsAddingReq(true); }}
              className="opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-emerald-400 transition-all p-0.5 rounded shrink-0"
            >
              <Plus size={12} />
            </button>
            {total > 0 && (
              <span className="text-[10px] text-zinc-700 tabular-nums group-hover:opacity-0 transition-opacity shrink-0">
                {total}
              </span>
            )}
          </>
        )}
      </div>

      {/* Inline add-request form */}
      {isAddingReq && (
        <AddRequestForm
          onConfirm={(name) => { onAddRequest(collection.id, name); setIsAddingReq(false); }}
          onCancel={() => setIsAddingReq(false)}
        />
      )}

      {/* Children */}
      {expanded && (
        <div className="ml-2">
          {collection.requests.map((req) => (
            <RequestItem
              key={req.id}
              request={req}
              isActive={req.id === activeRequestId}
              depth={1}
              onSelect={() => onSelectRequest(req)}
              onDelete={() => onDeleteRequest(req.id)}
            />
          ))}
          {collection.folders.map((folder) => (
            <FolderItem
              key={folder.id}
              folder={folder}
              isExpanded={expandedFolders.has(folder.id)}
              depth={1}
              activeRequestId={activeRequestId}
              forceExpand={forceExpand}
              onToggle={() => onToggleFolder(folder.id)}
              onSelectRequest={onSelectRequest}
              onDeleteRequest={onDeleteRequest}
            />
          ))}
          {total === 0 && !isAddingReq && (
            <p className="px-4 py-2 text-[10px] text-zinc-700 italic select-none">
              No requests — click + to add one
            </p>
          )}
        </div>
      )}

      {/* Context menu (right-click) */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
          onRename={() => setIsEditing(true)}
          onDelete={onDelete}
        />
      )}
    </div>
  );
}

// ── CollectionSidebar (main export) ──────────────────────────────────────

export function CollectionSidebar() {
  const {
    collections,
    activeRequestId,
    expandedCollections,
    expandedFolders,
    isLoading,
    loadCollections,
    createCollection,
    deleteCollection,
    renameCollection,
    toggleCollection,
    toggleFolder,
    setActiveRequestId,
    removeRequest,
    saveRequestToCollection,
  } = useCollectionStore();

  const loadSavedRequest = useRequestStore((s) => s.loadSavedRequest);

  const [search, setSearch] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const newNameRef = useRef<HTMLInputElement>(null);

  useEffect(() => { loadCollections(); }, []);
  useEffect(() => { if (isCreating) newNameRef.current?.focus(); }, [isCreating]);

  const handleCreate = async () => {
    const name = newName.trim();
    if (name) await createCollection(name);
    setNewName("");
    setIsCreating(false);
  };

  const handleSelectRequest = (req: SavedRequest) => {
    setActiveRequestId(req.id);
    loadSavedRequest(req);
  };

  // Add current editor request to a collection
  const handleAddRequest = useCallback(
    async (collectionId: string, name: string) => {
      const { method, url, headers, body } = useRequestStore.getState();
      const headersMap: Record<string, string> = {};
      headers
        .filter((h) => h.enabled && h.key.trim())
        .forEach((h) => { headersMap[h.key] = h.value; });

      await saveRequestToCollection({
        collectionId,
        name,
        request: { method, url, headers: headersMap, body: body.trim() || undefined },
      });
    },
    [saveRequestToCollection],
  );

  // Search filter
  const q = search.toLowerCase();
  const filtered = search
    ? collections
        .map((col) => ({
          ...col,
          requests: col.requests.filter(
            (r) => r.name.toLowerCase().includes(q) || r.request.url.toLowerCase().includes(q),
          ),
          folders: col.folders
            .map((f) => ({
              ...f,
              requests: f.requests.filter(
                (r) => r.name.toLowerCase().includes(q) || r.request.url.toLowerCase().includes(q),
              ),
            }))
            .filter((f) => f.name.toLowerCase().includes(q) || f.requests.length > 0),
        }))
        .filter(
          (col) =>
            col.name.toLowerCase().includes(q) ||
            col.requests.length > 0 ||
            col.folders.some((f) => f.requests.length > 0),
        )
    : collections;

  return (
    <div className="flex flex-col h-full select-none">

      {/* Header */}
      <div className="flex items-center justify-between px-3 h-9 border-b border-zinc-800 shrink-0">
        <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest">
          Collections
        </span>
        <button
          onClick={() => setIsCreating(true)}
          title="New collection"
          className="text-zinc-600 hover:text-zinc-200 transition-colors p-0.5 rounded hover:bg-zinc-800"
        >
          <Plus size={14} />
        </button>
      </div>

      {/* Search */}
      <div className="px-2 py-2 shrink-0">
        <div className="flex items-center gap-1.5 h-7 px-2 rounded bg-zinc-800/60 border border-zinc-700/40 focus-within:border-violet-500/50 transition-colors">
          <Search size={11} className="text-zinc-600 shrink-0" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search requests..."
            className="flex-1 min-w-0 bg-transparent text-xs text-zinc-300 placeholder:text-zinc-600 focus:outline-none"
          />
          {search && (
            <button onClick={() => setSearch("")} className="text-zinc-600 hover:text-zinc-400 shrink-0">
              <X size={10} />
            </button>
          )}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden pb-2">

        {/* Inline new collection input */}
        {isCreating && (
          <div className="mx-2 mb-1 flex items-center gap-1.5 px-2 py-[6px] rounded bg-zinc-800 border border-violet-500/40">
            <FolderOpen size={13} className="text-violet-400 shrink-0" />
            <input
              ref={newNameRef}
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreate();
                if (e.key === "Escape") { setIsCreating(false); setNewName(""); }
              }}
              placeholder="Collection name..."
              className="flex-1 min-w-0 bg-transparent text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none"
            />
            <button onClick={handleCreate} className="text-emerald-500 hover:text-emerald-400 p-0.5 shrink-0">
              <Check size={12} />
            </button>
            <button
              onClick={() => { setIsCreating(false); setNewName(""); }}
              className="text-zinc-600 hover:text-zinc-400 p-0.5 shrink-0"
            >
              <X size={12} />
            </button>
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <div className="w-4 h-4 border-2 border-zinc-700 border-t-violet-500 rounded-full animate-spin" />
          </div>
        )}

        {/* Empty state */}
        {!isLoading && filtered.length === 0 && !isCreating && (
          <div className="flex flex-col items-center justify-center py-10 px-4 gap-3">
            <FolderOpen size={28} className="text-zinc-800" strokeWidth={1.5} />
            <div className="text-center">
              {search ? (
                <p className="text-xs text-zinc-600">No results for "{search}"</p>
              ) : (
                <>
                  <p className="text-xs text-zinc-600 mb-2">No collections yet</p>
                  <button
                    onClick={() => setIsCreating(true)}
                    className="text-xs text-violet-500 hover:text-violet-400 transition-colors"
                  >
                    + Create collection
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* Collections */}
        {filtered.map((col) => (
          <CollectionItem
            key={col.id}
            collection={col}
            isExpanded={expandedCollections.has(col.id)}
            expandedFolders={expandedFolders}
            activeRequestId={activeRequestId}
            forceExpand={!!search}
            onToggle={() => toggleCollection(col.id)}
            onToggleFolder={toggleFolder}
            onRename={renameCollection}
            onDelete={() => deleteCollection(col.id)}
            onSelectRequest={handleSelectRequest}
            onDeleteRequest={(reqId) => removeRequest(reqId, col.id)}
            onAddRequest={handleAddRequest}
          />
        ))}
      </div>
    </div>
  );
}
