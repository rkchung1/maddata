import { useMemo, useState, useCallback } from "react"
import TabSidebar from "./components/TabSidebar"
import NoteSidebar from "./components/NoteSidebar"
import NoteEditor from "./components/NoteEditor"
import GraphView3D from "./components/GraphView3D"
import { useNotes } from "./hooks/useNote"
import ChatRagScreen from "./components/AskScreen"

export default function App() {
  const [currentTab, setCurrentTab] = useState<"notes" | "graph" | "chat">("notes")
  const [activeTags, setActiveTags] = useState<string[]>([])

  const {
    notes,
    activeNote,
    activeNoteId,
    setActiveNoteId,
    saveNote,
    addNote,
    deleteNote,
  } = useNotes({ mock: false })

  // Track notes currently saving/tagging
  const [taggingIds, setTaggingIds] = useState<Set<string>>(() => new Set())

  const setIsTagging = useCallback((noteId: string, isTagging: boolean) => {
    setTaggingIds((prev) => {
      const next = new Set(prev)
      if (isTagging) next.add(noteId)
      else next.delete(noteId)
      return next
    })
  }, [])

  // Save wrapper: keeps UI instant + shows tagging spinner
  const saveNoteWithTagging = useCallback(
    async (note: { id: string; title: string; content: string }) => {
      if (!note?.id) return saveNote(note)

      setIsTagging(note.id, true)
      try {
        const result = await saveNote(note)
        return result
      } finally {
        setIsTagging(note.id, false)
      }
    },
    [saveNote, setIsTagging]
  )

  // Delete wrapper: also remove tagging state if present
  const deleteNoteWithCleanup = useCallback(
    async (id: string) => {
      setIsTagging(id, false)
      await deleteNote(id)
    },
    [deleteNote, setIsTagging]
  )

  // Predicate helper for sidebar rows
  const isTaggingById = useMemo(() => {
    return (id: string) => taggingIds.has(id)
  }, [taggingIds])

  return (
    <div className="dark min-h-screen h-full bg-background text-foreground flex">
      <TabSidebar currentTab={currentTab} setCurrentTab={setCurrentTab} />

      <div className="flex-1 flex min-h-0 min-w-0">
        {currentTab === "notes" && (
          <>
            <NoteSidebar
              notes={notes}
              activeNoteId={activeNoteId}
              setActiveNoteId={setActiveNoteId}
              onAddNote={addNote}
              activeTags={activeTags}
              setActiveTags={setActiveTags}
              isTaggingById={isTaggingById}
              onDeleteNote={deleteNoteWithCleanup}
            />
            <NoteEditor note={activeNote} onSave={saveNoteWithTagging} onNew={addNote}/>
          </>
        )}

        {currentTab === "graph" && (
          <GraphView3D
            notes={notes}
            onNodeClick={(noteId) => {
              setActiveNoteId(noteId)
              setCurrentTab("notes")
            }}
          />
        )}

        {currentTab === "chat" && (
          <ChatRagScreen
            onOpenCitation={(noteId) => {
              setActiveNoteId(noteId)
              setCurrentTab("notes")
            }}
          />
        )}
      </div>
    </div>
  )
}