import { StyleSheet, Text, View } from 'react-native';
import { Card, EmptyState, Header, Pill, Screen, SectionTitle } from '@/components/ui';
import { ProjectPicker } from '@/components/project-picker';
import { colors } from '@/constants/design';
import { budgetRows, budgetTypeTotals, expenseTotal, fundingSourceTotals, monthlyTotals, monthTotal, stageTotals } from '@/lib/analytics';
import { formatCurrency } from '@/lib/format';
import { useBudget, useExpenses, useMaster, useProjects } from '@/hooks/use-project-data';
import { useApp } from '@/providers/app-provider';
import type { CurrencyCode } from '@/types/domain';

const chartColors = [colors.forest, '#4D9777', '#76B99A', '#A7D5BD', '#D5ECDD'];

export default function Reports() {
  const { user, profile, currency } = useApp();
  const projects = useProjects(user?.uid);
  const project = projects.find((item) => item.id === profile?.selectedProjectId) ?? projects[0];
  const { items } = useExpenses(user?.uid, project?.id);
  const categories = useMaster(project?.id, 'categories');
  const fundingSources = useMaster(project?.id, 'fundingSources');
  const stages = useMaster(project?.id, 'stages');
  const budget = useBudget(user?.uid, project?.id);

  if (!project) return <Screen><EmptyState title="No project selected" body="Create a project to view reports." /></Screen>;
  if (!items.length) return <Screen><Header title="Reports" subtitle="Your project insights." right={<ProjectPicker projects={projects} />} /><EmptyState icon="◔" title="Insights will appear here" body="Add expenses to see trend charts and a clear category and stage breakdown." /></Screen>;

  const total = expenseTotal(items);
  const thisMonth = monthTotal(items);
  const constructionCategoryData = budgetRows(budget, items, categories, 'construction').slice(0, 5);
  const otherCategoryData = budgetRows(budget, items, categories, 'other').slice(0, 5);
  const fundingData = fundingSourceTotals(items, fundingSources).slice(0, 5);
  const stageData = stageTotals(items, stages).slice(0, 5);
  const trend = monthlyTotals(items);
  const maxTrend = Math.max(...trend.map((item) => item.amount), 1);
  const planned = budget?.totalBudget ?? project.totalBudget;
  const budgetTypes = budgetTypeTotals(items, budget, project.totalBudget);
  const budgetPercent = planned ? Math.round((total / planned) * 100) : undefined;
  const highestCategory = [...constructionCategoryData, ...otherCategoryData].sort((a, b) => b.actual - a.actual)[0];

  return <Screen>
    <Header title="Reports" subtitle="Spend patterns for this project." right={<ProjectPicker projects={projects} />} />
    <Card style={styles.summary}>
      <Metric label="Total spent" value={formatCurrency(total, currency)} />
      <Metric label="This month" value={formatCurrency(thisMonth, currency)} />
      <Metric label="Expenses" value={String(items.length)} last />
    </Card>

    {planned ? <Card style={budgetPercent! > 100 ? styles.overBudget : styles.budgetCard}>
      <View style={styles.budgetHeading}><View><Text style={styles.eyebrow}>BUDGET UTILISATION</Text><Text style={styles.budgetValue}>{budgetPercent}% used</Text></View><Pill tone={budgetPercent! > 100 ? 'coral' : budgetPercent! > 80 ? 'amber' : 'green'}>{formatCurrency(Math.abs(planned - total), currency)} {budgetPercent! > 100 ? 'over' : 'left'}</Pill></View>
      <View style={styles.budgetTrack}><View style={[styles.budgetFill, budgetPercent! > 100 && styles.overBudgetFill, { width: `${Math.min(budgetPercent!, 100)}%` }]} /></View>
      <Text style={styles.budgetCaption}>{formatCurrency(total, currency)} spent of {formatCurrency(planned, currency)}</Text>
    </Card> : null}

    <SectionTitle title="Where your money goes" action="By budget type" />
    <Card style={styles.bucketCard}>
      {budgetTypes.map((type, index) => <BudgetTypeRow key={type.bucket} {...type} color={chartColors[index]} currency={currency} />)}
    </Card>

    <SectionTitle title="Spending trend" action="Last 6 months" />
    <Card style={styles.trendCard}>
      <View style={styles.trendChart}>{trend.map((item, index) => <View key={item.key} style={styles.barColumn}><Text numberOfLines={1} style={styles.barValue}>{item.amount ? formatCompactCurrency(item.amount, currency) : ''}</Text><View style={styles.barArea}><View style={[styles.bar, { height: `${Math.max((item.amount / maxTrend) * 100, item.amount ? 7 : 0)}%`, backgroundColor: index === trend.length - 1 ? colors.forest : '#9ED2B6' }]} /></View><Text style={styles.barLabel}>{item.label}</Text></View>)}</View>
      <Text style={styles.chartCaption}>Monthly recorded spending. The latest month is highlighted.</Text>
    </Card>

    {constructionCategoryData.length ? <><SectionTitle title="Construction spending" action="By category" />
    <Card style={styles.breakdownCard}>{constructionCategoryData.map((item, index) => <BudgetCategoryRow key={item.categoryId} {...item} color={chartColors[index]} currency={currency} />)}</Card></> : null}

    {otherCategoryData.length ? <><SectionTitle title="Other project costs" action="By category" />
    <Card style={styles.breakdownCard}>{otherCategoryData.map((item, index) => <BudgetCategoryRow key={item.categoryId} {...item} color={chartColors[index + 1]} currency={currency} />)}</Card></> : null}

    <SectionTitle title="Where money came from" action="By funding source" />
    <Card style={styles.breakdownCard}>{fundingData.map((item, index) => <BreakdownRow key={item.id} name={item.name} amount={item.amount} total={total} color={chartColors[index]} currency={currency} />)}</Card>

    <SectionTitle title="Progress spending" action="By stage" />
    <Card style={styles.breakdownCard}>{stageData.map((item, index) => <BreakdownRow key={item.id} name={item.name} amount={item.amount} total={total} color={chartColors[index]} currency={currency} />)}</Card>

    <Card style={styles.insight}>
      <Text style={styles.insightEyebrow}>BIGGEST COST DRIVER</Text>
      <Text style={styles.insightText}>{highestCategory ? `${highestCategory.name} is the biggest recorded cost at ${formatCurrency(highestCategory.actual, currency)}.` : 'Add expenses to reveal your biggest cost driver.'}</Text>
    </Card>
  </Screen>;
}

