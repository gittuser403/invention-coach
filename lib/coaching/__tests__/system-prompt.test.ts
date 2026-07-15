import { describe, it, expect } from 'vitest'
import { buildSystemPrompt } from '@/lib/coaching/system-prompt'

describe('buildSystemPrompt', () => {
  it('includes the hard "never give the answer" rule verbatim for every stage', () => {
    for (let stage = 1; stage <= 7; stage++) {
      const prompt = buildSystemPrompt(stage)
      expect(prompt).toContain(
        'You must never give the student the correct answer, the "right" solution, or do the thinking for them'
      )
      expect(prompt).toContain('even if:')
      expect(prompt).toContain('They explicitly ask you to just tell them.')
    }
  })

  it('includes the off-track recovery pattern for every stage', () => {
    for (let stage = 1; stage <= 7; stage++) {
      const prompt = buildSystemPrompt(stage)
      expect(prompt).toContain('offer to "zoom out"')
    }
  })

  it('includes the "must never do" guardrails for every stage', () => {
    for (let stage = 1; stage <= 7; stage++) {
      const prompt = buildSystemPrompt(stage)
      expect(prompt).toContain(
        "Never write the student's problem statement, concept, pitch, or any artifact wholesale on their behalf."
      )
    }
  })

  it('selects Stage 1 content and excludes other stages', () => {
    const prompt = buildSystemPrompt(1)
    expect(prompt).toContain('Current stage: Stage 1.')
    expect(prompt).toContain('land on a real, specific problem')
    expect(prompt).not.toContain('Current stage: Stage 2.')
  })

  it('selects Stage 7 content (pitch assembly)', () => {
    const prompt = buildSystemPrompt(7)
    expect(prompt).toContain('Current stage: Stage 7.')
    expect(prompt).toContain('pitch-ready one-pager')
  })

  it('throws on an invalid stage number', () => {
    expect(() => buildSystemPrompt(0)).toThrow('Invalid stage number')
    expect(() => buildSystemPrompt(8)).toThrow('Invalid stage number')
  })

  it('includes prior-stage artifacts when student work is provided', () => {
    const prompt = buildSystemPrompt(5, [
      { stageNumber: 1, status: 'complete', artifactText: 'Students lose focus during long study sessions.' },
      { stageNumber: 4, status: 'in_progress', artifactText: 'A desk lamp that dims when you look away.' },
    ])
    expect(prompt).toContain("The Student's Work So Far")
    expect(prompt).toContain('Stage 1 (complete): Students lose focus during long study sessions.')
    expect(prompt).toContain('Stage 4 (in progress): A desk lamp that dims when you look away.')
    expect(prompt).toContain('Never rewrite or improve these artifacts for them.')
  })

  it('omits the student-work section entirely when there are no artifacts with text', () => {
    const withEmpty = buildSystemPrompt(3, [
      { stageNumber: 1, status: 'in_progress', artifactText: '   ' },
    ])
    expect(withEmpty).not.toContain("The Student's Work So Far")
    expect(withEmpty).toBe(buildSystemPrompt(3))
  })

  it('sorts student work by stage number regardless of input order', () => {
    const prompt = buildSystemPrompt(7, [
      { stageNumber: 3, status: 'complete', artifactText: 'three' },
      { stageNumber: 1, status: 'complete', artifactText: 'one' },
    ])
    expect(prompt.indexOf('Stage 1 (complete): one')).toBeLessThan(
      prompt.indexOf('Stage 3 (complete): three')
    )
  })
})
