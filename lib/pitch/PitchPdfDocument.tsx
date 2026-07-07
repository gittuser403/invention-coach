import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import type { CompiledPitch } from '@/lib/pitch/compile'

// react-pdf renders its own primitive tree (Document/Page/View/Text), not
// regular DOM/JSX — kept as a separate component from PitchOnePager
// (the HTML/Tailwind display version) rather than trying to share markup
// between the two renderers.
const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 11, fontFamily: 'Helvetica' },
  title: { fontSize: 20, fontWeight: 700, marginBottom: 4 },
  studentName: { fontSize: 10, color: '#666', marginBottom: 20 },
  sectionTitle: { fontSize: 12, fontWeight: 700, marginTop: 16, marginBottom: 4 },
  sectionText: { fontSize: 11, lineHeight: 1.5 },
  empty: { fontSize: 11, fontStyle: 'italic', color: '#999' },
})

function Section({ title, text }: { title: string; text: string }) {
  return (
    <View>
      <Text style={styles.sectionTitle}>{title}</Text>
      {text ? (
        <Text style={styles.sectionText}>{text}</Text>
      ) : (
        <Text style={styles.empty}>Not written yet.</Text>
      )}
    </View>
  )
}

export default function PitchPdfDocument({
  pitch,
  studentName,
}: {
  pitch: CompiledPitch
  studentName?: string | null
}) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>{pitch.nameAndTagline || 'Untitled Invention'}</Text>
        {studentName && <Text style={styles.studentName}>by {studentName}</Text>}

        <Section title="The Problem" text={pitch.problemStatement} />
        <Section title="What Already Exists" text={pitch.existingSolutions} />
        <Section title="Our Approach" text={pitch.selectedConcept} />
        <Section title="How It Works" text={pitch.howItWorks} />
      </Page>
    </Document>
  )
}
