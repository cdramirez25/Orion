import { useState } from "react";
import { HttpResponse } from "../../types/http.types";
import { StatusBadge } from "./StatusBadge";
import { Clock, HardDrive } from "lucide-react";

interface Props { response: HttpResponse; }

function formatBody(body: string, contentType: string): string {
  if (contentType.includes("application/json")) {
    try { return JSON.stringify(JSON.parse(body), null, 2); }
    catch { return body; }
  }
  return body;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ResponseViewer({ response }: Props) {
  const contentType = response.headers["content-type"] || "";
  const isHtml = contentType.includes("text/html");

  const [tab, setTab] = useState<"body" | "headers" | "preview">(
    isHtml ? "preview" : "body"
  );

  const tabs = [
    { id: "body", label: "Body" },
    ...(isHtml ? [{ id: "preview", label: "Preview" }] : []),
    { id: "headers", label: "Headers" },
  ] as { id: "body" | "headers" | "preview"; label: string }[];

  return (
    <div className="flex flex-col h-full">
      {/* Status bar */}
      <div className="flex items-center gap-4 px-4 py-2 border-b border-zinc-800 bg-zinc-900/40 shrink-0">
        <StatusBadge status={response.status} />
        <div className="flex items-center gap-1.5 text-zinc-500 text-xs font-mono">
          <Clock size={11} /> <span>{response.duration_ms}ms</span>
        </div>
        <div className="flex items-center gap-1.5 text-zinc-500 text-xs font-mono">
          <HardDrive size={11} /> <span>{formatSize(response.size_bytes)}</span>
        </div>

        {/* Tabs */}
        <div className="flex gap-0 ml-auto">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-all border-b-2 ${
                tab === t.id
                  ? "border-sky-500 text-sky-400"
                  : "border-transparent text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {/* Body — JSON / texto */}
        {tab === "body" && (
          <pre className="p-4 text-xs font-mono text-zinc-300 leading-relaxed whitespace-pre-wrap break-all">
            {formatBody(response.body, contentType) || (
              <span className="text-zinc-600 italic">Empty response body</span>
            )}
          </pre>
        )}

        {/* Preview — HTML renderizado en iframe */}
        {tab === "preview" && (
          <iframe
            srcDoc={response.body}
            sandbox="allow-same-origin"
            className="w-full h-full border-none bg-white"
            title="Response Preview"
          />
        )}

        {/* Headers */}
        {tab === "headers" && (
          <div className="p-4">
            <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-3">
              {Object.keys(response.headers).length} Headers
            </p>
            <div className="space-y-0.5">
              {Object.entries(response.headers).map(([key, value]) => (
                <div
                  key={key}
                  className="grid grid-cols-2 gap-4 px-2 py-1.5 rounded-lg hover:bg-zinc-800/40 transition-colors"
                >
                  <span className="text-xs font-mono text-sky-400 truncate">{key}</span>
                  <span className="text-xs font-mono text-zinc-400 truncate">{value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}