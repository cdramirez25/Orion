import { useState, useRef } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useRequestStore } from "../../store/requestStore";

const COMMON_HEADERS = [
  "Accept", "Accept-Encoding", "Accept-Language", "Authorization",
  "Cache-Control", "Content-Type", "Cookie", "Origin", "Referer",
  "User-Agent", "X-Api-Key", "X-Auth-Token", "X-Requested-With",
  "X-Request-ID", "X-Forwarded-For",
];

const COMMON_VALUES: Record<string, string[]> = {
  "Content-Type": ["application/json", "application/x-www-form-urlencoded", "multipart/form-data", "text/plain", "text/html"],
  "Accept": ["application/json", "text/html", "text/plain", "*/*"],
  "Cache-Control": ["no-cache", "no-store", "max-age=0"],
  "Authorization": ["Bearer ", "Basic ", "Token "],
};

function Suggestions({ items, onSelect }: { items: string[]; onSelect: (v: string) => void }) {
  if (!items.length) return null;
  return (
    <div className="absolute z-50 top-full left-0 mt-0.5 w-56 bg-zinc-800 border border-zinc-700 rounded shadow-lg overflow-hidden">
      {items.map((item) => (
        <button key={item} onMouseDown={(e) => { e.preventDefault(); onSelect(item); }}
          className="w-full text-left px-3 py-1.5 text-xs font-mono text-zinc-300 hover:bg-zinc-700 transition-colors">
          {item}
        </button>
      ))}
    </div>
  );
}

function HeaderRow({ header, index, onUpdate, onRemove }: {
  header: { key: string; value: string; enabled: boolean };
  index: number;
  onUpdate: (i: number, f: "key" | "value" | "enabled", v: string | boolean) => void;
  onRemove: (i: number) => void;
}) {
  const [keyFocused, setKeyFocused] = useState(false);
  const [valueFocused, setValueFocused] = useState(false);

  const keySuggestions = keyFocused
    ? COMMON_HEADERS.filter(h => h.toLowerCase().includes(header.key.toLowerCase()) && h !== header.key)
    : [];

  const valueSuggestions = valueFocused && COMMON_VALUES[header.key]
    ? COMMON_VALUES[header.key].filter(v => v.toLowerCase().includes(header.value.toLowerCase()))
    : [];

  return (
    <div className={`grid grid-cols-[20px_1fr_1fr_24px] gap-x-3 items-center px-3 py-1 group hover:bg-zinc-900 transition-colors ${!header.enabled ? "opacity-40" : ""}`}>
      <input type="checkbox" checked={header.enabled}
        onChange={(e) => onUpdate(index, "enabled", e.target.checked)}
        className="w-3 h-3 accent-violet-500 cursor-pointer" />
      <div className="relative">
        <input type="text" value={header.key}
          onChange={(e) => onUpdate(index, "key", e.target.value)}
          onFocus={() => setKeyFocused(true)}
          onBlur={() => setTimeout(() => setKeyFocused(false), 150)}
          placeholder="Key"
          className="w-full bg-transparent py-1 text-xs font-mono text-zinc-300 placeholder:text-zinc-700 focus:outline-none border-b border-transparent focus:border-zinc-600 transition-colors" />
        <Suggestions items={keySuggestions} onSelect={(v) => onUpdate(index, "key", v)} />
      </div>
      <div className="relative">
        <input type="text" value={header.value}
          onChange={(e) => onUpdate(index, "value", e.target.value)}
          onFocus={() => setValueFocused(true)}
          onBlur={() => setTimeout(() => setValueFocused(false), 150)}
          placeholder="Value"
          className="w-full bg-transparent py-1 text-xs font-mono text-zinc-400 placeholder:text-zinc-700 focus:outline-none border-b border-transparent focus:border-zinc-600 transition-colors" />
        <Suggestions items={valueSuggestions} onSelect={(v) => onUpdate(index, "value", v)} />
      </div>
      <button onClick={() => onRemove(index)}
        className="opacity-0 group-hover:opacity-100 p-1 text-zinc-600 hover:text-red-400 transition-all">
        <Trash2 size={11} />
      </button>
    </div>
  );
}

export function HeadersEditor() {
  const { headers, addHeader, updateHeader, removeHeader } = useRequestStore();
  const active = headers.filter(h => h.enabled && h.key.trim()).length;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-zinc-800">
        <span className="text-[11px] text-zinc-600">{active} active</span>
        <button onClick={addHeader}
          className="flex items-center gap-1 text-[11px] text-violet-400 hover:text-violet-300 transition-colors">
          <Plus size={11} strokeWidth={2.5} /> Add
        </button>
      </div>
      <div className="grid grid-cols-[20px_1fr_1fr_24px] gap-x-3 px-3 py-1 border-b border-zinc-800">
        <div />
        <span className="text-[10px] font-medium text-zinc-600 uppercase tracking-wider">Key</span>
        <span className="text-[10px] font-medium text-zinc-600 uppercase tracking-wider">Value</span>
        <div />
      </div>
      <div className="flex-1 overflow-auto py-0.5">
        {headers.map((h, i) => (
          <HeaderRow key={i} header={h} index={i} onUpdate={updateHeader} onRemove={removeHeader} />
        ))}
      </div>
    </div>
  );
}