import { useState, useRef } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useRequestStore } from "../../store/requestStore";

const COMMON_HEADERS = [
  "Accept",
  "Accept-Encoding",
  "Accept-Language",
  "Authorization",
  "Cache-Control",
  "Content-Type",
  "Cookie",
  "Origin",
  "Referer",
  "User-Agent",
  "X-Api-Key",
  "X-Auth-Token",
  "X-Requested-With",
  "X-Request-ID",
  "X-Forwarded-For",
  "X-Custom-Header",
];

const COMMON_VALUES: Record<string, string[]> = {
  "Content-Type": [
    "application/json",
    "application/x-www-form-urlencoded",
    "multipart/form-data",
    "text/plain",
    "text/html",
    "application/xml",
  ],
  Accept: [
    "application/json",
    "text/html",
    "text/plain",
    "*/*",
    "application/xml",
  ],
  "Cache-Control": ["no-cache", "no-store", "max-age=0", "must-revalidate"],
  Authorization: ["Bearer ", "Basic ", "Token ", "ApiKey "],
};

interface SuggestionsProps {
  items: string[];
  onSelect: (val: string) => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
}

function Suggestions({ items, onSelect, inputRef }: SuggestionsProps) {
  if (items.length === 0) return null;
  return (
    <div className="absolute z-50 top-full left-0 mt-0.5 w-64 bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl overflow-hidden">
      {items.map((item) => (
        <button
          key={item}
          onMouseDown={(e) => {
            e.preventDefault();
            onSelect(item);
            inputRef.current?.blur();
          }}
          className="w-full text-left px-3 py-1.5 text-xs font-mono text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors"
        >
          {item}
        </button>
      ))}
    </div>
  );
}

interface HeaderRowProps {
  header: { key: string; value: string; enabled: boolean };
  index: number;
  onUpdate: (index: number, field: "key" | "value" | "enabled", value: string | boolean) => void;
  onRemove: (index: number) => void;
}

function HeaderRow({ header, index, onUpdate, onRemove }: HeaderRowProps) {
  const [keyFocused, setKeyFocused] = useState(false);
  const [valueFocused, setValueFocused] = useState(false);
  const keyRef = useRef<HTMLInputElement>(null);
  const valueRef = useRef<HTMLInputElement>(null);

  const keySuggestions = keyFocused
    ? COMMON_HEADERS.filter((h) =>
        h.toLowerCase().includes(header.key.toLowerCase()) && h !== header.key
      )
    : [];

  const valueSuggestions =
    valueFocused && COMMON_VALUES[header.key]
      ? COMMON_VALUES[header.key].filter((v) =>
          v.toLowerCase().includes(header.value.toLowerCase())
        )
      : [];

  return (
    <div
      className={`grid grid-cols-[20px_1fr_1fr_28px] gap-x-3 items-center px-4 py-1.5 group hover:bg-zinc-800/30 transition-colors ${
        !header.enabled ? "opacity-40" : ""
      }`}
    >
      <input
        type="checkbox"
        checked={header.enabled}
        onChange={(e) => onUpdate(index, "enabled", e.target.checked)}
        className="w-3.5 h-3.5 rounded accent-sky-500 cursor-pointer"
      />

      {/* Key */}
      <div className="relative">
        <input
          ref={keyRef}
          type="text"
          value={header.key}
          onChange={(e) => onUpdate(index, "key", e.target.value)}
          onFocus={() => setKeyFocused(true)}
          onBlur={() => setTimeout(() => setKeyFocused(false), 150)}
          placeholder="Header name"
          className="bg-transparent border-b border-transparent hover:border-zinc-700 focus:border-sky-500/60 py-1 text-xs font-mono text-zinc-300 placeholder:text-zinc-700 focus:outline-none w-full transition-colors"
        />
        <Suggestions
          items={keySuggestions}
          onSelect={(val) => onUpdate(index, "key", val)}
          inputRef={keyRef}
        />
      </div>

      {/* Value */}
      <div className="relative">
        <input
          ref={valueRef}
          type="text"
          value={header.value}
          onChange={(e) => onUpdate(index, "value", e.target.value)}
          onFocus={() => setValueFocused(true)}
          onBlur={() => setTimeout(() => setValueFocused(false), 150)}
          placeholder="Value"
          className="bg-transparent border-b border-transparent hover:border-zinc-700 focus:border-sky-500/60 py-1 text-xs font-mono text-zinc-400 placeholder:text-zinc-700 focus:outline-none w-full transition-colors"
        />
        <Suggestions
          items={valueSuggestions}
          onSelect={(val) => onUpdate(index, "value", val)}
          inputRef={valueRef}
        />
      </div>

      <button
        onClick={() => onRemove(index)}
        className="opacity-0 group-hover:opacity-100 p-1 text-zinc-600 hover:text-red-400 transition-all"
      >
        <Trash2 size={12} />
      </button>
    </div>
  );
}

export function HeadersEditor() {
  const { headers, addHeader, updateHeader, removeHeader } = useRequestStore();
  const activeCount = headers.filter((h) => h.enabled && h.key.trim()).length;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800/60">
        <span className="text-xs text-zinc-600 font-medium">
          {activeCount} active {activeCount === 1 ? "header" : "headers"}
        </span>
        <button
          onClick={addHeader}
          className="flex items-center gap-1.5 text-xs text-sky-400 hover:text-sky-300 font-medium transition-colors"
        >
          <Plus size={12} strokeWidth={2.5} /> Add Header
        </button>
      </div>

      <div className="grid grid-cols-[20px_1fr_1fr_28px] gap-x-3 px-4 py-1.5 border-b border-zinc-800/40">
        <div />
        <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Key</span>
        <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Value</span>
        <div />
      </div>

      <div className="flex-1 overflow-auto py-1">
        {headers.map((header, index) => (
          <HeaderRow
            key={index}
            header={header}
            index={index}
            onUpdate={updateHeader}
            onRemove={removeHeader}
          />
        ))}
      </div>
    </div>
  );
}