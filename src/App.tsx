import { useState } from "react";
import { RequestPage } from "./pages/RequestPage";
import { Zap, FolderOpen, History, Settings } from "lucide-react";

type Page = "request" | "collections" | "history" | "settings";

const NAV_ITEMS = [
  { id: "collections" as Page, icon: FolderOpen, label: "Collections" },
  { id: "history"     as Page, icon: History,    label: "History" },
];

export default function App() {
  const [activePage, setActivePage] = useState<Page>("request");

  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-200 overflow-hidden text-sm">

      {/* Sidebar */}
      <aside className="w-12 shrink-0 flex flex-col items-center py-3 gap-1 bg-zinc-900 border-r border-zinc-800">
        {/* Logo — siempre lleva a request */}
        <button
          onClick={() => setActivePage("request")}
          className={`w-7 h-7 rounded flex items-center justify-center mb-4 transition-colors ${
            activePage === "request" ? "bg-violet-600" : "bg-zinc-700 hover:bg-violet-600"
          }`}
        >
          <Zap size={14} className="text-white" />
        </button>

        {NAV_ITEMS.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            title={label}
            onClick={() => setActivePage(id)}
            className={`w-8 h-8 flex items-center justify-center rounded transition-colors ${
              activePage === id
                ? "bg-zinc-700 text-violet-400"
                : "text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800"
            }`}
          >
            <Icon size={16} />
          </button>
        ))}

        <div className="flex-1" />

        <button
          title="Settings"
          onClick={() => setActivePage("settings")}
          className={`w-8 h-8 flex items-center justify-center rounded transition-colors ${
            activePage === "settings"
              ? "bg-zinc-700 text-violet-400"
              : "text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800"
          }`}
        >
          <Settings size={16} />
        </button>
      </aside>

      {/* Page content */}
      <main className="flex-1 flex min-w-0 min-h-0 overflow-hidden">
        {activePage === "request" && <RequestPage />}

        {activePage === "collections" && (
          <div className="flex-1 flex items-center justify-center text-zinc-700">
            <p>Collections — coming soon</p>
          </div>
        )}

        {activePage === "history" && (
          <div className="flex-1 flex items-center justify-center text-zinc-700">
            <p>History — coming soon</p>
          </div>
        )}

        {activePage === "settings" && (
          <div className="flex-1 flex items-center justify-center text-zinc-700">
            <p>Settings — coming soon</p>
          </div>
        )}
      </main>
    </div>
  );
}