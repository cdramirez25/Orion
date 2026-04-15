import { useState, useRef, useCallback } from "react";
import { MethodSelector } from "../components/request/MethodSelector";
import { HeadersEditor } from "../components/request/HeadersEditor";
import { BodyEditor } from "../components/request/BodyEditor";
import { ResponseViewer } from "../components/response/ResponseViewer";
import { useRequestStore } from "../store/requestStore";
import { useCollectionStore } from "../store/collectionStore";
import { Send, Loader2, BookmarkPlus, Check, X } from "lucide-react";

type RequestTab = "headers" | "body";

// ── Save-to-collection form ───────────────────────────────────────────────

function SaveForm({ onClose }: { onClose: () => void }) {
  const { collections, saveRequestToCollection } = useCollectionStore();
  const { method, url, headers, body } = useRequestStore();

  const defaultName = (() => {
    if (!url) return "New Request";
    try {
      return `${method} ${new URL(url).pathname}`;
    } catch {
      return `${method} ${url}`;
    }
  })();

  const [name, setName] = useState(defaultName);
  const [collectionId, setCollectionId] = useState(collections[0]?.id ?? "");
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  const handleSave = async () => {
    if (!name.trim() || !collectionId) return;
    setSaving(true);

    const headersMap: Record<string, string> = {};
    headers
      .filter((h) => h.enabled && h.key.trim())
      .forEach((h) => { headersMap[h.key] = h.value; });

    await saveRequestToCollection({
      collectionId,
      name: name.trim(),
      request: { method, url, headers: headersMap, body: body.trim() || undefined },
    });

    setDone(true);
    setTimeout(onClose, 700);
  };

  if (collections.length === 0) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 border-b border-zinc-800 bg-zinc-900 shrink-0">
        <span className="text-xs text-zinc-500 flex-1">
          Create a collection in the sidebar first.
        </span>
        <button onClick={onClose} className="text-zinc-600 hover:text-zinc-400">
          <X size={13} />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 px-3 py-2 border-b border-zinc-800 bg-zinc-900 shrink-0">
      <input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") handleSave();
          if (e.key === "Escape") onClose();
        }}
        placeholder="Request name"
        className="flex-1 min-w-0 bg-zinc-800 border border-zinc-700 focus:border-violet-500 text-zinc-200 text-xs px-2 py-1.5 rounded transition-colors focus:outline-none"
      />
      <select
        value={collectionId}
        onChange={(e) => setCollectionId(e.target.value)}
        className="bg-zinc-800 border border-zinc-700 focus:border-violet-500 text-zinc-400 text-xs px-2 py-1.5 rounded transition-colors focus:outline-none shrink-0 max-w-[140px]"
      >
        {collections.map((c) => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>
      <button
        onClick={handleSave}
        disabled={saving || !name.trim() || !collectionId}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors shrink-0 ${
          done
            ? "bg-emerald-800 text-emerald-300"
            : "bg-violet-600 hover:bg-violet-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white"
        }`}
      >
        {done ? (
          <><Check size={12} /> Saved</>
        ) : saving ? (
          <><Loader2 size={12} className="animate-spin" /> Saving…</>
        ) : (
          "Save"
        )}
      </button>
      <button onClick={onClose} className="text-zinc-600 hover:text-zinc-400 transition-colors shrink-0">
        <X size={13} />
      </button>
    </div>
  );
}

// ── RequestPage ────────────────────────────────────────────────────────────

export function RequestPage() {
  const { method, url, isLoading, response, error, setMethod, setUrl, sendRequest } =
    useRequestStore();

  const [requestTab, setRequestTab] = useState<RequestTab>("headers");
  const [requestHeight, setRequestHeight] = useState(42);
  const [showSave, setShowSave] = useState(false);
  const isDragging = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleSend = () => { if (url.trim()) sendRequest(); };
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSend();
  };

  const onMouseDown = useCallback(() => {
    isDragging.current = true;
    document.body.style.cursor = "row-resize";
    document.body.style.userSelect = "none";

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const percent = ((e.clientY - rect.top) / rect.height) * 100;
      setRequestHeight(Math.min(75, Math.max(20, percent)));
    };

    const onMouseUp = () => {
      isDragging.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  }, []);

  return (
    <div className="flex-1 flex flex-col min-w-0 min-h-0">

      {/* ── URL bar ── */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-zinc-800 bg-zinc-900 shrink-0">
        <div className="flex-1 flex items-center rounded border border-zinc-700 bg-zinc-950 overflow-hidden focus-within:border-violet-500 transition-colors">
          <MethodSelector value={method} onChange={setMethod} />
          <div className="w-px h-4 bg-zinc-700" />
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter URL or paste text"
            className="flex-1 bg-transparent px-3 py-1.5 text-sm font-mono text-zinc-200 placeholder:text-zinc-600 focus:outline-none"
          />
        </div>

        {/* Save to collection */}
        <button
          title="Save to collection"
          onClick={() => setShowSave((s) => !s)}
          className={`flex items-center justify-center w-8 h-[30px] rounded border transition-colors shrink-0 ${
            showSave
              ? "border-violet-500 text-violet-400 bg-violet-500/10"
              : "border-zinc-700 text-zinc-500 hover:border-zinc-600 hover:text-zinc-200"
          }`}
        >
          <BookmarkPlus size={14} />
        </button>

        {/* Send */}
        <button
          onClick={handleSend}
          disabled={isLoading || !url.trim()}
          className="flex items-center gap-2 px-4 py-1.5 rounded bg-violet-600 hover:bg-violet-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white text-sm font-medium transition-colors shrink-0"
        >
          {isLoading ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
          Send
        </button>
      </div>

      {/* ── Save form (slides in below URL bar) ── */}
      {showSave && <SaveForm onClose={() => setShowSave(false)} />}

      {/* ── Resizable panels ── */}
      <div ref={containerRef} className="flex-1 flex flex-col min-h-0 overflow-hidden">

        {/* Request panel */}
        <div
          className="flex flex-col border-b border-zinc-800 min-h-0 overflow-hidden"
          style={{ height: `${requestHeight}%` }}
        >
          <div className="flex px-3 border-b border-zinc-800 bg-zinc-900 shrink-0">
            {(["headers", "body"] as RequestTab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setRequestTab(tab)}
                className={`px-3 py-2 text-xs font-medium capitalize transition-colors border-b-2 -mb-px ${
                  requestTab === tab
                    ? "border-violet-500 text-violet-400"
                    : "border-transparent text-zinc-500 hover:text-zinc-300"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
          <div className="flex-1 overflow-hidden bg-zinc-950">
            {requestTab === "headers" ? <HeadersEditor /> : <BodyEditor />}
          </div>
        </div>

        {/* Drag handle */}
        <div
          onMouseDown={onMouseDown}
          className="h-1 shrink-0 bg-zinc-800 hover:bg-violet-500 cursor-row-resize transition-colors group relative"
        >
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-center">
            <div className="w-8 h-0.5 rounded-full bg-zinc-600 group-hover:bg-violet-400 transition-colors" />
          </div>
        </div>

        {/* Response panel */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-zinc-950">
          {!response && !error && !isLoading && (
            <div className="flex flex-col items-center justify-center h-full gap-2 select-none">
              <Send size={24} className="text-zinc-700" strokeWidth={1.5} />
              <p className="text-zinc-600 text-sm">Send a request to see the response</p>
            </div>
          )}
          {isLoading && (
            <div className="flex items-center justify-center h-full gap-2">
              <Loader2 size={15} className="animate-spin text-violet-500" />
              <span className="text-sm text-zinc-500">Sending...</span>
            </div>
          )}
          {error && (
            <div className="m-4 p-3 rounded border border-red-900 bg-red-950/30">
              <p className="text-red-400 text-xs font-semibold mb-1">Request Failed</p>
              <p className="text-red-300/60 text-xs font-mono">{error}</p>
            </div>
          )}
          {response && <ResponseViewer response={response} />}
        </div>
      </div>
    </div>
  );
}
