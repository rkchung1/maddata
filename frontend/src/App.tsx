import { useState} from "react"
import TabSidebar from "./components/TabSidebar"
import NoteSidebar from "./components/NoteSidebar"
import NoteEditor from "./components/NoteEditor"
import { useNotes } from "./hooks/useNote"

export default function App() {
  const [currentTab, setCurrentTab] = useState<"notes" | "graph" | "search">("notes")

  const { notes, activeNote, activeNoteId, setActiveNoteId, saveNote, addNote } = useNotes({ mock: false })

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