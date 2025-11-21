import React from 'react'
import { Page, Text, View } from '@react-pdf/renderer'
import { styles, COLORS } from '@/lib/services/pdfStyles'

interface AIInsightsSectionProps {
  aiInsights: any
  pageNumber: number
}

export const AIInsightsSection: React.FC<AIInsightsSectionProps> = ({ aiInsights, pageNumber }) => {
  if (!aiInsights || !aiInsights.insights) {
    return null
  }

  const { summary, insights } = aiInsights

  // Get priority color and style
  const getPriorityStyle = (priority: string) => {
    const priorityLower = priority.toLowerCase()
    if (priorityLower === 'critical') return styles.aiInsightCritical
    if (priorityLower === 'high') return styles.aiInsightHigh
    if (priorityLower === 'medium') return styles.aiInsightMedium
    return styles.aiInsightLow
  }

  const getPriorityColor = (priority: string) => {
    const priorityLower = priority.toLowerCase()
    if (priorityLower === 'critical') return COLORS.danger
    if (priorityLower === 'high') return COLORS.warning
    if (priorityLower === 'medium') return COLORS.secondary
    return COLORS.gray[500]
  }

  // Split insights into pages (max 3-4 per page)
  const insightsPerPage = 4
  const totalPages = Math.ceil(insights.length / insightsPerPage)

  return (
    <>
      {Array.from({ length: totalPages }).map((_, pageIndex) => {
        const startIdx = pageIndex * insightsPerPage
        const endIdx = Math.min(startIdx + insightsPerPage, insights.length)
        const pageInsights = insights.slice(startIdx, endIdx)

        return (
          <Page key={`ai-page-${pageIndex}`} size="A4" style={styles.page}>
            {pageIndex === 0 && (
              <>
                <Text style={styles.header}>AI-Powered Insights</Text>

                {/* Summary */}
                {summary && (
                  <View style={{ marginBottom: 20, padding: 15, backgroundColor: '#EFF6FF', borderRadius: 4 }}>
                    <Text style={[styles.text, { fontWeight: 'bold', marginBottom: 8, color: COLORS.secondary }]}>
                      Executive Summary
                    </Text>
                    <Text style={[styles.text, { lineHeight: 1.6 }]}>{summary}</Text>
                  </View>
                )}

                <Text style={styles.subheader}>Recommendations</Text>
              </>
            )}

            {/* Insights */}
            <View style={{ marginTop: pageIndex === 0 ? 10 : 0 }}>
              {pageInsights.map((insight: any, index: number) => (
                <View
                  key={`insight-${startIdx + index}`}
                  style={[styles.aiInsight, getPriorityStyle(insight.priority)]}
                >
                  {/* Priority Badge and Title */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                    <View
                      style={{
                        padding: '3 6',
                        backgroundColor: getPriorityColor(insight.priority),
                        borderRadius: 3,
                        marginRight: 8,
                      }}
                    >
                      <Text style={{ fontSize: 8, color: COLORS.white, fontWeight: 'bold', textTransform: 'uppercase' }}>
                        {insight.priority}
                      </Text>
                    </View>
                    <Text style={styles.aiInsightTitle}>{insight.title}</Text>
                  </View>

                  {/* Insight Text */}
                  <Text style={styles.aiInsightText}>{insight.insight}</Text>

                  {/* Action Plan */}
                  {insight.actionPlan && (
                    <View style={{ marginTop: 8, paddingLeft: 10 }}>
                      <Text style={[styles.text, { fontSize: 9, fontWeight: 'bold', marginBottom: 4 }]}>
                        Recommended Action:
                      </Text>
                      <Text style={[styles.text, { fontSize: 9, color: COLORS.gray[700] }]}>
                        {insight.actionPlan}
                      </Text>
                    </View>
                  )}

                  {/* Expected Impact */}
                  {insight.expectedImpact && (
                    <View style={{ marginTop: 6, paddingLeft: 10 }}>
                      <Text style={[styles.text, { fontSize: 9, fontWeight: 'bold', marginBottom: 3 }]}>
                        Expected Impact:
                      </Text>
                      <Text style={[styles.text, { fontSize: 9, color: COLORS.gray[700], fontStyle: 'italic' }]}>
                        {insight.expectedImpact}
                      </Text>
                    </View>
                  )}
                </View>
              ))}
            </View>

            {/* Continuation indicator */}
            {endIdx < insights.length && (
              <View style={{ marginTop: 15, padding: 10, backgroundColor: COLORS.gray[100], textAlign: 'center' }}>
                <Text style={[styles.text, { fontSize: 9, fontStyle: 'italic' }]}>
                  Continued on next page ({insights.length - endIdx} more insights)
                </Text>
              </View>
            )}

            {/* Footer */}
            <View style={styles.footer}>
              <Text>InCloud Analytics Report - AI Insights</Text>
              <Text>Page {pageNumber + pageIndex}</Text>
            </View>
          </Page>
        )
      })}

      {/* AI Disclaimer Page */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.header}>AI Insights - Important Notes</Text>

        <View style={{ padding: 15, backgroundColor: '#FEF3C7', border: `2 solid ${COLORS.warning}`, borderRadius: 4 }}>
          <Text style={[styles.text, { fontWeight: 'bold', marginBottom: 8 }]}>
            ⚠️ AI-Generated Content Disclaimer
          </Text>
          <Text style={[styles.text, { lineHeight: 1.6, marginBottom: 6 }]}>
            The insights provided in this section are generated by Google Gemini AI based on your business data.
            While the AI analyzes patterns and trends to provide recommendations, these should be used as
            guidance rather than definitive directives.
          </Text>
        </View>

        <View style={{ marginTop: 20 }}>
          <Text style={[styles.subheader, { fontSize: 16 }]}>How to Use AI Insights</Text>

          <View style={{ marginTop: 10 }}>
            <Text style={[styles.text, { fontWeight: 'bold', marginBottom: 5 }]}>
              1. Review Priority Levels
            </Text>
            <Text style={[styles.text, { marginBottom: 12, paddingLeft: 15 }]}>
              • CRITICAL: Immediate action required (e.g., expired products, zero stock)
              {'\n'}• HIGH: Address within 1-2 days (e.g., low stock, expiring soon)
              {'\n'}• MEDIUM: Plan within a week (e.g., pricing optimization)
              {'\n'}• LOW: Monitor and consider (e.g., trend observations)
            </Text>

            <Text style={[styles.text, { fontWeight: 'bold', marginBottom: 5 }]}>
              2. Validate Recommendations
            </Text>
            <Text style={[styles.text, { marginBottom: 12, paddingLeft: 15 }]}>
              Always verify AI recommendations with your business knowledge. Consider factors like:
              {'\n'}• Seasonal demand patterns
              {'\n'}• Supplier relationships and lead times
              {'\n'}• Customer preferences and feedback
              {'\n'}• Current promotions or marketing campaigns
            </Text>

            <Text style={[styles.text, { fontWeight: 'bold', marginBottom: 5 }]}>
              3. Implement Gradually
            </Text>
            <Text style={[styles.text, { marginBottom: 12, paddingLeft: 15 }]}>
              Test recommendations on a small scale before full implementation:
              {'\n'}• Start with 1-2 high-priority items
              {'\n'}• Monitor results over 1-2 weeks
              {'\n'}• Adjust based on actual outcomes
              {'\n'}• Scale successful strategies
            </Text>

            <Text style={[styles.text, { fontWeight: 'bold', marginBottom: 5 }]}>
              4. Track Results
            </Text>
            <Text style={[styles.text, { paddingLeft: 15 }]}>
              Document which recommendations were implemented and their impact. This helps:
              {'\n'}• Improve future AI accuracy
              {'\n'}• Identify what works for your specific business
              {'\n'}• Build confidence in AI-assisted decision making
            </Text>
          </View>
        </View>

        <View style={{ marginTop: 20, padding: 12, backgroundColor: COLORS.gray[50], borderRadius: 4 }}>
          <Text style={[styles.text, { fontSize: 9, color: COLORS.gray[600], fontStyle: 'italic' }]}>
            Note: AI insights are based on data available at the time of report generation.
            Business conditions may change. Always use your professional judgment and consult
            with relevant stakeholders before making significant operational changes.
          </Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>InCloud Analytics Report - AI Insights Notes</Text>
          <Text>Page {pageNumber + totalPages}</Text>
        </View>
      </Page>
    </>
  )
}
