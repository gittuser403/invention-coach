import { anthropic } from '@ai-sdk/anthropic'
import { streamText, type ModelMessage } from 'ai'
import { createClient } from '@/lib/supabase/server'
import { checkCoachRateLimit } from '@/lib/rate-limit'
import { buildSystemPrompt } from '@/lib/coaching/system-prompt'

export const maxDuration = 30

// Cost-efficient tier for routine coaching turns (PRD Section 6). Stage 7's
// final pitch synthesis (Phase 4) escalates to a stronger model — not this
// route.
const COACH_MODEL = 'claude-haiku-4-5'

// How often (ms) to flush the in-progress assistant reply to the DB during
// streaming. Locked in during /plan-eng-review Architecture Issue 1: a
// mid-stream drop should only lose a couple seconds of content, not the
// whole turn.
const FLUSH_INTERVAL_MS = 2000

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return Response.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const { stageNumber, message } = (await request.json()) as {
    stageNumber: number
    message: string
  }

  if (
    !Number.isInteger(stageNumber) ||
    stageNumber < 1 ||
    stageNumber > 7 ||
    typeof message !== 'string' ||
    !message.trim()
  ) {
    return Response.json({ error: 'Invalid request' }, { status: 400 })
  }

  const { success } = await checkCoachRateLimit(user.id)
  if (!success) {
    return Response.json(
      { error: "You've sent a lot of messages — take a short break and try again in a bit." },
      { status: 429 }
    )
  }

  // Save the student's message immediately — this is never at risk from a
  // streaming failure since it happens before the model call starts.
  await supabase.from('messages').insert({
    user_id: user.id,
    stage_number: stageNumber,
    role: 'user',
    content: message,
    streaming: false,
  })

  const { data: historyRows } = await supabase
    .from('messages')
    .select('role, content')
    .eq('user_id', user.id)
    .eq('stage_number', stageNumber)
    .order('created_at', { ascending: true })

  const modelMessages: ModelMessage[] = (historyRows ?? []).map((row) => ({
    role: row.role as 'user' | 'assistant',
    content: row.content,
  }))

  // Row created up front so we have an id to incrementally update as the
  // stream flushes — this is the "incremental buffer flush" architecture
  // decision, not a plain insert-on-finish.
  const { data: assistantRow, error: insertError } = await supabase
    .from('messages')
    .insert({
      user_id: user.id,
      stage_number: stageNumber,
      role: 'assistant',
      content: '',
      streaming: true,
    })
    .select('id')
    .single()

  if (insertError || !assistantRow) {
    return Response.json({ error: 'Could not start coaching reply' }, { status: 500 })
  }

  const assistantRowId = assistantRow.id
  let buffer = ''
  let lastFlush = Date.now()

  async function flush(finalText: string, streaming: boolean) {
    await supabase
      .from('messages')
      .update({ content: finalText, streaming })
      .eq('id', assistantRowId)
  }

  const result = streamText({
    model: anthropic(COACH_MODEL),
    system: buildSystemPrompt(stageNumber),
    messages: modelMessages,
    onChunk: async ({ chunk }) => {
      if (chunk.type !== 'text-delta') return
      buffer += chunk.text
      const now = Date.now()
      if (now - lastFlush >= FLUSH_INTERVAL_MS) {
        lastFlush = now
        await flush(buffer, true)
      }
    },
    onFinish: async ({ text }) => {
      await flush(text, false)
    },
    onError: async ({ error }) => {
      // Partial content already flushed stays on the row (not silently
      // lost); mark it no-longer-streaming so the client stops waiting.
      console.error('Coaching stream error', error)
      await flush(buffer, false)
    },
  })

  return result.toTextStreamResponse()
}
