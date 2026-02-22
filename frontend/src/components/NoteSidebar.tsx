import type { Note } from "@/types/Note"
import { useState, useMemo } from "react"
import { Card } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { BicepsFlexed, Filter, Check, Search, X } from "lucide-react"
import { cn } from "@/lib/utils"
import NoteRowButton from "@/components/NoteRowButton"

interface NoteSidebarProps {
    notes: Note[]
    activeNoteId: string | null
    setActiveNoteId: (id: string) => void
    onAddNote?: () => void
    activeTags: string[]
    setActiveTags: (tags: string[]) => void
    isTaggingById?: (id: string) => boolean
    onDeleteNote?: (id: string) => void | Promise<void>
}

function includesLoose(haystack: string, needle: string) {
    return haystack.toLowerCase().includes(needle.toLowerCase())
}

export default function NoteSidebar({
    notes,
    activeNoteId,
    setActiveNoteId,
    onAddNote,
    activeTags,
    setActiveTags,
    isTaggingById,
    onDeleteNote
}: NoteSidebarProps) {
    // --- Search state (merged) ---
    const [searchOpen, setSearchOpen] = useState(false)
    const [query, setQuery] = useState("")

    // tags list
    const allTags = useMemo(
        () =>
            Array.from(new Set(notes.flatMap((n) => n.tags ?? []))).sort((a, b) =>
                a.localeCompare(b)
            ),
        [notes]
    )

    const sortedTags = useMemo(() => {
        if (allTags.length === 0) return []

        const selectedSet = new Set(activeTags)

        // 1) selected first (preserve selection order)
        const selected = activeTags.filter((t) => allTags.includes(t))

        // 2) unselected next (alphabetical for stability)
        const unselected = allTags
            .filter((t) => !selectedSet.has(t))
            .slice()
            .sort((a, b) => a.localeCompare(b))

        return [...selected, ...unselected]
    }, [allTags, activeTags])

    const toggleTag = (tag: string) => {
        if (activeTags.includes(tag)) setActiveTags(activeTags.filter((t) => t !== tag))
        else setActiveTags([...activeTags, tag])
    }

    const filteredNotes = useMemo(() => {
        const q = query.trim()

        return notes.filter((n) => {
            // tag filter
            const passesTags =
                activeTags.length === 0 ? true : (n.tags ?? []).some((t) => activeTags.includes(t))
            if (!passesTags) return false

            // search filter (keyword for now)
            if (!searchOpen || q.length === 0) return true

            const hay = `${n.title ?? ""}\n${n.content ?? ""}\n${(n.tags ?? []).join(" ")}`
            return includesLoose(hay, q)
        })
    }, [notes, activeTags, query, searchOpen])

    const hasActiveFilters = activeTags.length > 0 || (searchOpen && query.trim().length > 0)

    return (
        <div className="relative flex shrink-0 pr-5">
            {/* Fixed width + slightly wider */}
            <Card className="flex flex-col h-[100dvh] bg-secondary w-[400px]">
                {/* Header */}
                <div className="p-2">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <BicepsFlexed className="h-5 w-5 text-primary" />
                            <h2 className="text-lg font-semibold">PowerNote</h2>
                        </div>

                        <div className="flex items-center gap-1">
                            {/* Search toggle */}
                            <Button
                                size="icon"
                                variant="ghost"
                                title="Search"
                                onClick={() => setSearchOpen((v) => !v)}
                                className={cn(
                                    "border border-transparent hover:border-muted",
                                    searchOpen && "border-primary"
                                )}
                                aria-label="Search notes"
                            >
                                <Search className="h-4 w-4" />
                            </Button>

                            {/* Tag filter */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        title="Filter"
                                        className={cn(
                                            "border border-transparent hover:border-muted",
                                            activeTags.length > 0 && "border-primary"
                                        )}
                                        aria-label="Filter by tags"
                                    >
                                        <Filter className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>

                                <DropdownMenuContent align="end" className="w-44">
                                    <DropdownMenuItem onClick={() => setActiveTags([])} className="justify-between">
                                        All tags
                                        {activeTags.length === 0 && <Check className="h-4 w-4" />}
                                    </DropdownMenuItem>

                                    <DropdownMenuSeparator />

                                    {allTags.length === 0 ? (
                                        <DropdownMenuItem disabled>No tags yet</DropdownMenuItem>
                                    ) : (
                                        sortedTags.map((tag) => {
                                            const selected = activeTags.includes(tag)
                                            return (
                                                <DropdownMenuItem
                                                    key={tag}
                                                    onClick={() => toggleTag(tag)}
                                                    className="justify-between"
                                                >
                                                    #{tag}
                                                    {selected && <Check className="h-4 w-4" />}
                                                </DropdownMenuItem>
                                            )
                                        })
                                    )}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>

                    {/* Search row */}
                    {searchOpen && (
                        <div className="mt-2 flex items-center gap-2">
                            <Input
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Search notes…"
                                className="h-9 bg-background/40"
                            />
                            {query.trim().length > 0 && (
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    title="Clear"
                                    onClick={() => setQuery("")}
                                    className="h-9 w-9 border border-transparent hover:border-muted"
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            )}
                        </div>
                    )}

                    {/* Tiny status line */}
                    {hasActiveFilters && (
                        <div className="mt-2 text-xs text-muted-foreground flex items-center justify-between">
                            <span className="tabular-nums">{filteredNotes.length} results</span>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2"
                                onClick={() => {
                                    setActiveTags([])
                                    setQuery("")
                                    setSearchOpen(false)
                                }}
                            >
                                Clear
                            </Button>
                        </div>
                    )}
                </div>

                {/* Notes list */}
                <ScrollArea className="flex-1 min-h-0 px-2">
                    <div className="pb-2">
                        {filteredNotes.map((note, idx) => (
                            <div key={note.id}>
                                <NoteRowButton
                                    note={note}
                                    isActive={activeNoteId === note.id}
                                    onSelect={() => setActiveNoteId(note.id)}
                                    showTags={true}
                                    excerptLines={1}
                                    query={searchOpen ? query : ""}
                                    isTagging={isTaggingById?.(note.id) ?? false}
                                    onDelete={onDeleteNote ? () => onDeleteNote(note.id) : undefined}
                                    onTagClick={(tag) => {
                                        setActiveTags((prev) =>
                                            prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
                                        )
                                    }}
                                    activeTags={activeTags}
                                />
                                {idx !== filteredNotes.length - 1 && <Separator className="my-1" />}
                            </div>
                        ))}
                    </div>
                </ScrollArea>

                {/* Bottom bar: New note */}
                {onAddNote && (
                    <div className="p-2 border-t border-muted">
                        <Button onClick={onAddNote} className="w-full" variant="default">
                            + New note
                        </Button>
                    </div>
                )}
            </Card>
        </div>
    )
}