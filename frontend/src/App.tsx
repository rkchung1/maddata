import { useState, useEffect } from "react"
import TabSidebar from "./components/TabSidebar"
import NoteSidebar from "./components/NoteSidebar"
import NoteEditor from "./components/NoteEditor"
import type { Note } from "./types/Note"

export default function App() {
  const [currentTab, setCurrentTab] = useState<"notes" | "graph">("notes")
  const [notes, setNotes] = useState<Note[]>([])
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null)

  // Fetch initial notes
  useEffect(() => {
    const fetchNotes = async () => {
      try {
        // TODO: replace with real GET /api/notes endpoint
        const response = await fetch("/api/notes")
        const data: Note[] = await response.json()
        setNotes(data)
        if (data.length > 0) setActiveNoteId(data[0].id)
      } catch (err) {
        console.error("Failed to fetch notes:", err)
      }
    }

    fetchNotes()
  }, [])

  const activeNote = notes.find((n) => n.id === activeNoteId) || null

  // Save / update a note
  const saveNote = async ({ id, title, content }: { id: string; title: string; content: string }) => {
    try {
      // TODO: replace with real PUT /api/notes/{id} endpoint
      const response = await fetch(`/api/notes/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content }),
      })
      const updatedNote: Note = await response.json()
      setNotes((prev) => prev.map((n) => (n.id === id ? updatedNote : n)))
    } catch (err) {
      console.error("Failed to save note:", err)
    }
  }

  // Add a new note
  const addNote = async () => {
    try {
      const newNoteData = { title: "New Note", content: "", tags: [] }
      // TODO: replace with real POST /api/notes endpoint
      const response = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newNoteData),
      })
      const newNote: Note = await response.json()
      setNotes((prev) => [newNote, ...prev])
      setActiveNoteId(newNote.id)
    } catch (err) {
      console.error("Failed to add note:", err)
    }
  }

  return (
    <div className="dark min-h-screen bg-background text-foreground flex">
      {/* Thin tab sidebar */}
      <TabSidebar currentTab={currentTab} setCurrentTab={setCurrentTab} />

      {currentTab === "notes" ? (
        <>
          <NoteSidebar notes={notes} activeNoteId={activeNoteId} setActiveNoteId={setActiveNoteId} onAddNote={addNote} />
          <NoteEditor note={activeNote} onSave={saveNote} />
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center text-gray-400">
          Graph view coming soon...
        </div>
      )}
    </div>
  )
}