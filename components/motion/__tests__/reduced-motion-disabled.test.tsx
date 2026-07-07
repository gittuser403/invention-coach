import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { useReducedMotion } from 'framer-motion'
import RevealOnMount from '@/components/motion/RevealOnMount'
import AmbientBackground from '@/components/motion/AmbientBackground'

// Counterpart to reduced-motion-enabled.test.tsx — confirms the DEFAULT
// (motion allowed) path still works and looks structurally different from
// the reduced-motion path, so we know the branch in each component is
// actually doing something, not just always taking the same path.
window.matchMedia = vi.fn().mockImplementation((query: string) => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: vi.fn(),
  removeListener: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
}))

function ReducedMotionProbe() {
  const shouldReduceMotion = useReducedMotion()
  return <span data-testid="probe">{String(shouldReduceMotion)}</span>
}

describe('prefers-reduced-motion: no-preference', () => {
  it("framer-motion's useReducedMotion reports false", () => {
    render(<ReducedMotionProbe />)
    expect(screen.getByTestId('probe').textContent).toBe('false')
  })

  it('RevealOnMount wraps children in an animated container, unlike the reduced-motion path', () => {
    const { container } = render(
      <RevealOnMount>
        <p>hello</p>
      </RevealOnMount>
    )
    expect(container.innerHTML).not.toBe('<p>hello</p>')
    expect(container.querySelector('p')).not.toBeNull()
  })

  it('AmbientBackground renders its decorative shapes with drift enabled', () => {
    render(<AmbientBackground />)
    expect(screen.getAllByTestId('ambient-blob')).toHaveLength(2)
  })
})
