'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import TypingDots from '@/components/motion/TypingDots'
import RevealOnMount from '@/components/motion/RevealOnMount'

function CoachAvatar() {
  return (
    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-50" aria-hidden="true">
      <svg viewBox="0 0 24 24" className="h-4 w-4 text-brand-700">
        <path
          fill="currentColor"
          d="M12 2a7 7 0 0 0-4 12.74V17a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-2.26A7 7 0 0 0 12 2Zm-2 17a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1v-.5h-4V19Z"
        />
      </svg>
    </span>
  )
}

function UserAvatar() {
  return (
    <span
      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-stone-700 text-[10px] font-medium text-white"
      aria-hidden="true"
    >
      You
    </span>
  )
}

type ChatMessage = {
  role: 'user' | 'assistant'
  content: string
}

// Reusable across all 7 stages — driven entirely by `stageNumber`, never
// duplicated per stage (locked in during /plan-eng-review Code Quality
// Issue 5). Uses a plain fetch + ReadableStream reader rather than
// @ai-sdk/react's useChat, since our `messages` table stores simple
// role/content strings, not the UIMessage parts format — this avoids a
// translation layer for a chat with no tool calls or rich content.
export default function ChatPanel({
  stageNumber,
  initialMessages,
}: {
  stageNumber: number
  initialMessages: ChatMessage[]
}) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages)
  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // Announced to screen readers instead of the raw streaming deltas —
  // reading every token as it arrives would be overwhelming; a start/end
  // announcement is the useful signal.
  const [liveStatus, setLiveStatus] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputId = `chat-input-stage-${stageNumber}`
  const shouldReduceMotion = useReducedMotion()

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const text = input.trim()
    if (!text || isStreaming) return

    setError(null)
    setInput('')
    setMessages((prev) => [...prev, { role: 'user', content: text }])
    setIsStreaming(true)
    setLiveStatus('Coach is typing')

    try {
      const res = await fetch('/api/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stageNumber, message: text }),
      })

      if (!res.ok || !res.body) {
        const body = await res.json().catch(() => null)
        setError(body?.error ?? 'Something went wrong. Please try again.')
        setIsStreaming(false)
        setLiveStatus('')
        return
      }

      setMessages((prev) => [...prev, { role: 'assistant', content: '' }])

      const reader = res.body.getReader()
      const decoder = new TextDecoder()

      for (;;) {
        const { done, value } = await reader.read()
        if (done) break
        const chunkText = decoder.decode(value, { stream: true })
        setMessages((prev) => {
          const next = [...prev]
          const last = next[next.length - 1]
          next[next.length - 1] = { ...last, content: last.content + chunkText }
          return next
        })
      }
      setLiveStatus('Coach replied')
    } catch {
      setError('Lost connection mid-reply — your message was saved, try sending again.')
      setLiveStatus('')
    } finally {
      setIsStreaming(false)
    }
  }

  return (
    <div className="flex h-[28rem] flex-col overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
      <div className="h-1 shrink-0 bg-gradient-to-r from-brand-700 to-celebrate-400" aria-hidden="true" />
      <div aria-live="polite" className="sr-only">
        {liveStatus}
      </div>

      <div role="log" aria-label="Coaching conversation" className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.length === 0 && (
          <p className="text-sm text-stone-400">
            Say hello to start this stage&apos;s conversation.
          </p>
        )}
        {messages.map((m, i) => {
          const isLast = i === messages.length - 1
          const isWaitingForFirstToken = isStreaming && isLast && m.role === 'assistant' && !m.content
          const isUser = m.role === 'user'
          return (
            <RevealOnMount key={i}>
              <div className={`flex items-end gap-2 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                {isUser ? <UserAvatar /> : <CoachAvatar />}
                <span
                  className={`inline-block max-w-[80%] px-3.5 py-2 text-sm ${
                    isUser
                      ? 'rounded-2xl rounded-br-sm bg-brand-700 text-white'
                      : 'rounded-2xl rounded-bl-sm bg-stone-100 text-stone-900'
                  }`}
                >
                  {isWaitingForFirstToken ? <TypingDots /> : m.content}
                </span>
              </div>
            </RevealOnMount>
          )
        })}
        <div ref={scrollRef} />
      </div>

      {error && (
        <p role="alert" className="border-t border-red-100 bg-red-50 px-4 py-2 text-xs text-red-700">
          {error}
        </p>
      )}

      <form
        onSubmit={handleSubmit}
        className="flex gap-2 border-t border-stone-200 p-3"
      >
        <label htmlFor={inputId} className="sr-only">
          Message the coach
        </label>
        <input
          id={inputId}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={isStreaming}
          placeholder="Type your response..."
          className="min-h-[44px] flex-1 rounded-md border border-stone-300 px-3 py-2 text-sm transition-shadow focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
        />
        <motion.button
          type="submit"
          disabled={isStreaming || !input.trim()}
          whileHover={shouldReduceMotion || isStreaming || !input.trim() ? undefined : { scale: 1.03 }}
          whileTap={shouldReduceMotion || isStreaming || !input.trim() ? undefined : { scale: 0.97 }}
          className="min-h-[44px] rounded-md bg-brand-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-800 disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
        >
          Send
        </motion.button>
      </form>
    </div>
  )
}
