import { useState, useRef, useCallback } from "react";
import { MethodSelector } from "../components/request/MethodSelector";
import { HeadersEditor } from "../components/request/HeadersEditor";
import { BodyEditor } from "../components/request/BodyEditor";
import { ResponseViewer } from "../components/response/ResponseViewer";
import { useRequestStore } from "../store/requestStore";
import { Send, Loader2 } from "lucide-react";

type RequestTab = "headers" | "body";

export function RequestPage() {
  const { method, url, isLoading, response, error, setMethod, setUrl, sendRequest } = useRequestStore();
  const [requestTab, setRequestTab] = useState<RequestTab>("headers");
  const [requestHeight, setRequestHeight] = useState(42);
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

      {/* URL Bar */}
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
        <button
          onClick={handleSend}
          disabled={isLoading || !url.trim()}
          className="flex items-center gap-2 px-4 py-1.5 rounded bg-violet-600 hover:bg-violet-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white text-sm font-medium transition-colors shrink-0"
        >
          {isLoading ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
          Send
        </button>
      </div>

      {/* Resizable panels */}
      <div ref={containerRef} className="flex-1 flex flex-col min-h-0 overflow-hidden">

        {/* Request Panel */}
        <div
          className="flex flex-col border-b border-zinc-800 min-h-0 overflow-hidden"
          style={{ height: `${requestHeight}%` }}
        >
          <div className="flex px-3 border-b border-zinc-800 bg-zinc-900 shrink-0">
            {(["headers", "body"] as RequestTab[]).map((tab) => (
              <button key={tab} onClick={() => setRequestTab(tab)}
                className={`px-3 py-2 text-xs font-medium capitalize transition-colors border-b-2 -mb-px ${
                  requestTab === tab
                    ? "border-violet-500 text-violet-400"
                    : "border-transparent text-zinc-500 hover:text-zinc-300"
                }`}>
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

        {/* Response Panel */}
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