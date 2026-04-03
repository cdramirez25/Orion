import { useRequestStore } from "../../store/requestStore";

export function BodyEditor() {
  const { body, setBody, method } = useRequestStore();

  if (["GET", "HEAD", "OPTIONS"].includes(method)) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-sm text-zinc-600">{method} requests don't support a body</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-4 py-2 border-b border-zinc-800/60">
        <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Format</span>
        <span className="text-xs font-mono text-sky-400 bg-sky-400/10 px-2 py-0.5 rounded-md">JSON</span>
      </div>
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder={'{\n  "key": "value"\n}'}
        spellCheck={false}
        className="flex-1 bg-transparent p-4 text-xs font-mono text-zinc-300 placeholder:text-zinc-700 resize-none focus:outline-none leading-relaxed"
      />
    </div>
  );
}