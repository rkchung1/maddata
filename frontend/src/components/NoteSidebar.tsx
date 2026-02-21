// src/components/NoteSidebar.tsx
import type { Note } from "@/types/Note"
import { Card } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"

interface NoteSidebarProps {
  notes: Note[]
  activeNoteId: string | null
  setActiveNoteId: (id: string) => void
  onAddNote?: () => void
}

export default function NoteSidebar({ notes, activeNoteId, setActiveNoteId, onAddNote }: NoteSidebarProps) {
  return (
    <Card className="w-64 flex flex-col p-2 gap-2">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-lg font-semibold">Notes</h2>
        {onAddNote && (
          <Button size="sm" variant="outline" onClick={onAddNote}>
            + New
          </Button>
        )}
      </div>

      <ScrollArea className="flex-1">
        <div className="flex flex-col gap-1">
          {notes.map((note) => (
            <Button
              key={note.id}
              variant={activeNoteId === note.id ? "default" : "ghost"}
              size="sm"
              className="justify-start truncate"
              onClick={() => setActiveNoteId(note.id)}
            >
              {note.title || "Untitled Note"}
            </Button>
          ))}
        </div>
      </ScrollArea>
    </Card>
  )
}