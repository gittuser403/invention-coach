import { describe, it, expect } from 'vitest'
import { shouldRedirectToLogin } from '@/lib/supabase/route-guard'

describe('shouldRedirectToLogin', () => {
  // Regression test: proxy.ts originally redirected unauthenticated /api/*
  // requests to /login, which meant a fetch() caller received the login
  // page's HTML with a 200/303 instead of a clean 401 JSON response —
  // silently corrupting the chat stream if a session expired mid-turn.
  it('never redirects API routes, authenticated or not', () => {
    expect(shouldRedirectToLogin('/api/coach', false)).toBe(false)
    expect(shouldRedirectToLogin('/api/coach', true)).toBe(false)
  })

  it('redirects protected pages when there is no user', () => {
    expect(shouldRedirectToLogin('/dashboard', false)).toBe(true)
    expect(shouldRedirectToLogin('/stage/1', false)).toBe(true)
  })

  it('does not redirect protected pages when a user is present', () => {
    expect(shouldRedirectToLogin('/dashboard', true)).toBe(false)
  })

  it('never redirects explicitly public routes', () => {
    expect(shouldRedirectToLogin('/login', false)).toBe(false)
    expect(shouldRedirectToLogin('/auth/callback', false)).toBe(false)
    expect(shouldRedirectToLogin('/pitch/some-slug', false)).toBe(false)
    expect(shouldRedirectToLogin('/', false)).toBe(false)
  })
})
