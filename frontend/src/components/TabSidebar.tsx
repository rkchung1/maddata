// src/components/TabSidebar.tsx
import { GitGraph, NotebookPen, Search } from "lucide-react"

interface TabSidebarProps {
    currentTab: "notes" | "graph" | "search",
    setCurrentTab: (tab: "notes" | "graph" | "search") => void
}

export default function TabSidebar({ currentTab, setCurrentTab }: TabSidebarProps) {
    return (
        <div className="w-16 bg-secondary flex flex-col justify-center items-center py-4 gap-4">
            <button
                onClick={() => setCurrentTab("notes")}
                className={`p-2 rounded ${currentTab === "notes" ? "bg-accent" : "hover:bg-muted"
                    }`}
            >
                <NotebookPen className="w-6 h-6" />
            </button>
            
            <button
                onClick={() => setCurrentTab("search")}
                className={`p-2 rounded ${currentTab === "search" ? "bg-accent" : "hover:bg-muted"
                    }`}
            >
                <Search className="w-6 h-6" />
            </button>

            <button
                onClick={() => setCurrentTab("graph")}
                className={`p-2 rounded ${currentTab === "graph" ? "bg-accent" : "hover:bg-muted"
                    }`}
            >
                <GitGraph className="w-6 h-6" />
            </button>
        </div>
    )
}