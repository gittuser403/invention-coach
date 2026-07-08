import type { CompiledPitch } from '@/lib/pitch/compile'

// Shared between the authenticated Stage 7 preview and the public
// no-auth share page, so the two never visually drift apart. Purely
// presentational — every field here is the student's own stage text,
// assembled, never rewritten.
export default function PitchOnePager({
  pitch,
  studentName,
}: {
  pitch: CompiledPitch
  studentName?: string | null
}) {
  return (
    <article className="space-y-5 rounded-xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
      <header className="border-b border-stone-100 pb-4">
        <h2 className="text-xl font-semibold text-stone-900">
          {pitch.nameAndTagline || 'Untitled Invention'}
        </h2>
        {studentName && <p className="mt-1 text-xs text-stone-400">by {studentName}</p>}
      </header>

      <Section title="The Problem" text={pitch.problemStatement} />
      <Section title="What Already Exists" text={pitch.existingSolutions} />
      <Section title="Our Approach" text={pitch.selectedConcept} />
      <Section title="How It Works" text={pitch.howItWorks} />
    </article>
  )
}

function Section({ title, text }: { title: string; text: string }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-brand-700">{title}</h3>
      <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-stone-600">
        {text || <span className="italic text-stone-400">Not written yet.</span>}
      </p>
    </div>
  )
}
