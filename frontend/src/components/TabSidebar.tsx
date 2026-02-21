// src/components/TabSidebar.tsx
import { LayoutList, FileText } from "lucide-react"

interface TabSidebarProps {
  currentTab: "notes" | "graph"
  setCurrentTab: (tab: "notes" | "graph") => void
}

export default function TabSidebar({ currentTab, setCurrentTab }: TabSidebarProps) {
  return (
    <div className="w-16 bg-gray-900 flex flex-col items-center py-4 gap-4">
      <button
        onClick={() => setCurrentTab("notes")}
        className={`p-2 rounded ${
          currentTab === "notes" ? "bg-gray-700" : "hover:bg-gray-800"
        }`}
      >
        <FileText className="w-6 h-6" />
      </button>
      <button
        onClick={() => setCurrentTab("graph")}
        className={`p-2 rounded ${
          currentTab === "graph" ? "bg-gray-700" : "hover:bg-gray-800"
        }`}
      >
        <LayoutList className="w-6 h-6" />
      </button>
    </div>
  )
}