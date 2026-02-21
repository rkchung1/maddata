import type { Note } from "@/types/Note"
import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
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
            <div className="flex-1 flex items-center justify-center text-gray-400">
                Select a note
            </div>
        )

    const handleSave = () => {
        onSave({ id: note.id, title, content })
    }

    return (
        <div className="flex-1 flex flex-col h-full p-4 font-sans bg-transparent">
            {/* Save button */}
            <div className="flex justify-end mb-2">
                <Button onClick={handleSave} variant="default" size="sm">
                    Save
                </Button>
            </div>

            {/* Title */}
            <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Note Title"
                className="
          text-4xl font-bold
          bg-transparent
          shadow-none
          border-0
          focus:outline-none
          focus:ring-0
          focus:border-0
          mb-4
          text-black dark:text-white
        "
            />

            {/* Content */}
            <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Start writing your note..."
                className="
                    flex-1
                    w-full
                    p-0
                    m-0
                    bg-background   /* uses shadcn theme background */
                    border-0
                    resize-none
                    outline-none
                    focus:ring-0     /* remove focus ring */
                    focus:border-none /* remove focus border */
                    text-lg
                    text-black dark:text-white
                "
            />
        </div>
    )
}