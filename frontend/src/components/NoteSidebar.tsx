import type { Note } from "@/types/Note"
import { useRef, useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { BicepsFlexed, Filter, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import NoteRowButton from "@/components/NoteRowButton"

interface NoteSidebarProps {
  notes: Note[]
  activeNoteId: string | null
  setActiveNoteId: (id: string) => void
  onAddNote?: () => void
  activeTags: string[]
  setActiveTags: (tags: string[]) => void
}

export default function NoteSidebar({
  notes,
  activeNoteId,
  setActiveNoteId,
  onAddNote,
  activeTags,
  setActiveTags,
}: NoteSidebarProps) {
  // --- Resizable width ---
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

  const allTags = Array.from(new Set(notes.flatMap((n) => n.tags ?? []))).sort((a, b) =>
    a.localeCompare(b)
  )

  const toggleTag = (tag: string) => {
    if (activeTags.includes(tag)) setActiveTags(activeTags.filter((t) => t !== tag))
    else setActiveTags([...activeTags, tag])
  }

  const filteredNotes =
    activeTags.length === 0
      ? notes
      : notes.filter((n) => (n.tags ?? []).some((t) => activeTags.includes(t)))

  return (
    <div className="relative flex shrink-0">
      <Card style={{ width }} className="flex flex-col h-[100dvh] bg-secondary">
        {/* Header */}
        <div className="flex items-center justify-between p-2">
          <div className="flex items-center gap-2">
            <BicepsFlexed className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">PowerNote</h2>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className={cn(
                  "border border-transparent hover:border-muted",
                  activeTags.length > 0 && "border-primary"
                )}
                aria-label="Filter by tags"
              >
                <Filter className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onClick={() => setActiveTags([])} className="justify-between">
                All tags
                {activeTags.length === 0 && <Check className="h-4 w-4" />}
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              {allTags.length === 0 ? (
                <DropdownMenuItem disabled>No tags yet</DropdownMenuItem>
              ) : (
                allTags.map((tag) => {
                  const selected = activeTags.includes(tag)
                  return (
                    <DropdownMenuItem
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      className="justify-between"
                    >
                      #{tag}
                      {selected && <Check className="h-4 w-4" />}
                    </DropdownMenuItem>
                  )
                })
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Notes list */}
        <ScrollArea className="flex-1 min-h-0 px-2">
          <div className="pb-2">
            {filteredNotes.map((note, idx) => (
              <div key={note.id}>
                <NoteRowButton
                  note={note}
                  isActive={activeNoteId === note.id}
                  onSelect={() => setActiveNoteId(note.id)}
                  showTags={true}
                  excerptLines={1}
                  // TODO: remove tagsOverride once note.tags are fully used everywhere
                  tagsOverride={["thinking", "relationship"]}
                />

                {idx !== filteredNotes.length - 1 && <Separator className="my-1" />}
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Bottom bar: New note */}
        {onAddNote && (
          <div className="p-2 border-t border-muted">
            <Button onClick={onAddNote} className="w-full" variant="default">
              + New note
            </Button>
          </div>
        )}
      </Card>

      {/* Drag handle */}
      <div
        onMouseDown={startDrag}
        className="w-1 cursor-col-resize hover:bg-primary/40 transition-colors"
      />
    </div>
  )
}