import type { Note } from "@/types/Note"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface NoteRowButtonProps {
  note: Note
  isActive: boolean
  onSelect: () => void
  showTags?: boolean
  tagsOverride?: string[]
  excerptLines?: 1 | 2
  className?: string
}

export default function NoteRowButton({
  note,
  isActive,
  onSelect,
  showTags = true,
  tagsOverride,
  excerptLines = 1,
  className,
}: NoteRowButtonProps) {
  // TODO: Replace hardcoded tagsOverride usage with note.tags everywhere once stable
  const tags = tagsOverride ?? note.tags ?? []

  function truncateChars(input: string, max: number) {
    const s = (input ?? "").replace(/\s+/g, " ").trim();
    if (s.length <= max) return s;
    return s.slice(0, max - 1) + "…";
  }

  const title = truncateChars(note.title || "Untitled Note", 42);

  // For excerpt, you may want different limits for 1 vs 2 lines
  const rawExcerpt = note.content?.trim() ? note.content.trim() : "No content";
  const excerpt = truncateChars(rawExcerpt, 35);

  return (
    <Button
      variant="ghost"
      onClick={onSelect}
      className={cn(
        "w-full min-w-0 overflow-hidden", // keep
        "flex flex-col items-start h-auto py-2 px-3 text-left",
        "border transition-colors",
        isActive ? "border-primary bg-transparent" : "border-transparent hover:border-muted",
        className
      )}
    >

      {/* Title */}
      <div className="w-full min-w-0 font-medium overflow-hidden">
        {title}
      </div>

      {/* Excerpt */}
      <div className="mt-1 w-full min-w-0 text-xs text-muted-foreground overflow-hidden">
        {excerpt}
      </div>

      {/* Tags: prevent tags from forcing width */}
      {showTags && tags.length > 0 && (
        <div className="mt-2 w-full min-w-0 flex flex-wrap gap-1 overflow-hidden">
          {tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="max-w-full truncate text-xs px-2 py-0.5 rounded-md bg-muted text-muted-foreground"
            >
              #{tag}
            </span>
          ))}
          {tags.length > 3 && (
            <span className="text-xs text-muted-foreground">+{tags.length - 3}</span>
          )}
        </div>
      )}
    </Button>
  )
}