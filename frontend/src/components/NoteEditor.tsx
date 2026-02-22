import type { Note } from "@/types/Note"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"

interface NoteEditorProps {
  note: Note | null
  onSave: (note: { id: string; title: string; content: string }) => Promise<void>
}

export default function NoteEditor({ note, onSave }: NoteEditorProps) {
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")

  useEffect(() => {
    if (note) {
      setTitle(note.title)
      setContent(note.content)
    }
  }, [note])

  if (!note)
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        Select a note
      </div>
    )

  const handleSave = () => {
    onSave({ id: note.id, title, content })
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 p-4 font-sans bg-background">
      {/* Save button */}
      <div className="flex justify-end mb-2 shrink-0">
        <Button onClick={handleSave} size="sm">
          Save
        </Button>
      </div>

      {/* Title */}
      <textarea
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Note Title"
        rows={1}
        className="
          shrink-0
          text-4xl font-bold
          bg-background
          text-foreground
          border-none
          outline-none
          resize-none
          p-0
          mb-4
          w-full
          leading-tight
        "
      />

      {/* Content wrapper MUST be min-h-0 for textarea scrolling to work */}
      <div className="flex-1 min-h-0">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Start writing your note..."
          className="
            h-full w-full
            bg-background
            text-foreground
            border-none
            outline-none
            resize-none
            p-0
            text-lg
            leading-relaxed
            overflow-auto
          "
        />
      </div>
    </div>
  )
}