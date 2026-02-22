// src/hooks/useAsk.ts
import * as React from "react"

export type ChatRole = "user" | "assistant"

export type Citation = {
  note_id: string
  note_title: string
  quote: string
}

export type AskResponse = {
  answer: string
  citations: Citation[]
}

export type ChatMessage = {
  id: string
  role: ChatRole
  content: string
  citations?: Citation[]
  createdAt: number
}

function uid() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : String(Date.now() + Math.random())
}

function safeJsonParse<T>(value: string | null): T | null {
  if (!value) return null
  try {
    return JSON.parse(value) as T
  } catch {
    return null
  }
}

function getStorage() {
  // Session storage only exists in the browser; keep hook SSR-safe.
  if (typeof window === "undefined") return null
  return window.sessionStorage
}

const DEFAULT_GREETING: ChatMessage = {
  id: uid(),
  role: "assistant",
  content: "Hi there, I'm the Librarian. What can I help you find today?",
  createdAt: Date.now(),
}

export function useAsk(opts?: {
  mock?: boolean
  /**
   * Optional namespace for persistence.
   * Use this if you want separate chat histories (e.g., per note/workspace).
   * Example: persistKey: `note-${activeNoteId}`
   */
  persistKey?: string
  /**
   * Override storage key prefix if you ever want multiple apps on same domain.
   */
  storageKeyPrefix?: string
}) {
  const mock = opts?.mock ?? true
  const persistKey = opts?.persistKey ?? "global"
  const storageKeyPrefix = opts?.storageKeyPrefix ?? "ask-chat"
  const storageKey = `${storageKeyPrefix}:${persistKey}`

  // Load initial messages from sessionStorage (drop-in persistence)
  const [messages, setMessages] = React.useState<ChatMessage[]>(() => {
    const storage = getStorage()
    if (!storage) return [DEFAULT_GREETING]

    const stored = safeJsonParse<ChatMessage[]>(storage.getItem(storageKey))
    if (stored && Array.isArray(stored) && stored.length > 0) {
      return stored
    }
    return [DEFAULT_GREETING]
  })

  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  // Persist whenever messages change
  React.useEffect(() => {
    const storage = getStorage()
    if (!storage) return
    storage.setItem(storageKey, JSON.stringify(messages))
  }, [messages, storageKey])

  // If persistKey changes (e.g., user switches active note/workspace), load that chat
  React.useEffect(() => {
    const storage = getStorage()
    if (!storage) return

    const stored = safeJsonParse<ChatMessage[]>(storage.getItem(storageKey))
    if (stored && Array.isArray(stored) && stored.length > 0) {
      setMessages(stored)
    } else {
      setMessages([DEFAULT_GREETING])
    }
    setError(null)
    setIsLoading(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey])

  const ask = React.useCallback(
    async (question: string) => {
      const trimmed = question.trim()
      if (!trimmed) return

      setError(null)
      setIsLoading(true)

      const userMsg: ChatMessage = {
        id: uid(),
        role: "user",
        content: trimmed,
        createdAt: Date.now(),
      }

      // Optimistically append user message
      setMessages((prev) => [...prev, userMsg])

      try {
        let res: AskResponse

        if (mock) {
          res = {
            answer:
              "Based on your notes, you’re aiming for a calmer workflow by reducing friction and keeping interfaces minimal. A good next step is to keep capture fast and defer organization, then use search/graph features to resurface patterns.",
            citations: [
              {
                note_id: "mock-note-ui",
                note_title: "UI inspiration",
                quote: "Minimal interfaces feel calmer and help focus.",
              },
              {
                note_id: "mock-note-philosophy",
                note_title: "Note-taking philosophy",
                quote: "Capture ideas fast, organize later.",
              },
            ],
          }
          await new Promise((r) => setTimeout(r, 350))
        } else {
          const r = await fetch("/api/ask/", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              question: trimmed,
              // Send a small amount of context (optional)
              // history: messages.slice(-8).map((m) => ({ role: m.role, content: m.content })),
            }),
          })

          if (!r.ok) throw new Error(`Request failed (${r.status})`)
          res = (await r.json()) as AskResponse
        }

        const assistantMsg: ChatMessage = {
          id: uid(),
          role: "assistant",
          content: res.answer,
          citations: res.citations,
          createdAt: Date.now(),
        }

        setMessages((prev) => [...prev, assistantMsg])
      } catch (e: any) {
        setError(e?.message ?? "Something went wrong")
      } finally {
        setIsLoading(false)
      }
    },
    [mock]
  )

  const reset = React.useCallback(() => {
    const fresh = [
      {
        id: uid(),
        role: "assistant",
        content:
          "Hi there, I'm the Librarian. What can I help you find today?",
        createdAt: Date.now(),
      } satisfies ChatMessage,
    ]

    setMessages(fresh)
    setError(null)
    setIsLoading(false)

    const storage = getStorage()
    if (!storage) return
    storage.setItem(storageKey, JSON.stringify(fresh))
  }, [storageKey])

  return { messages, isLoading, error, ask, reset }
}