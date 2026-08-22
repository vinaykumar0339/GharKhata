import DateTimePicker from '@react-native-community/datetimepicker';
import { router } from 'expo-router';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Button, Card, EmptyState, Header, Pill, Screen, SectionTitle } from '@/components/ui';
import { ProjectPicker } from '@/components/project-picker';
import { colors } from '@/constants/design';
import { categoryTotals, expenseTotal } from '@/lib/analytics';
import { formatCurrency, formatDate, today } from '@/lib/format';
import { useBudget, useExpenses, useMaster, useProjects } from '@/hooks/use-project-data';
import { useApp } from '@/providers/app-provider';
import type { Expense } from '@/types/domain';

type Period = 'today' | 'this-month' | 'last-month' | 'last-6-months' | 'custom';
const periods: { id: Period; label: string }[] = [{ id: 'today', label: 'Today' }, { id: 'this-month', label: 'This month' }, { id: 'last-month', label: 'Last month' }, { id: 'last-6-months', label: 'Last 6 months' }, { id: 'custom', label: 'Custom' }];
const dateKey = (date: Date) => [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-');
const dateFromKey = (value: string) => new Date(`${value}T12:00:00`);
const firstOfMonth = (date: Date) => dateKey(new Date(date.getFullYear(), date.getMonth(), 1));
const lastOfMonth = (date: Date) => dateKey(new Date(date.getFullYear(), date.getMonth() + 1, 0));

function rangeFor(period: Period, from: string, to: string) {
  const current = dateFromKey(today());
  if (period === 'today') return { from: today(), to: today(), label: 'Today' };
  if (period === 'this-month') return { from: firstOfMonth(current), to: today(), label: 'This month' };
  if (period === 'last-month') { const previous = new Date(current.getFullYear(), current.getMonth() - 1, 1); return { from: firstOfMonth(previous), to: lastOfMonth(previous), label: 'Last month' }; }
  if (period === 'last-6-months') return { from: firstOfMonth(new Date(current.getFullYear(), current.getMonth() - 5, 1)), to: today(), label: 'Last 6 months' };
  return { from, to, label: 'Custom range' };
}

export default function Dashboard() {
  const { user, profile, currency } = useApp(); const projects = useProjects(user?.uid);
  const selected = projects.find((item) => item.id === profile?.selectedProjectId) ?? projects[0];
  const { items: expenses } = useExpenses(user?.uid, selected?.id); const budget = useBudget(user?.uid, selected?.id);
  const categories = useMaster(selected?.id, 'categories'); const statuses = useMaster(selected?.id, 'paymentStatuses');
  const [period, setPeriod] = useState<Period>('this-month'); const [from, setFrom] = useState(today()); const [to, setTo] = useState(today()); const [picking, setPicking] = useState<'from' | 'to'>();
  if (!selected) return <Screen><Header title="GharKhata" /><EmptyState icon="⌂" title="Start with your project" body="Create your first construction project to see spending and budget health here." action={<Button onPress={() => router.push('/(app)/project-form')}>Create project</Button>} /></Screen>;
  const canEdit = Boolean(selected.status === 'active' && user && ['admin', 'editor'].includes(selected.role));
  const canPlan = Boolean(selected.status === 'active' && user && selected.role === 'admin');
  const range = rangeFor(period, from, to);
  const periodExpenses = range.from <= range.to ? expenses.filter((expense) => expense.date >= range.from && expense.date <= range.to) : [];
  const spent = expenseTotal(expenses); const totalBudget = budget?.totalBudget || selected.totalBudget; const overrun = Math.max(spent - totalBudget, 0); const isOverBudget = Boolean(totalBudget && overrun > 0); const remaining = Math.max(totalBudget - spent, 0); const percentage = totalBudget ? Math.min(Math.round((spent / totalBudget) * 100), 100) : 0;
  const todaySpend = expenseTotal(expenses.filter((expense) => expense.date === today())); const periodSpend = expenseTotal(periodExpenses); const pending = periodExpenses.filter((item) => statuses.find((status) => status.id === item.paymentStatusId)?.name !== 'Paid').reduce((sum, item) => sum + item.amount, 0); const topCategories = categoryTotals(periodExpenses, categories).slice(0, 3);
  const choosePeriod = (next: Period) => { setPeriod(next); if (next === 'custom') return; const nextRange = rangeFor(next, from, to); setFrom(nextRange.from); setTo(nextRange.to); };
  const updateDate = (edge: 'from' | 'to', value: Date) => { const next = dateKey(value); if (edge === 'from') setFrom(next); else setTo(next); setPeriod('custom'); };
  return <Screen><Header title="Good day" subtitle={selected.status === 'archived' ? 'Archived project · view only.' : 'Here’s your construction at a glance.'} right={<ProjectPicker projects={projects} />} />
    <Card style={{ ...styles.hero, ...(isOverBudget ? styles.overrunHero : {}) }}><View style={styles.heroTop}><View><Text style={styles.heroLabel}>{isOverBudget ? 'BUDGET EXCEEDED' : 'TOTAL SPENT'}</Text><Text style={styles.heroAmount}>{isOverBudget ? `${formatCurrency(overrun, currency)} over` : formatCurrency(spent, currency)}</Text></View><Pill tone={isOverBudget ? 'coral' : percentage > 90 ? 'amber' : 'green'}>{totalBudget ? isOverBudget ? 'Over budget' : `${percentage}% of budget` : 'No budget set'}</Pill></View><View style={styles.progressTrack}><View style={[styles.progress, isOverBudget && styles.overrunProgress, { width: `${percentage}%` }]} /></View><View style={styles.heroFoot}><Text style={styles.heroFootText}>{isOverBudget ? 'Total spent' : 'Remaining'}</Text><Text style={styles.heroFootAmount}>{totalBudget ? isOverBudget ? formatCurrency(spent, currency) : formatCurrency(remaining, currency) : 'Set a budget'}</Text></View></Card>
    {isOverBudget ? <Card style={styles.warning}><Text style={styles.warningTitle}>Your project has exceeded its budget</Text><Text style={styles.warningText}>{formatCurrency(overrun, currency)} is over the budget. Review the plan or upcoming expenses.</Text>{canPlan ? <Button variant="secondary" onPress={() => router.push('/(app)/budget-form')}>Review budget</Button> : null}</Card> : null}
    <SectionTitle title="Spending period" action={range.label} />
    <View style={styles.periods}>{periods.map((item) => <Pressable key={item.id} onPress={() => choosePeriod(item.id)} style={[styles.period, period === item.id && styles.periodActive]}><Text style={[styles.periodText, period === item.id && styles.periodTextActive]}>{item.label}</Text></Pressable>)}</View>
    {period === 'custom' ? <Card style={styles.dateRange}><DateControl label="From" value={from} currency={currency} onPress={() => setPicking('from')} /><DateControl label="To" value={to} currency={currency} onPress={() => setPicking('to')} />{from > to ? <Text style={styles.rangeError}>The start date must be on or before the end date.</Text> : null}</Card> : null}
    {picking ? <DateTimePicker value={dateFromKey(picking === 'from' ? from : to)} mode="date" display={Platform.OS === 'ios' ? 'spinner' : 'default'} onChange={(event, value) => { if (Platform.OS !== 'ios') setPicking(undefined); if (event.type === 'set' && value) updateDate(picking, value); }} /> : null}
    <View style={styles.metricRow}><Metric label="Today" value={formatCurrency(todaySpend, currency)} /><Metric label={range.label} value={formatCurrency(periodSpend, currency)} /></View>
    <Metric label={`Pending · ${range.label}`} value={formatCurrency(pending, currency)} />
    {canEdit ? <View style={styles.addRow}><View><Text style={styles.addTitle}>Log today’s spend</Text><Text style={styles.addSub}>Takes less than a minute.</Text></View><Button onPress={() => router.push('/(app)/expense-form')}>＋ Add expense</Button></View> : <Text style={styles.viewer}>{selected.status === 'archived' ? 'This archived project is read-only.' : 'You have view-only access to this project.'}</Text>}
    <SectionTitle title="Where money is going" action={periodExpenses.length ? range.label : undefined} />{topCategories.length ? <Card style={styles.breakdown}>{topCategories.map((item) => <View key={item.id} style={styles.breakRow}><View style={styles.breakName}><View style={styles.dot} /><Text style={styles.breakText}>{item.name}</Text></View><Text style={styles.breakAmount}>{formatCurrency(item.amount, currency)}</Text></View>)}</Card> : <EmptyState icon="◌" title="No expenses in this period" body="Choose a different range or add an expense to see this breakdown." />}</Screen>;
}

function DateControl({ label, value, currency, onPress }: { label: string; value: string; currency: 'INR' | 'USD'; onPress: () => void }) { return <Pressable onPress={onPress} style={styles.dateControl}><View><Text style={styles.dateLabel}>{label.toUpperCase()}</Text><Text style={styles.dateValue}>{formatDate(value, currency)}</Text></View><Text style={styles.dateChange}>Change</Text></Pressable>; }
function Metric({ label, value }: { label: string; value: string }) { return <Card style={styles.metric}><Text style={styles.metricLabel}>{label.toUpperCase()}</Text><Text numberOfLines={1} style={styles.metricValue}>{value}</Text></Card>; }

const styles = StyleSheet.create({ hero: { backgroundColor: colors.forest, borderColor: colors.forest, gap: 17 }, overrunHero: { backgroundColor: colors.coral, borderColor: colors.coral }, heroTop: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 }, heroLabel: { color: '#FFF6F3', fontWeight: '800', letterSpacing: 1, fontSize: 11 }, heroAmount: { color: 'white', fontWeight: '900', letterSpacing: -.8, fontSize: 31, marginTop: 4 }, progressTrack: { height: 8, backgroundColor: 'rgba(255,255,255,.28)', borderRadius: 8, overflow: 'hidden' }, progress: { height: '100%', backgroundColor: colors.lime, borderRadius: 8 }, overrunProgress: { backgroundColor: '#8B2E1F' }, heroFoot: { flexDirection: 'row', justifyContent: 'space-between' }, heroFootText: { color: '#FFF6F3', fontWeight: '700' }, heroFootAmount: { color: 'white', fontWeight: '800' }, warning: { backgroundColor: '#FFF0EB', borderColor: '#F5B6A8', gap: 8 }, warningTitle: { color: '#8B2E1F', fontWeight: '900', fontSize: 16 }, warningText: { color: colors.ink, fontSize: 13, lineHeight: 19 }, periods: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: -8 }, period: { backgroundColor: colors.slate, paddingHorizontal: 12, paddingVertical: 9, borderRadius: 18 }, periodActive: { backgroundColor: colors.forest }, periodText: { color: colors.ink, fontSize: 12, fontWeight: '800' }, periodTextActive: { color: 'white' }, dateRange: { gap: 10 }, dateControl: { minHeight: 48, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: colors.line, paddingBottom: 10 }, dateLabel: { color: colors.muted, fontSize: 10, fontWeight: '900', letterSpacing: .7 }, dateValue: { color: colors.ink, fontSize: 15, fontWeight: '800', marginTop: 2 }, dateChange: { color: colors.forest, fontSize: 13, fontWeight: '900' }, rangeError: { color: colors.coral, fontSize: 12 }, metricRow: { flexDirection: 'row', gap: 12 }, metric: { flex: 1, padding: 15, gap: 6 }, metricLabel: { fontSize: 10, letterSpacing: .7, color: colors.muted, fontWeight: '800' }, metricValue: { color: colors.ink, fontWeight: '900', fontSize: 17 }, addRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, alignItems: 'center', paddingVertical: 4 }, addTitle: { color: colors.ink, fontWeight: '900', fontSize: 17 }, addSub: { color: colors.muted, fontSize: 13, marginTop: 3 }, viewer: { color: colors.muted, textAlign: 'center', fontSize: 13 }, breakdown: { gap: 16 }, breakRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 }, breakName: { flexDirection: 'row', alignItems: 'center', gap: 9, flex: 1 }, dot: { width: 9, height: 9, borderRadius: 9, backgroundColor: colors.forest }, breakText: { color: colors.ink, fontWeight: '700', flexShrink: 1 }, breakAmount: { color: colors.ink, fontWeight: '900' } });
