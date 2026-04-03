import { useState } from "react";
import { MethodSelector } from "./components/request/MethodSelector";
import { HeadersEditor } from "./components/request/HeadersEditor";
import { BodyEditor } from "./components/request/BodyEditor";
import { ResponseViewer } from "./components/response/ResponseViewer";
import { useRequestStore } from "./store/requestStore";
import { Send, Loader2, History, FolderOpen, Settings, Zap } from "lucide-react";

type RequestTab = "headers" | "body";

export default function App() {
  const { method, url, isLoading, response, error, setMethod, setUrl, sendRequest } = useRequestStore();
  const [requestTab, setRequestTab] = useState<RequestTab>("headers");

  const handleSend = () => { if (url.trim()) sendRequest(); };
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSend();
  };

  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-200 overflow-hidden text-sm">

      {/* Sidebar */}
      <aside className="w-12 shrink-0 flex flex-col items-center py-3 gap-1 bg-zinc-900 border-r border-zinc-800">
        <div className="w-7 h-7 rounded bg-violet-600 flex items-center justify-center mb-4">
          <Zap size={14} className="text-white" />
        </div>
        {[
          { icon: FolderOpen, label: "Collections" },
          { icon: History, label: "History" },
        ].map(({ icon: Icon, label }) => (
          <button key={label} title={label}
            className="w-8 h-8 flex items-center justify-center rounded text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-colors">
            <Icon size={16} />
          </button>
        ))}
        <div className="flex-1" />
        <button title="Settings"
          className="w-8 h-8 flex items-center justify-center rounded text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-colors">
          <Settings size={16} />
        </button>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col min-w-0">

        {/* URL Bar */}
        <div className="flex items-center gap-2 px-3 py-2 border-b border-zinc-800 bg-zinc-900">
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

        {/* Request Panel */}
        <div className="flex flex-col border-b border-zinc-800" style={{ height: "42%" }}>
          <div className="flex px-3 border-b border-zinc-800 bg-zinc-900">
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

        {/* Response Panel */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-zinc-950">
          {!response && !error && !isLoading && (
            <div className="flex flex-col items-center justify-center h-full gap-2 select-none">
              <Send size={24} className="text-zinc-700" strokeWidth={1.5} />
              <p className="text-zinc-600 text-sm">Send a request to see the response</p>
            </div>
          )}
          {isLoading && (
            <div className="flex items-center justify-center h-full gap-2 text-zinc-500">
              <Loader2 size={15} className="animate-spin text-violet-500" />
              <span className="text-sm">Sending...</span>
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
      </main>
    </div>
  );
}