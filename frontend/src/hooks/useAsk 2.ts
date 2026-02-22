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

export function useAsk(opts?: { mock?: boolean }) {
  const mock = opts?.mock ?? true

  const [messages, setMessages] = React.useState<ChatMessage[]>([
    {
      id: uid(),
      role: "assistant",
      content:
        "Hi there, I'm the book keeper. Ask me anything about your notes!",
      createdAt: Date.now(),
    },
  ])

  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const ask = React.useCallback(async (question: string) => {
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

    setMessages((prev) => [...prev, userMsg])

    try {
      let res: AskResponse

      if (mock) {
        // TODO: replace with real API call
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
          method: "POST", // (your contract says GET, but JSON body -> POST is the sane choice)
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            question: trimmed,
            // Optional: send recent history (backend can choose how much to use)
            history: messages
              .slice(-8)
              .map((m) => ({ role: m.role, content: m.content })),
          }),
        })

        if (!r.ok) {
          throw new Error(`Request failed (${r.status})`)
        }

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
  }, [mock, messages])

  const reset = React.useCallback(() => {
    setMessages([
      {
        id: uid(),
        role: "assistant",
        content:
          "Ask me anything about your notes. I’ll answer and cite the most relevant notes.",
        createdAt: Date.now(),
      },
    ])
    setError(null)
    setIsLoading(false)
  }, [])

  return { messages, isLoading, error, ask, reset }
}