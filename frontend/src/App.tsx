import { useState } from "react"
import TabSidebar from "./components/TabSidebar"
import NoteSidebar from "./components/NoteSidebar"
import SearchSidebar from "./components/SearchSidebar"
import NoteEditor from "./components/NoteEditor"
import GraphView3D from "./components/GraphView3D"
import { useNotes } from "./hooks/useNote"

export default function App() {
  const [currentTab, setCurrentTab] = useState<"notes" | "graph" | "search" | "chat">("notes")
  const [activeTags, setActiveTags] = useState<string[]>([])

  const { notes, activeNote, activeNoteId, setActiveNoteId, saveNote, addNote } = useNotes({ mock: true })

  const ComingSoon = ({ label }: { label: string }) => (
    <div className="flex-1 flex items-center justify-center text-muted-foreground">
      {label} view coming soon...
    </div>
  )

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
            />
            <NoteEditor note={activeNote} onSave={saveNote} />
          </>
        )}

        {currentTab === "search" && (
          <>
            <SearchSidebar notes={notes} activeNoteId={activeNoteId} setActiveNoteId={setActiveNoteId} />
            <NoteEditor note={activeNote} onSave={saveNote} />
          </>
        )}

        {currentTab === "graph" && <GraphView3D notes={notes} />}

        {currentTab === "chat" && <ComingSoon label="Chat" />}
      </div>
    </div>
  )
}