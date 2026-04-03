import { HttpMethod } from "../../types/http.types";

interface Props {
  value: HttpMethod;
  onChange: (method: HttpMethod) => void;
}

const METHODS: HttpMethod[] = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"];

const METHOD_COLORS: Record<HttpMethod, string> = {
  GET:     "text-emerald-400",
  POST:    "text-blue-400",
  PUT:     "text-yellow-400",
  PATCH:   "text-orange-400",
  DELETE:  "text-red-400",
  HEAD:    "text-violet-400",
  OPTIONS: "text-zinc-400",
};

export function MethodSelector({ value, onChange }: Props) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as HttpMethod)}
      className={`bg-transparent px-3 py-1.5 text-xs font-mono font-bold focus:outline-none cursor-pointer ${METHOD_COLORS[value]}`}
      style={{ minWidth: "80px" }}
    >
      {METHODS.map((m) => (
        <option key={m} value={m} className="bg-zinc-900 text-zinc-200">
          {m}
        </option>
      ))}
    </select>
  );
}