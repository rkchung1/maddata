import type { Note } from "@/types/Note"
import { useMemo, useState, useRef, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, X } from "lucide-react"
import NoteRowButton from "@/components/NoteRowButton"

interface SearchSidebarProps {
  notes: Note[]
  activeNoteId: string | null
  setActiveNoteId: (id: string) => void
}

export default function SearchSidebar({ notes, activeNoteId, setActiveNoteId }: SearchSidebarProps) {
  // --- width state ---
  const MIN = 240
  const MAX = 420
  const [width, setWidth] = useState(260)

  const dragging = useRef(false)

  const startDrag = () => {
    dragging.current = true
    document.body.style.cursor = "col-resize"
    document.body.style.userSelect = "none"
  }

  const stopDrag = () => {
    dragging.current = false
    document.body.style.cursor = ""
    document.body.style.userSelect = ""
  }

  useEffect(() => {
    const onDrag = (e: MouseEvent) => {
      if (!dragging.current) return
      setWidth((prev) => {
        const next = prev + e.movementX
        return Math.min(MAX, Math.max(MIN, next))
      })
    }

    window.addEventListener("mousemove", onDrag)
    window.addEventListener("mouseup", stopDrag)

    return () => {
      window.removeEventListener("mousemove", onDrag)
      window.removeEventListener("mouseup", stopDrag)
      stopDrag()
    }
  }, [])

  // --- search state ---
  const [query, setQuery] = useState("")

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return notes

    return notes.filter((n) => {
      const title = (n.title ?? "").toLowerCase()
      const content = (n.content ?? "").toLowerCase()
      const tags = (n.tags ?? []).join(" ").toLowerCase()
      return title.includes(q) || content.includes(q) || tags.includes(q)
    })
  }, [notes, query])

  return (
    <div className="relative flex shrink-0">
      <Card style={{ width }} className="flex flex-col h-[100dvh] bg-secondary">
        {/* Header */}
        <div className="p-2">
          <div className="flex items-center gap-2 mb-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <div className="text-lg font-semibold">Search</div>
          </div>

          <div className="relative">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search notes..."
              className="pr-9"
            />
            {query.length > 0 && (
              <Button
                type="button"
                size="icon"
                variant="ghost"
                onClick={() => setQuery("")}
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          <div className="mt-2 text-xs text-muted-foreground">
            {results.length} result{results.length === 1 ? "" : "s"}
          </div>
        </div>

        {/* Results */}
        <ScrollArea className="flex-1 min-h-0 px-2">
          <div className="flex flex-col gap-1 pb-2">
            {results.map((note) => (
              <NoteRowButton
                key={note.id}
                note={note}
                isActive={activeNoteId === note.id}
                onSelect={() => setActiveNoteId(note.id)}
                showTags={false}     // search list cleaner
                excerptLines={2}     // search gets 2-line preview
              />
            ))}
          </div>
        </ScrollArea>
      </Card>

      {/* Drag handle */}
      <div
        onMouseDown={startDrag}
        className="w-1 cursor-col-resize hover:bg-primary/40 transition-colors"
      />
    </div>
  )
}