import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { useReducedMotion } from 'framer-motion'
import RevealOnMount from '@/components/motion/RevealOnMount'
import TypingDots from '@/components/motion/TypingDots'
import CelebratePulse from '@/components/motion/CelebratePulse'
import JourneyPath from '@/components/motion/JourneyPath'
import AmbientBackground from '@/components/motion/AmbientBackground'

// Actually verifies prefers-reduced-motion behavior (per the PRD's explicit
// "verify with a manual check, not just a code comment" requirement) rather
// than asserting it by comment alone. jsdom doesn't implement matchMedia, so
// we mock it to simulate the OS-level accessibility setting framer-motion's
// useReducedMotion() hook reads from.
//
// Split into its own file (see reduced-motion-disabled.test.tsx for the
// opposite case): framer-motion memoizes the media-query result once per
// module instance on first read, so mixing both "reduced" and "not reduced"
// scenarios in one file makes the second scenario silently reuse the
// first's cached value. Vitest isolates modules per file, so one scenario
// per file gives each a fresh, uncached read.
window.matchMedia = vi.fn().mockImplementation((query: string) => ({
  matches: query.includes('prefers-reduced-motion'),
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

describe('prefers-reduced-motion: reduce', () => {
  it("framer-motion's useReducedMotion reports true", () => {
    render(<ReducedMotionProbe />)
    expect(screen.getByTestId('probe').textContent).toBe('true')
  })

  it('RevealOnMount renders children with no animation wrapper', () => {
    const { container } = render(
      <RevealOnMount>
        <p>hello</p>
      </RevealOnMount>
    )
    expect(container.innerHTML).toBe('<p>hello</p>')
  })

  it('TypingDots still shows its accessible status', () => {
    render(<TypingDots />)
    expect(screen.getByRole('status', { name: /coach is typing/i })).toBeInTheDocument()
  })

  it('CelebratePulse still shows the completion status', () => {
    render(<CelebratePulse show={true} />)
    expect(screen.getByRole('status', { name: /stage marked complete/i })).toBeInTheDocument()
  })

  it('CelebratePulse renders nothing when show is false', () => {
    render(<CelebratePulse show={false} />)
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('JourneyPath still exposes an accessible progress summary', () => {
    const statusByStage = new Map([
      [1, 'complete' as const],
      [2, 'in_progress' as const],
    ])
    render(<JourneyPath statusByStage={statusByStage} />)
    expect(screen.getByRole('img', { name: /1 of 7 stages complete/i })).toBeInTheDocument()
  })

  it('AmbientBackground still renders its decorative shapes, just frozen (no drift)', () => {
    render(<AmbientBackground />)
    const container = screen.getByTestId('ambient-background')
    // Purely decorative — hidden from assistive tech either way.
    expect(container).toHaveAttribute('aria-hidden', 'true')
    expect(screen.getAllByTestId('ambient-blob')).toHaveLength(2)
  })
})
