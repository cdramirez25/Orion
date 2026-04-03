interface Props { status: number; }

export function StatusBadge({ status }: Props) {
  const color =
    status >= 500 ? "text-red-400 bg-red-950 border-red-900" :
    status >= 400 ? "text-orange-400 bg-orange-950 border-orange-900" :
    status >= 300 ? "text-yellow-400 bg-yellow-950 border-yellow-900" :
    status >= 200 ? "text-emerald-400 bg-emerald-950 border-emerald-900" :
                    "text-zinc-400 bg-zinc-800 border-zinc-700";

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded border text-xs font-mono font-semibold ${color}`}>
      {status}
    </span>
  );
}