import { StyleSheet, Text, View } from 'react-native';
import { Card, EmptyState, Header, Pill, Screen, SectionTitle } from '@/components/ui';
import { ProjectPicker } from '@/components/project-picker';
import { colors } from '@/constants/design';
import { categoryTotals, expenseTotal, monthTotal, stageTotals } from '@/lib/analytics';
import { formatCurrency } from '@/lib/format';
import { useExpenses, useMaster, useProjects } from '@/hooks/use-project-data';
import { useApp } from '@/providers/app-provider';

export default function Reports() {
  const { user, profile, currency } = useApp();
  const projects = useProjects(user?.uid);
  const project = projects.find((item) => item.id === profile?.selectedProjectId) ?? projects[0];
  const { items } = useExpenses(user?.uid, project?.id);
  const categories = useMaster(project?.id, 'categories');
  const stages = useMaster(project?.id, 'stages');
  if (!project) return <Screen><EmptyState title="No project selected" body="Create a project to view reports." /></Screen>;
  const cats = categoryTotals(items, categories).slice(0, 5);
  const stagesData = stageTotals(items, stages).slice(0, 5);
  const total = expenseTotal(items);
  const max = cats[0]?.amount || 1;
  return <Screen><Header title="Reports" subtitle="Clear numbers, not spreadsheet noise." right={<ProjectPicker projects={projects} />} />
    {!items.length ? <EmptyState icon="◔" title="Insights will appear here" body="Add expenses to see category, stage and monthly spending summaries." /> : <>
      <Card style={styles.summary}><Metric label="Expense total" value={formatCurrency(total, currency)} /><Metric label="This month" value={formatCurrency(monthTotal(items), currency)} /><Metric label="Transactions" value={String(items.length)} /></Card>
      <SectionTitle title="Spending by category" />
      <Card style={styles.chart}>{cats.map((item, index) => <View key={item.id} style={styles.chartRow}><View style={styles.chartHead}><Text style={styles.chartName}>{item.name}</Text><Text style={styles.chartAmount}>{formatCurrency(item.amount, currency)}</Text></View><View style={styles.track}><View style={[styles.fill, { width: `${(item.amount / max) * 100}%`, backgroundColor: index === 0 ? colors.forest : '#76B99A' }]} /></View></View>)}</Card>
      <SectionTitle title="Spending by stage" />
      <Card style={styles.stageList}>{stagesData.map((item) => <View key={item.id} style={styles.stageRow}><Text style={styles.stageName}>{item.name}</Text><Pill>{formatCurrency(item.amount, currency)}</Pill></View>)}</Card>
      <Card style={styles.insight}><Text style={styles.insightEyebrow}>QUICK INSIGHT</Text><Text style={styles.insightText}>{cats[0] ? `${cats[0].name} is your highest spending category at ${formatCurrency(cats[0].amount, currency)}.` : 'Start adding expenses to reveal your biggest cost.'}</Text></Card>
    </>}
  </Screen>;
}
function Metric({ label, value }: { label: string; value: string }) { return <View style={styles.metric}><Text style={styles.metricLabel}>{label}</Text><Text numberOfLines={1} style={styles.metricValue}>{value}</Text></View>; }
const styles = StyleSheet.create({ summary: { flexDirection: 'row', padding: 0, overflow: 'hidden' }, metric: { flex: 1, padding: 15, gap: 6, borderRightWidth: 1, borderRightColor: colors.line }, metricLabel: { color: colors.muted, fontSize: 10, fontWeight: '800' }, metricValue: { color: colors.ink, fontWeight: '900', fontSize: 15 }, chart: { gap: 15 }, chartRow: { gap: 7 }, chartHead: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 }, chartName: { color: colors.ink, fontWeight: '800' }, chartAmount: { color: colors.ink, fontSize: 13, fontWeight: '900' }, track: { height: 9, borderRadius: 10, backgroundColor: colors.slate, overflow: 'hidden' }, fill: { height: '100%', borderRadius: 10 }, stageList: { gap: 14 }, stageRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, stageName: { color: colors.ink, fontWeight: '800' }, insight: { backgroundColor: '#FFF7D9', borderColor: '#F5E6A9', gap: 6 }, insightEyebrow: { color: '#876D14', fontSize: 10, letterSpacing: 1, fontWeight: '900' }, insightText: { color: colors.ink, fontSize: 15, fontWeight: '800', lineHeight: 21 } });
