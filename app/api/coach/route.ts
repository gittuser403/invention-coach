import { anthropic } from '@ai-sdk/anthropic'
import { streamText, type ModelMessage } from 'ai'
import { createClient } from '@/lib/supabase/server'
import { checkCoachRateLimit } from '@/lib/rate-limit'
import { buildSystemPrompt, type StudentStageWork } from '@/lib/coaching/system-prompt'

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

// Web search adds real latency (search + read results + compose a reply)
// on top of the model call — abort cleanly well before the platform's own
// maxDuration cutoff so we control the failure (a clear message) instead
// of the platform silently killing the function mid-stream.
const SOFT_TIMEOUT_MS = 20000

// Shown whenever a turn fails with no text generated yet — without this,
// a failure that happens before the first token streams (common when
// search is slow) would flush an empty string as the "final" message and
// render as a silent blank bubble with no visible error at all.
const FALLBACK_ERROR_TEXT =
  "Sorry, that took longer than expected and I couldn't finish my reply — please try sending that again."

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

  // Chat history for this stage, plus every stage's saved artifact so the
  // coach carries context across stages (their Stage 1 problem informs the
  // Stage 5 mechanism conversation) without hauling in whole other-stage
  // chat transcripts.
  const [{ data: historyRows }, { data: stageRows }] = await Promise.all([
    supabase
      .from('messages')
      .select('role, content')
      .eq('user_id', user.id)
      .eq('stage_number', stageNumber)
      .order('created_at', { ascending: true }),
    supabase
      .from('stages')
      .select('stage_number, status, artifact')
      .eq('user_id', user.id),
  ])

  const studentWork: StudentStageWork[] = (stageRows ?? []).map((row) => ({
    stageNumber: row.stage_number,
    status: row.status,
    artifactText: (row.artifact as { text?: string } | null)?.text ?? '',
  }))

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

  // Verified experimentally: aborting streamText's abortSignal does NOT
  // reliably invoke onError or onFinish (the AI SDK just ends the stream
  // silently), so the timeout must flush fallback text itself rather than
  // relying on those callbacks to clean up after an abort.
  let settled = false
  const abortController = new AbortController()
  const softTimeout = setTimeout(() => {
    if (settled) return
    settled = true
    abortController.abort()
    void flush(buffer || FALLBACK_ERROR_TEXT, false)
  }, SOFT_TIMEOUT_MS)

  const result = streamText({
    model: anthropic(COACH_MODEL),
    system: buildSystemPrompt(stageNumber, studentWork),
    messages: modelMessages,
    // Lets the coach ground the conversation in real, existing products —
    // e.g. naming Whoop/Garmin/Apple Watch for a fitness-wearable idea —
    // without ever answering FOR the student. Anthropic runs the search
    // server-side; a single search is enough for the 2-4 named examples
    // the system prompt asks for, so this also bounds worst-case latency.
    tools: {
      web_search: anthropic.tools.webSearch_20250305({ maxUses: 1 }),
    },
    abortSignal: abortController.signal,
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
      if (settled) return
      settled = true
      clearTimeout(softTimeout)
      // Guard against a legitimate-but-empty finish, not just errors —
      // an empty final message would otherwise render as a silent blank
      // bubble with no visible error.
      await flush(text || FALLBACK_ERROR_TEXT, false)
    },
    onError: async ({ error }) => {
      if (settled) return
      settled = true
      // Partial content already flushed stays on the row (not silently
      // lost); mark it no-longer-streaming so the client stops waiting.
      // If nothing had streamed yet (common when a slow search fails
      // before the first token), fall back to visible error text instead
      // of persisting an empty string as the "final" reply.
      clearTimeout(softTimeout)
      console.error('Coaching stream error', error)
      await flush(buffer || FALLBACK_ERROR_TEXT, false)
    },
  })

  return result.toTextStreamResponse()
}
