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
    <div className="flex h-screen bg-zinc-950 text-zinc-100 overflow-hidden font-sans">

      {/* Sidebar */}
      <aside className="w-14 shrink-0 flex flex-col items-center py-3 gap-2 bg-zinc-900 border-r border-zinc-800">
        <div className="w-8 h-8 rounded-lg bg-sky-500 flex items-center justify-center mb-3 shadow-lg shadow-sky-500/20">
          <Zap size={15} className="text-white" />
        </div>
        {[
          { icon: FolderOpen, label: "Collections" },
          { icon: History, label: "History" },
        ].map(({ icon: Icon, label }) => (
          <button key={label} title={label}
            className="w-9 h-9 flex items-center justify-center rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-all duration-150">
            <Icon size={17} />
          </button>
        ))}
        <div className="flex-1" />
        <button title="Settings"
          className="w-9 h-9 flex items-center justify-center rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-all duration-150">
          <Settings size={17} />
        </button>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col min-w-0">

        {/* URL Bar */}
        <div className="flex items-center gap-2 px-3 py-2.5 border-b border-zinc-800 bg-zinc-900">
          <div className="flex-1 flex items-center rounded-lg border border-zinc-700 bg-zinc-800 overflow-hidden focus-within:border-sky-500/50 focus-within:ring-1 focus-within:ring-sky-500/20 transition-all">
            <MethodSelector value={method} onChange={setMethod} />
            <div className="w-px h-5 bg-zinc-700" />
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="https://api.example.com/endpoint"
              className="flex-1 bg-transparent px-3 py-2 text-sm font-mono text-zinc-200 placeholder:text-zinc-600 focus:outline-none"
            />
          </div>
          <button
            onClick={handleSend}
            disabled={isLoading || !url.trim()}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 active:bg-sky-600 disabled:bg-zinc-800 disabled:text-zinc-600 text-white text-sm font-semibold transition-all duration-150 shadow-md shadow-sky-500/20 disabled:shadow-none shrink-0"
          >
            {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            {isLoading ? "Sending..." : "Send"}
          </button>
        </div>

        {/* Request Panel */}
        <div className="flex flex-col border-b border-zinc-800" style={{ height: "45%" }}>
          <div className="flex gap-0 px-3 border-b border-zinc-800 bg-zinc-900/40">
            {(["headers", "body"] as RequestTab[]).map((tab) => (
              <button key={tab} onClick={() => setRequestTab(tab)}
                className={`px-4 py-2.5 text-xs font-semibold uppercase tracking-wider transition-all border-b-2 -mb-px ${
                  requestTab === tab
                    ? "border-sky-500 text-sky-400"
                    : "border-transparent text-zinc-500 hover:text-zinc-300"
                }`}>
                {tab}
              </button>
            ))}
          </div>
          <div className="flex-1 overflow-hidden">
            {requestTab === "headers" ? <HeadersEditor /> : <BodyEditor />}
          </div>
        </div>

        {/* Response Panel */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {!response && !error && !isLoading && (
            <div className="flex flex-col items-center justify-center h-full gap-3 select-none">
              <div className="w-12 h-12 rounded-2xl bg-zinc-800/60 flex items-center justify-center">
                <Send size={20} className="text-zinc-600" strokeWidth={1.5} />
              </div>
              <p className="text-sm text-zinc-500">Send a request to see the response</p>
            </div>
          )}
          {isLoading && (
            <div className="flex items-center justify-center h-full gap-3 text-zinc-500">
              <Loader2 size={16} className="animate-spin text-sky-500" />
              <span className="text-sm">Sending request...</span>
            </div>
          )}
          {error && (
            <div className="m-4 p-4 rounded-xl bg-red-950/40 border border-red-500/20">
              <p className="text-red-400 text-xs font-semibold uppercase tracking-wider mb-1.5">Request Failed</p>
              <p className="text-red-300/70 text-xs font-mono leading-relaxed">{error}</p>
            </div>
          )}
          {response && <ResponseViewer response={response} />}
        </div>
      </main>
    </div>
  );
}