function Metric({ label, value, last = false }: { label: string; value: string; last?: boolean }) { return <View style={[styles.metric, !last && styles.metricDivider]}><Text style={styles.metricLabel}>{label}</Text><Text numberOfLines={1} style={styles.metricValue}>{value}</Text></View>; }
function BreakdownRow({ name, amount, total, color, currency }: { name: string; amount: number; total: number; color: string; currency: CurrencyCode }) {
  const percent = Math.round((amount / total) * 100);
  return <View style={styles.breakdownRow}><View style={styles.breakdownHeading}><Text numberOfLines={1} style={styles.breakdownName}>{name}</Text><Text style={styles.breakdownAmount}>{formatCurrency(amount, currency)} · {percent}%</Text></View><View style={styles.breakdownTrack}><View style={[styles.breakdownFill, { backgroundColor: color, width: `${percent}%` }]} /></View></View>;
}
function BudgetTypeRow({ name, planned, actual, difference, color, currency }: { name: string; planned: number; actual: number; difference: number; color: string; currency: CurrencyCode }) {
  const budgetPercent = planned ? Math.round((actual / planned) * 100) : undefined;
  const status = planned ? difference < 0 ? `${formatCurrency(-difference, currency)} over plan` : `${formatCurrency(difference, currency)} left` : 'No budget set';
  return <View style={styles.bucketRow}><View style={styles.bucketHeading}><Text style={styles.bucketName}>{name}</Text><Text style={styles.bucketActual}>{formatCurrency(actual, currency)} spent</Text></View><Text style={styles.bucketCaption}>{planned ? `${budgetPercent}% of this budget type used · ${formatCurrency(planned, currency)} planned · ${status}` : status}</Text><View style={styles.bucketTrack}><View style={[styles.bucketFill, { backgroundColor: color, width: `${Math.min(budgetPercent ?? 0, 100)}%` }]} /></View></View>;
}
function BudgetCategoryRow({ name, budget, actual, difference, color, currency }: ReturnType<typeof budgetRows>[number] & { color: string; currency: CurrencyCode }) {
  const budgetPercent = budget ? Math.round((actual / budget) * 100) : undefined;
  const status = budget ? difference < 0 ? `${formatCurrency(-difference, currency)} over plan` : `${formatCurrency(difference, currency)} left` : 'No category budget set';
  return <View style={styles.breakdownRow}><View style={styles.breakdownHeading}><Text numberOfLines={1} style={styles.breakdownName}>{name}</Text><Text style={styles.breakdownAmount}>{formatCurrency(actual, currency)} spent</Text></View><Text style={styles.breakdownCaption}>{budget ? `${budgetPercent}% of category budget used · ${formatCurrency(budget, currency)} planned · ${status}` : status}</Text><View style={styles.breakdownTrack}><View style={[styles.breakdownFill, { backgroundColor: color, width: `${Math.min(budgetPercent ?? 0, 100)}%` }]} /></View></View>;
}
function formatCompactCurrency(amount: number, currency: CurrencyCode) {
  const symbol = currency === 'INR' ? '₹' : '$';
  if (amount >= 100000) return `${symbol}${(amount / 100000).toFixed(1)}L`;
  if (amount >= 1000) return `${symbol}${Math.round(amount / 1000)}k`;
  return `${symbol}${Math.round(amount)}`;
}

