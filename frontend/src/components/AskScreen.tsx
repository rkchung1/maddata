// src/components/ChatRagScreen.tsx
import * as React from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { useAsk } from "@/hooks/useAsk"

export default function ChatRagScreen(props: {
  onOpenCitation?: (noteId: string) => void
}) {
  const { onOpenCitation } = props
  const { messages, isLoading, error, ask, reset } = useAsk({ mock: false })

  const [input, setInput] = React.useState("")
  const listRef = React.useRef<HTMLDivElement | null>(null)

  React.useEffect(() => {
    listRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages.length])

  function onSend() {
    if (isLoading) return
    const q = input
    setInput("")
    ask(q)
  }

  return (
    <div className="flex-1 min-h-0 min-w-0 flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between">
        <div className="space-y-0.5">
          <div className="text-sm font-medium">Ask The Librarian!</div>
          <div className="text-xs text-muted-foreground">
            Answers are grounded in your notes with citations.
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={reset} disabled={isLoading}>
            Reset
          </Button>
        </div>
      </div>

      <Separator />

      {/* Messages */}
      <ScrollArea className="flex-1 min-h-0">
        <div className="p-4 space-y-3">
          {messages.map((m) => {
            const isUser = m.role === "user"
            return (
              <div
                key={m.id}
                className={`flex ${isUser ? "justify-end" : "justify-start"}`}
              >
                <Card
                  className={`max-w-[820px] w-full p-3 ${isUser ? "bg-secondary/60" : ""
                    }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-xs text-muted-foreground">
                      {isUser ? "You" : "The Librarian"}
                    </div>
                    {m.citations?.length ? (
                      <Badge variant="secondary" className="text-xs">
                        {m.citations.length} citation
                        {m.citations.length > 1 ? "s" : ""}
                      </Badge>
                    ) : null}
                  </div>

                  <div className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">
                    {m.content}
                  </div>

                  {m.citations?.length ? (
                    <div className="mt-3 space-y-2">
                      <Separator />
                      <div className="text-xs text-muted-foreground">
                        Sources
                      </div>
                      <div className="space-y-2">
                        {m.citations.map((c, idx) => (
                          <button
                            key={`${c.note_id}-${idx}`}
                            type="button"
                            onClick={() => onOpenCitation?.(c.note_id)}
                            className="w-full text-left rounded-md border bg-background/40 hover:bg-background/60 transition px-3 py-2"
                          >
                            <div className="text-xs font-medium">
                              {c.note_title}
                              <span className="text-muted-foreground font-normal">
                                {" "}
                                • {c.note_id}
                              </span>
                            </div>
                            <div className="mt-1 text-xs text-muted-foreground">
                              “{c.quote}”
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </Card>
              </div>
            )
          })}

          {isLoading ? (
            <div className="flex justify-start">
              <Card className="max-w-[820px] w-full p-3">
                <div className="text-xs text-muted-foreground">Assistant</div>
                <div className="mt-2 text-sm text-muted-foreground">
                  Thinking…
                </div>
              </Card>
            </div>
          ) : null}

          <div ref={listRef} />
        </div>
      </ScrollArea>

      {/* Composer */}
      <Separator />
      <div className="p-4">
        {error ? (
          <div className="mb-2 text-xs text-red-500">{error}</div>
        ) : null}

        <div className="flex gap-2 items-end">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask something… (e.g., what themes keep recurring?)"
            disabled={isLoading}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === "Enter") onSend()
            }}
            className="
                        w-full
                        bg-background
                        text-foreground
                        border-none
                        outline-none
                        resize-none
                        p-0
                        min-h-[44px]
                        max-h-[160px]
                        leading-relaxed
                        placeholder:text-muted-foreground
                      "
          />
          <Button onClick={onSend} disabled={isLoading || !input.trim()}>
            Send
          </Button>
        </div>

        <div className="mt-2 text-xs text-muted-foreground">
          Tip: Ctrl/⌘ + Enter to send
        </div>
      </div>
    </div>
  )
}