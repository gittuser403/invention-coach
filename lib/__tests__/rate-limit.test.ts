import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Regression: a Vercel deployment failed entirely ("npm run build" exited
// with 1) because UPSTASH_REDIS_REST_URL had a trailing newline from a
// copy-paste into Vercel's env var UI. The Redis client constructor threw
// synchronously at module load time, and Next.js executes route modules
// during its build-time "Collecting page data" step — so a malformed env
// var took down the whole build, not just rate limiting.
//
// Mocks @upstash/redis/@upstash/ratelimit to reproduce that exact failure
// mode without a real network call, and confirms lib/rate-limit.ts now
// fails open (rate limiting disabled, app still builds and runs) instead
// of throwing.

vi.mock('@upstash/redis', () => ({
  Redis: vi.fn().mockImplementation(({ url }: { url: string }) => {
    if (/\s/.test(url)) {
      throw new Error(
        `Upstash Redis client was passed an invalid URL. You should pass a URL starting with https. Received: "${url}".`
      )
    }
    return { url }
  }),
}))

vi.mock('@upstash/ratelimit', () => ({
  Ratelimit: Object.assign(
    vi.fn().mockImplementation(() => ({ limit: vi.fn() })),
    { slidingWindow: vi.fn() }
  ),
}))

const ORIGINAL_ENV = { ...process.env }

beforeEach(() => {
  vi.resetModules()
})

afterEach(() => {
  process.env = { ...ORIGINAL_ENV }
})

describe('rate-limit initialization', () => {
  it('fails open (does not throw) when the URL has a trailing newline', async () => {
    process.env.UPSTASH_REDIS_REST_URL = 'https://eminent-goldfish-157300.upstash.io\n'
    process.env.UPSTASH_REDIS_REST_TOKEN = 'a-token'

    const { checkCoachRateLimit } = await import('@/lib/rate-limit')
    const result = await checkCoachRateLimit('user-1')

    expect(result).toEqual({ success: true, remaining: Infinity })
  })

  it('fails open when Upstash credentials are entirely unset', async () => {
    delete process.env.UPSTASH_REDIS_REST_URL
    delete process.env.UPSTASH_REDIS_REST_TOKEN

    const { checkCoachRateLimit } = await import('@/lib/rate-limit')
    const result = await checkCoachRateLimit('user-1')

    expect(result).toEqual({ success: true, remaining: Infinity })
  })

  it('trims whitespace so a well-formed but padded URL still initializes', async () => {
    process.env.UPSTASH_REDIS_REST_URL = '  https://eminent-goldfish-157300.upstash.io  '
    process.env.UPSTASH_REDIS_REST_TOKEN = '  a-token  '

    const { Redis } = await import('@upstash/redis')
    await import('@/lib/rate-limit')

    expect(Redis).toHaveBeenCalledWith({
      url: 'https://eminent-goldfish-157300.upstash.io',
      token: 'a-token',
    })
  })
})