const styles = StyleSheet.create({
  summary: { flexDirection: 'row', padding: 0, overflow: 'hidden' }, metric: { flex: 1, padding: 15, gap: 6 }, metricDivider: { borderRightWidth: 1, borderRightColor: colors.line }, metricLabel: { color: colors.muted, fontSize: 10, fontWeight: '800', textTransform: 'uppercase' }, metricValue: { color: colors.ink, fontWeight: '900', fontSize: 15 },
  budgetCard: { gap: 10, backgroundColor: colors.mint, borderColor: '#BBDDCB' }, overBudget: { gap: 10, backgroundColor: '#FFF0EB', borderColor: '#F5B6A8' }, budgetHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 }, eyebrow: { color: colors.muted, fontSize: 10, letterSpacing: 1, fontWeight: '900' }, budgetValue: { color: colors.ink, fontSize: 24, fontWeight: '900', marginTop: 2 }, budgetTrack: { height: 10, borderRadius: 8, backgroundColor: 'rgba(25,49,38,.12)', overflow: 'hidden' }, budgetFill: { height: '100%', borderRadius: 8, backgroundColor: colors.forest }, overBudgetFill: { backgroundColor: colors.coral }, budgetCaption: { color: colors.muted, fontSize: 12, fontWeight: '700' },
  trendCard: { gap: 11 }, trendChart: { height: 184, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 7 }, barColumn: { flex: 1, height: '100%', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }, barValue: { color: colors.muted, fontSize: 10, fontWeight: '800', minHeight: 13 }, barArea: { flex: 1, width: '100%', justifyContent: 'flex-end', backgroundColor: '#EEF3EF', borderRadius: 7, overflow: 'hidden' }, bar: { width: '100%', borderRadius: 7 }, barLabel: { color: colors.muted, fontSize: 11, fontWeight: '800' }, chartCaption: { color: colors.muted, fontSize: 12, lineHeight: 18 },
  breakdownCard: { gap: 16 }, breakdownRow: { gap: 7 }, breakdownHeading: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 }, breakdownName: { color: colors.ink, fontWeight: '800', flex: 1 }, breakdownAmount: { color: colors.muted, fontSize: 12, fontWeight: '800' }, breakdownCaption: { color: colors.muted, fontSize: 12, lineHeight: 17 }, breakdownTrack: { height: 9, borderRadius: 9, backgroundColor: '#EEF3EF', overflow: 'hidden' }, breakdownFill: { height: '100%', borderRadius: 9 },
  bucketCard: { gap: 18 }, bucketRow: { gap: 7 }, bucketHeading: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 }, bucketName: { color: colors.ink, fontWeight: '900', fontSize: 15, flex: 1 }, bucketActual: { color: colors.ink, fontWeight: '900', fontSize: 13 }, bucketCaption: { color: colors.muted, fontSize: 12, lineHeight: 17 }, bucketTrack: { height: 8, borderRadius: 8, backgroundColor: '#EEF3EF', overflow: 'hidden' }, bucketFill: { height: '100%', borderRadius: 8 },
  insight: { backgroundColor: '#FFF7D9', borderColor: '#F5E6A9', gap: 6 }, insightEyebrow: { color: '#876D14', fontSize: 10, letterSpacing: 1, fontWeight: '900' }, insightText: { color: colors.ink, fontSize: 15, fontWeight: '800', lineHeight: 21 },
});
