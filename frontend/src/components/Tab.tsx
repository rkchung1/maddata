// src/components/Tab.tsx
import { Button } from "@/components/ui/button"

interface TabProps {
  currentTab: "notes" | "graph"
  setCurrentTab: (tab: "notes" | "graph") => void
}

export default function Tab({ currentTab, setCurrentTab }: TabProps) {
  return (
    <div className="flex justify-center gap-4 py-4">
      <Button
        variant={currentTab === "notes" ? "default" : "outline"}
        onClick={() => setCurrentTab("notes")}
      >
        Notes
      </Button>
      <Button
        variant={currentTab === "graph" ? "default" : "outline"}
        onClick={() => setCurrentTab("graph")}
      >
        Graph
      </Button>
    </div>
  )
}