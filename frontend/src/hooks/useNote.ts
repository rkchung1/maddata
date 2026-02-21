import { useEffect, useState } from "react"
import { v4 as uuidv4 } from "uuid"

export interface Note {
  id: string
  title: string
  content: string
  tags: string[]
}

interface UseNotesOptions {
  mock?: boolean // if true, use fake data
}

export const useNotes = ({ mock = false }: UseNotesOptions = {}) => {
  const [notes, setNotes] = useState<Note[]>([])
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null)

  // =======================
  // Mock functions
  // =======================
  const mockFetchNotes = async (): Promise<Note[]> => {
    return new Promise((resolve) =>
      setTimeout(
        () =>
          resolve([
            { id: uuidv4(), title: "First note", content: "This is note one", tags: [] },
            { id: uuidv4(), title: "Second note", content: "This is note two", tags: [] },
          ]),
        300
      )
    )
  }

  const mockSaveNote = async ({ id, title, content }: { id: string; title: string; content: string }) =>
    new Promise<Note>((resolve) =>
      setTimeout(() => resolve({ id, title, content, tags: [] }), 200)
    )

  const mockAddNote = async (): Promise<Note> =>
    new Promise((resolve) =>
      setTimeout(() => resolve({ id: uuidv4(), title: "New Note", content: "", tags: [] }), 200)
    )

  // =======================
  // Fetch Notes
  // =======================
  useEffect(() => {
    const fetchNotes = async () => {
      try {
        let data: Note[] = []
        if (mock) {
          data = await mockFetchNotes()
        } else {
          // TODO: replace with real GET /api/notes
          const response = await fetch("/api/notes")
          data = await response.json()
        }
        setNotes(data)
        if (data.length > 0) setActiveNoteId(data[0].id)
      } catch (err) {
        console.error("Failed to fetch notes:", err)
      }
    }
    fetchNotes()
  }, [mock])

  // =======================
  // Save / Update Note
  // =======================
  const saveNote = async ({ id, title, content }: { id: string; title: string; content: string }) => {
    try {
      let updatedNote: Note
      if (mock) {
        updatedNote = await mockSaveNote({ id, title, content })
      } else {
        // TODO: replace with real PUT /api/notes/{id}
        const response = await fetch(`/api/notes/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, content }),
        })
        updatedNote = await response.json()
      }
      setNotes((prev) => prev.map((n) => (n.id === id ? updatedNote : n)))
    } catch (err) {
      console.error("Failed to save note:", err)
    }
  }

  // =======================
  // Add Note
  // =======================
  const addNote = async () => {
    try {
      let newNote: Note
      if (mock) {
        newNote = await mockAddNote()
      } else {
        // TODO: replace with real POST /api/notes
        const response = await fetch("/api/notes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: "New Note", content: "", tags: [] }),
        })
        newNote = await response.json()
      }
      setNotes((prev) => [newNote, ...prev])
      setActiveNoteId(newNote.id)
    } catch (err) {
      console.error("Failed to add note:", err)
    }
  }

  const activeNote = notes.find((n) => n.id === activeNoteId) || null

  return { notes, activeNote, activeNoteId, setActiveNoteId, saveNote, addNote }
}