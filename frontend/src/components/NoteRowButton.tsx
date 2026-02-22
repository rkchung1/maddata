import type { Note } from "@/types/Note"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useMemo, useState } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Trash2 } from "lucide-react"

interface NoteRowButtonProps {
  note: Note
  isActive: boolean
  onSelect: () => void
  showTags?: boolean
  tagsOverride?: string[]
  excerptLines?: 1 | 2
  className?: string
  query?: string

  // from earlier tagging UI
  isTagging?: boolean

  // NEW: delete hook
  onDelete?: () => void | Promise<void>
  onTagClick?: (tag: string) => void
  activeTags?: string[]
}

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

function makeExcerptAroundQuery(fullText: string, query: string, maxLen: number) {
  const text = (fullText ?? "").replace(/\s+/g, " ").trim()
  if (!text) return "No content"

  const q = (query ?? "").trim()
  if (!q) return text.length <= maxLen ? text : text.slice(0, maxLen - 1) + "…"

  const lower = text.toLowerCase()
  const qLower = q.toLowerCase()

  const idx = lower.indexOf(qLower)
  if (idx === -1) return text.length <= maxLen ? text : text.slice(0, maxLen - 1) + "…"

  const matchStart = idx
  const matchEnd = idx + q.length

  let windowStart = Math.max(0, matchEnd - maxLen)
  let windowEnd = Math.min(text.length, windowStart + maxLen)

  const desiredLeftContext = Math.floor((maxLen - q.length) * 0.6)
  windowStart = Math.max(0, matchStart - desiredLeftContext)
  windowEnd = Math.min(text.length, windowStart + maxLen)

  if (windowEnd < matchEnd) {
    windowStart = Math.max(0, matchEnd - maxLen)
    windowEnd = Math.min(text.length, windowStart + maxLen)
  }

  const slice = text.slice(windowStart, windowEnd)
  const prefix = windowStart > 0 ? "…" : ""
  const suffix = windowEnd < text.length ? "…" : ""
  return prefix + slice + suffix
}

function HighlightedText({ text, query }: { text: string; query?: string }) {
  const q = (query ?? "").trim()
  if (!q) return <>{text}</>

  const re = new RegExp(`(${escapeRegExp(q)})`, "ig")
  const parts = text.split(re)

  return (
    <>
      {parts.map((part, i) => {
        const isMatch = part.toLowerCase() === q.toLowerCase()
        return isMatch ? (
          <mark key={i} className="rounded-sm px-0.5 bg-primary/20 text-foreground">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      })}
    </>
  )
}

export default function NoteRowButton({
  note,
  isActive,
  onSelect,
  showTags = true,
  tagsOverride,
  className,
  query,
  isTagging = false,
  onDelete,
  onTagClick,
  activeTags
}: NoteRowButtonProps) {
  const [confirmOpen, setConfirmOpen] = useState(false)

  const tags = tagsOverride ?? note.tags ?? []

  const title = useMemo(() => {
    const s = (note.title || "Untitled Note").replace(/\s+/g, " ").trim()
    return s.length <= 42 ? s : s.slice(0, 41) + "…"
  }, [note.title])

  const highlightQuery = (query ?? "").trim()
  const rawExcerpt = note.content?.trim() ? note.content.trim() : "No content"
  const excerpt = makeExcerptAroundQuery(rawExcerpt, highlightQuery, 50)

  const canDelete = typeof onDelete === "function"

  return (
    <>
      <Button
        variant="ghost"
        onClick={onSelect}
        className={cn(
          "group relative min-w-0 overflow-hidden w-[calc(100%-6px)]",
          "flex flex-col items-start h-auto py-2 px-3 text-left",
          "border transition-colors",
          isActive ? "border-primary bg-transparent" : "border-transparent hover:border-muted",
          className
        )}
      >
        {/* Hover delete middle */}
        {canDelete && (
          <button
            type="button"
            className={cn(
              "absolute right-6 top-1/2 -translate-y-1/2 z-10",
              "opacity-0 group-hover:opacity-100 transition-opacity",
              "text-muted-foreground hover:text-destructive"
            )}
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              setConfirmOpen(true)
            }}
            aria-label="Delete note"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}

        {/* Title */}
        <div className="w-full min-w-0 font-medium overflow-hidden pr-12">
          <HighlightedText text={title} query={highlightQuery} />
        </div>

        {/* Excerpt */}
        <div className="mt-1 w-full min-w-0 text-xs text-muted-foreground overflow-hidden pr-12">
          <HighlightedText text={excerpt} query={highlightQuery} />
        </div>

        {/* Tags */}
        {showTags && (
          <div className="mt-2 w-full min-w-0 flex flex-wrap gap-1 overflow-hidden pr-12">
            {isTagging ? (
              <>
                <Skeleton className="h-5 w-14 rounded-md animate-pulse bg-muted-foreground/15" />
                <Skeleton className="h-5 w-12 rounded-md animate-pulse bg-muted-foreground/15" />
                <Skeleton className="h-5 w-16 rounded-md animate-pulse bg-muted-foreground/15" />
                <span className="text-xs text-muted-foreground">tagging…</span>
              </>
            ) : tags.length > 0 ? (
              <>
                {tags.slice(0, 3).map((tag) => {
                  const isActiveTag = (activeTags ?? []).includes(tag)
                  const clickable = typeof onTagClick === "function"

                  return clickable ? (
                    <button
                      key={tag}
                      type="button"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        onTagClick(tag)
                      }}
                      className={cn(
                        "max-w-[100%] min-w-0 truncate text-xs px-2 py-0.5 rounded-md border transition-colors",
                        isActiveTag
                          ? "bg-primary text-primary-foreground border-primary shadow-inner"
                          : "bg-muted text-muted-foreground border-transparent hover:bg-muted/70 hover:border-muted-foreground/20"
                      )}
                      aria-pressed={isActiveTag}
                      title={isActiveTag ? "Remove tag filter" : "Filter by tag"}
                    >
                      #{tag}
                    </button>
                  ) : (
                    <span
                      key={tag}
                      className="max-w-[100%] min-w-0 truncate text-xs px-2 py-0.5 rounded-md bg-muted text-muted-foreground"
                    >
                      #{tag}
                    </span>
                  )
                })}
                {tags.length > 3 && (
                  <span className="text-xs text-muted-foreground">+{tags.length - 3}</span>
                )}
              </>
            ) : (
              <span className="text-xs text-muted-foreground">No tags</span>
            )}
          </div>
        )}
      </Button>

      {/* Confirm modal */}
      {canDelete && (
        <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this note?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={async (e) => {
                  // AlertDialogAction is a button; keep default close behavior
                  e.preventDefault()
                  try {
                    await onDelete()
                  } finally {
                    setConfirmOpen(false)
                  }
                }}
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  )
}