import { useState } from "react";
import { RequestPage } from "./pages/RequestPage";
import { CollectionSidebar } from "./components/sidebar/CollectionSidebar";
import { useRequestStore } from "./store/requestStore";
import { Zap, FolderOpen, History, Settings } from "lucide-react";

type Panel = "collections" | "history" | "settings";

const NAV_PANELS = [
  { id: "collections" as Panel, icon: FolderOpen, label: "Collections" },
  { id: "history"     as Panel, icon: History,    label: "History" },
] as const;

export default function App() {
  const [activePanel, setActivePanel] = useState<Panel>("collections");
  const [panelOpen, setPanelOpen] = useState(true);
  const clearRequest = useRequestStore((s) => s.clearRequest);

  const handleNavClick = (panel: Panel) => {
    if (panel === activePanel) {
      setPanelOpen((open) => !open);
    } else {
      setActivePanel(panel);
      setPanelOpen(true);
    }
  };

  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-200 overflow-hidden text-sm">

      {/* ── Icon nav (48px) ── */}
      <aside className="w-12 shrink-0 flex flex-col items-center py-3 gap-1 bg-zinc-900 border-r border-zinc-800 z-10">

        {/* New Request */}
        <button
          title="New Request"
          onClick={clearRequest}
          className="w-7 h-7 rounded flex items-center justify-center mb-4 bg-zinc-700 hover:bg-violet-600 transition-colors"
        >
          <Zap size={14} className="text-white" />
        </button>

        {NAV_PANELS.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            title={label}
            onClick={() => handleNavClick(id)}
            className={`w-8 h-8 flex items-center justify-center rounded transition-colors ${
              activePanel === id && panelOpen
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
          onClick={() => handleNavClick("settings")}
          className={`w-8 h-8 flex items-center justify-center rounded transition-colors ${
            activePanel === "settings" && panelOpen
              ? "bg-zinc-700 text-violet-400"
              : "text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800"
          }`}
        >
          <Settings size={16} />
        </button>
      </aside>

      {/* ── Left panel (260px, collapsible) ── */}
      {panelOpen && (
        <aside className="w-[260px] shrink-0 flex flex-col border-r border-zinc-800 bg-zinc-900 overflow-hidden">
          {activePanel === "collections" && <CollectionSidebar />}

          {activePanel === "history" && (
            <div className="flex flex-col h-full">
              <div className="flex items-center px-3 h-9 border-b border-zinc-800 shrink-0">
                <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest">
                  History
                </span>
              </div>
              <div className="flex-1 flex items-center justify-center">
                <p className="text-xs text-zinc-700">Coming soon</p>
              </div>
            </div>
          )}

          {activePanel === "settings" && (
            <div className="flex flex-col h-full">
              <div className="flex items-center px-3 h-9 border-b border-zinc-800 shrink-0">
                <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest">
                  Settings
                </span>
              </div>
              <div className="flex-1 flex items-center justify-center">
                <p className="text-xs text-zinc-700">Coming soon</p>
              </div>
            </div>
          )}
        </aside>
      )}

      {/* ── Request editor (always visible) ── */}
      <main className="flex-1 flex min-w-0 min-h-0 overflow-hidden">
        <RequestPage />
      </main>
    </div>
  );
}
