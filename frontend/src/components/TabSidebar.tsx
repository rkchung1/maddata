// src/components/TabSidebar.tsx
import { GitGraph, NotebookPen, MessageCircleQuestionMark, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type Tab = "notes" | "graph" | "search" | "chat"

interface TabSidebarProps {
    currentTab: Tab
    setCurrentTab: (tab: Tab) => void
}

export default function TabSidebar({ currentTab, setCurrentTab }: TabSidebarProps) {
    const base =
        "h-11 w-11 p-0 rounded-xl border transition-colors cursor-pointer " +
        "focus-visible:ring-0 focus-visible:ring-offset-0"

    const active = "border-primary bg-transparent"
    const inactive = "border-transparent hover:border-muted bg-transparent"

    return (
        <div className="w-16 bg-secondary flex flex-col justify-center items-center py-4 gap-4">
            <Button
                title="Notes"
                variant="ghost"
                onClick={() => setCurrentTab("notes")}
                className={cn(base, currentTab === "notes" ? active : inactive)}
            >
                <NotebookPen className="h-6 w-6" />
            </Button>

            <Button
                title="Smart Search"
                variant="ghost"
                onClick={() => setCurrentTab("search")}
                className={cn(base, currentTab === "search" ? active : inactive)}
            >
                <Sparkles className="h-6 w-6" />
            </Button>

            <Button
                title="Graph View"
                variant="ghost"
                onClick={() => setCurrentTab("graph")}
                className={cn(base, currentTab === "graph" ? active : inactive)}
            >
                <GitGraph className="h-6 w-6" />
            </Button>

            <Button
                title="Ask the Librarian!"
                variant="ghost"
                onClick={() => setCurrentTab("chat")}
                className={cn(base, currentTab === "chat" ? active : inactive)}
            >
                <MessageCircleQuestionMark className="h-6 w-6" />
            </Button>
        </div>
    )
}