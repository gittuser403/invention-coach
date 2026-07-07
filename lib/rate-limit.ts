import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// Backed by Upstash (atomic increment-with-expiry) rather than an in-memory
// counter, since Vercel serverless/edge functions are stateless across
// invocations and regions — locked in during /plan-eng-review Architecture
// Issue 4.
//
// Wrapped in try/catch: this constructor runs at module load time, which
// Next.js also executes during its build-time "Collecting page data" step —
// a malformed env var (e.g. a trailing newline from a copy-paste into
// Vercel's dashboard) would otherwise throw uncaught and fail the entire
// build, not just disable rate limiting. Trim the values defensively too,
// since that exact whitespace issue is the most common real-world cause.
function buildRatelimit(): Ratelimit | null {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim()
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim()

  if (!url || !token) return null

  try {
    const redis = new Redis({ url, token })
    return new Ratelimit({
      redis,
      // 30 coaching turns per user per hour — generous for a real
      // conversation, tight enough to blunt a scripted abuse case.
      limiter: Ratelimit.slidingWindow(30, '1 h'),
      prefix: 'invention-coach:coach',
    })
  } catch (error) {
    console.error('Upstash rate limiter failed to initialize — failing open', error)
    return null
  }
}

const ratelimit = buildRatelimit()

export async function checkCoachRateLimit(userId: string) {
  if (!ratelimit) {
    // No Upstash configured (e.g. local dev without credentials, or a
    // malformed env var caught above) — fail open rather than blocking
    // every request, but this must be configured correctly before real
    // student traffic.
    return { success: true, remaining: Infinity }
  }

  const { success, remaining } = await ratelimit.limit(userId)
  return { success, remaining }
}
