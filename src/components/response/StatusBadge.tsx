interface Props {
  status: number;
}

export function StatusBadge({ status }: Props) {
  const color =
    status >= 500 ? "bg-red-500/15 text-red-400 ring-red-500/30" :
    status >= 400 ? "bg-orange-500/15 text-orange-400 ring-orange-500/30" :
    status >= 300 ? "bg-yellow-500/15 text-yellow-400 ring-yellow-500/30" :
    status >= 200 ? "bg-emerald-500/15 text-emerald-400 ring-emerald-500/30" :
                    "bg-zinc-500/15 text-zinc-400 ring-zinc-500/30";

  const label =
    status >= 500 ? "Server Error" :
    status >= 400 ? "Client Error" :
    status >= 300 ? "Redirect" :
    status >= 200 ? "Success" : "Info";

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono font-semibold ring-1 ${color}`}>
      <span className="relative flex h-1.5 w-1.5">
        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${status >= 200 && status < 300 ? "bg-emerald-400" : "bg-current"}`} />
        <span className={`relative inline-flex rounded-full h-1.5 w-1.5 bg-current`} />
      </span>
      {status} {label}
    </span>
  );
}