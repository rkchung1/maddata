import type { Note } from "@/types/Note"
import { useEffect, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface NoteEditorProps {
  note: Note | null
  onSave: (note: { id: string; title: string; content: string }) => Promise<Note | undefined>
  onNew: () => void | Promise<void> // ✅ NEW
}

export default function NoteEditor({ note, onSave, onNew }: NoteEditorProps) {
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [savedPulse, setSavedPulse] = useState(false)

  useEffect(() => {
    if (note) {
      setTitle(note.title)
      setContent(note.content)
    }
  }, [note])

  const handleSave = useCallback(async () => {
    if (!note) return
    await onSave({ id: note.id, title, content })
    setSavedPulse(true)
    window.setTimeout(() => setSavedPulse(false), 650)
  }, [note, onSave, title, content])

  // Keyboard shortcuts (only while editor is mounted)
  useEffect(() => {
    if (!note) return

    const onKeyDown = (e: KeyboardEvent) => {
      const isMod = e.metaKey || e.ctrlKey
      if (!isMod) return

      // normalize key (lowercase)
      const k = e.key.toLowerCase()

      // Cmd/Ctrl+S -> save
      if (k === "s") {
        e.preventDefault()
        void handleSave()
        return
      }

      // Cmd/Ctrl+N -> new note
      if (k === "n") {
        e.preventDefault()
        void onNew()
        return
      }
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [note, handleSave, onNew])

  if (!note)
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        Select a note
      </div>
    )

  return (
    <div className="flex-1 flex flex-col min-h-0 p-4 font-sans bg-background">
      {/* Save button */}
      <div className="flex justify-end mb-2 shrink-0">
        <Button onClick={() => void handleSave()} size="sm">
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

      {/* Shortcut bar */}
      <div
        className={cn(
          "mt-3 shrink-0 flex items-center justify-between",
          "text-xs text-muted-foreground",
          "border-t pt-2"
        )}
      >
        <div className="flex items-center gap-3">
          <span>
            <kbd className="px-1.5 py-0.5 rounded border bg-muted/40 text-foreground/80">⌘</kbd>+
            <kbd className="px-1.5 py-0.5 rounded border bg-muted/40 text-foreground/80">S</kbd>{" "}
            Save
          </span>
          <span>
            <kbd className="px-1.5 py-0.5 rounded border bg-muted/40 text-foreground/80">⌘</kbd>+
            <kbd className="px-1.5 py-0.5 rounded border bg-muted/40 text-foreground/80">N</kbd>{" "}
            New
          </span>
        </div>

        <span className={cn("transition-opacity", savedPulse ? "opacity-100" : "opacity-0")}>
          Saved
        </span>
      </div>
    </div>
  )
}