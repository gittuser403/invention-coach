import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// Backed by Upstash (atomic increment-with-expiry) rather than an in-memory
// counter, since Vercel serverless/edge functions are stateless across
// invocations and regions — locked in during /plan-eng-review Architecture
// Issue 4.
const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null

const ratelimit = redis
  ? new Ratelimit({
      redis,
      // 30 coaching turns per user per hour — generous for a real
      // conversation, tight enough to blunt a scripted abuse case.
      limiter: Ratelimit.slidingWindow(30, '1 h'),
      prefix: 'invention-coach:coach',
    })
  : null

export async function checkCoachRateLimit(userId: string) {
  if (!ratelimit) {
    // No Upstash configured (e.g. local dev without credentials) — fail
    // open rather than blocking every request, but this must be configured
    // before real deployment.
    return { success: true, remaining: Infinity }
  }

  const { success, remaining } = await ratelimit.limit(userId)
  return { success, remaining }
}
