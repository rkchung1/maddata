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
            { id: uuidv4(), title: "Morning reflection", content: "Thinking about priorities for the week and where to focus energy.", tags: ["thinking", "planning"] },
            { id: uuidv4(), title: "Startup idea: note graph", content: "What if notes linked automatically through shared concepts?", tags: ["startup", "ideas", "knowledge"] },
            { id: uuidv4(), title: "Gym routine", content: "Leg day felt strong today. Need to stretch more.", tags: ["health", "routine"] },
            { id: uuidv4(), title: "Conversation with Alex", content: "Discussed career paths and long term goals.", tags: ["relationship", "career"] },
            { id: uuidv4(), title: "UI inspiration", content: "Minimal interfaces feel calmer and help focus.", tags: ["design", "thinking"] },
            { id: uuidv4(), title: "Reading notes", content: "Book emphasized systems over goals.", tags: ["learning", "books"] },
            { id: uuidv4(), title: "Weekend planning", content: "Try to schedule outdoor time and deep work.", tags: ["planning", "life"] },
            { id: uuidv4(), title: "Hackathon prep", content: "Focus on problem framing before coding.", tags: ["hackathon", "strategy"] },
            { id: uuidv4(), title: "Relationship insight", content: "Listening more improves conversations.", tags: ["relationship", "growth"] },
            { id: uuidv4(), title: "Project architecture", content: "Need cleaner separation between data and UI.", tags: ["engineering", "architecture"] },
            { id: uuidv4(), title: "Learning Rust?", content: "Considering whether systems programming is worth exploring.", tags: ["learning", "engineering"] },
            { id: uuidv4(), title: "Personal values", content: "Freedom, curiosity, and contribution feel central.", tags: ["thinking", "identity"] },
            { id: uuidv4(), title: "Note-taking philosophy", content: "Capture ideas fast, organize later.", tags: ["knowledge", "workflow"] },
            { id: uuidv4(), title: "Team meeting recap", content: "We need clearer ownership of tasks.", tags: ["work", "team"] },
            { id: uuidv4(), title: "Graph visualization idea", content: "Show clusters of related notes visually.", tags: ["ideas", "graph"] },
            { id: uuidv4(), title: "Focus problems", content: "Phone distractions keep breaking flow.", tags: ["productivity", "habits"] },
            { id: uuidv4(), title: "Future roadmap", content: "Start small but design for scale.", tags: ["planning", "strategy"] },
            { id: uuidv4(), title: "Books to read", content: "Add more philosophy and design books.", tags: ["books", "learning"] },
            { id: uuidv4(), title: "Travel thoughts", content: "Living abroad for a year could be transformative.", tags: ["life", "dreams"] },
            { id: uuidv4(), title: "Daily journaling", content: "Writing clarifies vague emotions.", tags: ["reflection", "growth"] },
            { id: uuidv4(), title: "Search feature ideas", content: "Combine keyword and semantic retrieval.", tags: ["search", "engineering"] },
            { id: uuidv4(), title: "Chat feature concept", content: "Ask notes instead of browsing them.", tags: ["ai", "ideas"] },
            { id: uuidv4(), title: "Backend scaling", content: "Indexes matter more than hardware early on.", tags: ["engineering", "systems"] },
            { id: uuidv4(), title: "Design principle", content: "Remove friction before adding features.", tags: ["design", "product"] },
            { id: uuidv4(), title: "Motivation dip", content: "Need clearer milestones to maintain momentum.", tags: ["reflection", "productivity"] },
            { id: uuidv4(), title: "Knowledge graph note", content: "Connections reveal patterns faster than lists.", tags: ["knowledge", "graph"] },
            { id: uuidv4(), title: "User testing idea", content: "Observe people using notes, not just ask them.", tags: ["product", "research"] },
            { id: uuidv4(), title: "Evening thoughts", content: "Today felt productive but scattered.", tags: ["reflection"] },
            { id: uuidv4(), title: "Career direction", content: "Building tools seems more meaningful than optimizing ads.", tags: ["career", "thinking"] },
            { id: uuidv4(), title: "Long-term vision", content: "A personal knowledge system that grows with you.", tags: ["vision", "ideas"] },
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