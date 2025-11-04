import React from 'react'
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'

// Simple styles for the PDF
const styles = StyleSheet.create({
  page: {
    padding: 24,
    fontSize: 11,
    fontFamily: 'Helvetica'
  },
  header: {
    marginBottom: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    borderBottomStyle: 'solid'
  },
  title: {
    fontSize: 16,
    fontWeight: 700,
    marginBottom: 4
  },
  subtitle: {
    fontSize: 11,
    color: '#6b7280'
  },
  section: {
    marginTop: 12
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 700,
    marginBottom: 6
  },
  row: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4
  },
  label: {
    color: '#6b7280'
  },
  value: {
    fontWeight: 700
  },
  table: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderStyle: 'solid'
  },
  tableRow: {
    flexDirection: 'row'
  },
  tableHeaderCell: {
    flex: 1,
    padding: 6,
    backgroundColor: '#f3f4f6',
    borderRightWidth: 1,
    borderRightColor: '#e5e7eb',
    borderRightStyle: 'solid',
    fontWeight: 700
  },
  tableCell: {
    flex: 1,
    padding: 6,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    borderTopStyle: 'solid',
    borderRightWidth: 1,
    borderRightColor: '#e5e7eb',
    borderRightStyle: 'solid'
  }
})

// Types trimmed to "any" for simplicity and compatibility
export function ResultReportDocument({ result }: { result: any }) {
  const score = Number(result?.score ?? 0)
  const totalMarks = Number(result?.totalMarks ?? result?.test?.totalMarks ?? 0)
  const percentage = totalMarks > 0 ? (score / totalMarks) * 100 : 0
  const attempted = Number(result?.correctAnswers ?? 0) + Number(result?.wrongAnswers ?? 0)
  const accuracy = Number(result?.accuracy ?? (attempted > 0 ? (Number(result?.correctAnswers ?? 0) / attempted) * 100 : 0))
  const skipped = Number(result?.skippedAnswers ?? result?.unattempted ?? 0)
  const durationMin = Number(result?.test?.duration ?? 0)
  const timeTakenSec = Number(result?.timeTaken ?? 0)

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>{result?.test?.title || 'Test Result'}</Text>
          <Text style={styles.subtitle}>Result Report • Generated on {new Date().toLocaleString()}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Summary</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Score</Text>
            <Text style={styles.value}>{score.toFixed(2)} / {totalMarks}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Percentage</Text>
            <Text style={styles.value}>{percentage.toFixed(1)}%</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Accuracy</Text>
            <Text style={styles.value}>{accuracy.toFixed(1)}%</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Correct</Text>
            <Text style={styles.value}>{Number(result?.correctAnswers ?? 0)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Wrong</Text>
            <Text style={styles.value}>{Number(result?.wrongAnswers ?? 0)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Skipped</Text>
            <Text style={styles.value}>{skipped}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Rank</Text>
            <Text style={styles.value}>{result?.rank ?? 'N/A'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Time Taken</Text>
            <Text style={styles.value}>{Math.floor(timeTakenSec / 60)} min</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Test Duration</Text>
            <Text style={styles.value}>{durationMin} min</Text>
          </View>
        </View>

        {/* Question Analysis (compact) */}
        {result?.answers && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Question Analysis</Text>
            <View style={styles.table}>
              <View style={styles.tableRow}>
                <Text style={styles.tableHeaderCell}>#</Text>
                <Text style={styles.tableHeaderCell}>Status</Text>
                <Text style={styles.tableHeaderCell}>Time (s)</Text>
              </View>
              {Object.entries(result.answers).map(([qid, ans]: [string, any], idx) => {
                const a = (ans && typeof ans === 'object') ? ans : { answer: ans, timeSpent: 0, markedForReview: false }
                const status = a.answer ? 'Answered' : 'Skipped'
                return (
                  <View key={qid} style={styles.tableRow}>
                    <Text style={styles.tableCell}>{idx + 1}</Text>
                    <Text style={styles.tableCell}>{status}</Text>
                    <Text style={styles.tableCell}>{Number(a.timeSpent || 0)}</Text>
                  </View>
                )
              })}
            </View>
          </View>
        )}
      </Page>
    </Document>
  )
}
