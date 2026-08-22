import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { AuditText, Button, Card, EmptyState, Header, Pill, Screen, SectionTitle } from '@/components/ui';
import { ProjectPicker } from '@/components/project-picker';
import { colors } from '@/constants/design';
import { bucketTotal, budgetRows, expenseTotal } from '@/lib/analytics';
import { formatCurrency } from '@/lib/format';
import { useBudget, useExpenses, useMaster, useProjects } from '@/hooks/use-project-data';
import { useApp } from '@/providers/app-provider';

export default function BudgetScreen() {
  const { user, profile, currency } = useApp(); const projects = useProjects(user?.uid); const project = projects.find((item) => item.id === profile?.selectedProjectId) ?? projects[0];
  const { items: expenses } = useExpenses(user?.uid, project?.id); const categories = useMaster(project?.id, 'categories'); const budget = useBudget(user?.uid, project?.id);
  if (!project) return <Screen><EmptyState title="Create a project first" body="Budgets belong to a construction project." action={<Button onPress={() => router.push('/(app)/project-form')}>Create project</Button>} /></Screen>;
  const total = budget?.totalBudget ?? project.totalBudget;
  const constructionBudget = budget?.constructionBudget ?? total;
  const otherBudget = budget?.otherBudget ?? 0;
  const totalSpent = expenseTotal(expenses);
  const constructionSpent = bucketTotal(expenses, 'construction');
  const otherSpent = bucketTotal(expenses, 'other');
  const overrun = Math.max(totalSpent - total, 0); const isOverBudget = Boolean(total && overrun > 0); const constructionRows = budgetRows(budget, expenses, categories, 'construction'); const otherRows = budgetRows(budget, expenses, categories, 'other');
  const canPlan = Boolean(project.status === 'active' && user && project.role === 'admin');
  const setBudget = () => router.push('/(app)/budget-form');
  return <Screen><Header title="Budget" subtitle={project.status === 'archived' ? 'Archived project · view only.' : 'Construction and other costs, clearly separated.'} right={<ProjectPicker projects={projects} />} />
    {total ? <><Card style={isOverBudget ? styles.overrunSummary : styles.summary}><Text style={styles.label}>{isOverBudget ? 'TOTAL BUDGET EXCEEDED' : 'TOTAL AVAILABLE TO SPEND'}</Text><Text style={styles.remaining}>{isOverBudget ? `${formatCurrency(overrun, currency)} over` : formatCurrency(Math.max(total - totalSpent, 0), currency)}</Text><View style={styles.summaryLine}><Text style={styles.spent}>Spent {formatCurrency(totalSpent, currency)}</Text><Text style={styles.spent}>of {formatCurrency(total, currency)}</Text></View><View style={styles.track}><View style={[styles.fill, isOverBudget && styles.overrunFill, { width: `${Math.min((totalSpent / total) * 100, 100)}%` }]} /></View></Card>
      <View style={styles.bucketGrid}><BucketCard title="Construction" planned={constructionBudget} spent={constructionSpent} currency={currency} /><BucketCard title="Other project costs" planned={otherBudget} spent={otherSpent} currency={currency} /></View>
      {isOverBudget ? <Card style={styles.warning}><Text style={styles.warningTitle}>Your project is over budget</Text><Text style={styles.warningText}>Spending is {formatCurrency(overrun, currency)} above the planned total. Review either bucket before revising the plan.</Text>{canPlan ? <Button variant="secondary" onPress={setBudget}>Review budget</Button> : null}</Card> : null}</> : <EmptyState icon="◔" title={project.status === 'archived' ? 'No budget recorded' : 'Set your first budget'} body={project.status === 'archived' ? 'This archived project has no budget and remains view-only.' : 'Plan construction and other project costs independently, then compare them with actual spending.'} action={canPlan ? <Button onPress={setBudget}>Set budget</Button> : undefined} />}
    {budget ? <AuditText updatedBy={budget.updatedBy} /> : null}{total ? <><SectionTitle title="Construction category budgets" action={constructionRows.length ? 'Budget vs actual' : undefined} /><CategoryRows rows={constructionRows} empty="No construction category allocations yet. Add them to spot overruns early." currency={currency} />
      <SectionTitle title="Other project costs" action={otherRows.length ? 'Budget vs actual' : undefined} /><CategoryRows rows={otherRows} empty="No other project cost allocations yet. Add approvals, consultants, furnishings, or similar categories to track them separately." currency={currency} />
      {canPlan ? <Button variant="secondary" onPress={setBudget}>Edit budget</Button> : null}</> : null}
  </Screen>;
}

function BucketCard({ title, planned, spent, currency }: { title: string; planned: number; spent: number; currency: 'INR' | 'USD' }) {
  const over = Math.max(spent - planned, 0); const remaining = Math.max(planned - spent, 0); const hasPlan = planned > 0;
  return <Card style={{ ...styles.bucket, ...(over > 0 ? styles.bucketOver : {}) }}><Text style={styles.bucketLabel}>{title.toUpperCase()}</Text><Text style={styles.bucketAmount}>{hasPlan ? formatCurrency(over ? over : remaining, currency) : formatCurrency(spent, currency)}</Text><Text style={styles.bucketCaption}>{hasPlan ? over ? 'over budget' : 'remaining' : 'spent · no plan'}</Text><Text style={styles.bucketSpent}>{formatCurrency(spent, currency)} of {formatCurrency(planned, currency)}</Text></Card>;
}

function CategoryRows({ rows, empty, currency }: { rows: ReturnType<typeof budgetRows>; empty: string; currency: 'INR' | 'USD' }) {
  return rows.length ? <Card style={styles.rows}>{rows.map((row) => <View key={row.categoryId} style={styles.row}><View style={styles.rowInfo}><Text numberOfLines={2} style={styles.rowName}>{row.name}</Text><Text numberOfLines={1} style={styles.rowSub}>{formatCurrency(row.actual, currency)} spent of {formatCurrency(row.budget, currency)}</Text></View><Pill style={styles.rowPill} tone={row.difference < 0 ? 'coral' : row.actual / row.budget > .8 ? 'amber' : 'green'}>{row.difference < 0 ? `${formatCurrency(-row.difference, currency)} over` : `${formatCurrency(row.difference, currency)} left`}</Pill></View>)}</Card> : <Card><Text style={styles.emptyText}>{empty}</Text></Card>;
}

const styles = StyleSheet.create({ summary: { backgroundColor: colors.forest, borderColor: colors.forest, gap: 9 }, overrunSummary: { backgroundColor: colors.coral, borderColor: colors.coral, gap: 9 }, label: { color: '#FFF6F3', fontSize: 11, letterSpacing: .9, fontWeight: '900' }, remaining: { color: 'white', fontSize: 32, fontWeight: '900' }, summaryLine: { flexDirection: 'row', justifyContent: 'space-between' }, spent: { color: '#FFF6F3', fontSize: 12, fontWeight: '700' }, track: { height: 7, borderRadius: 4, backgroundColor: 'rgba(255,255,255,.34)', overflow: 'hidden' }, fill: { height: '100%', backgroundColor: colors.lime }, overrunFill: { backgroundColor: '#8B2E1F' }, bucketGrid: { flexDirection: 'row', gap: 12 }, bucket: { flex: 1, padding: 14, gap: 3, backgroundColor: colors.mint }, bucketOver: { backgroundColor: '#FFF0EB', borderColor: '#F5B6A8' }, bucketLabel: { color: colors.muted, fontSize: 9, letterSpacing: .5, fontWeight: '900' }, bucketAmount: { color: colors.ink, fontSize: 19, fontWeight: '900' }, bucketCaption: { color: colors.muted, fontSize: 11, fontWeight: '700' }, bucketSpent: { color: colors.ink, fontSize: 10, marginTop: 4, fontWeight: '700' }, warning: { backgroundColor: '#FFF0EB', borderColor: '#F5B6A8', gap: 8 }, warningTitle: { color: '#8B2E1F', fontSize: 16, fontWeight: '900' }, warningText: { color: colors.ink, lineHeight: 19, fontSize: 13 }, rows: { gap: 16 }, row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10, width: '100%' }, rowInfo: { flex: 1, flexShrink: 1, minWidth: 0 }, rowPill: { flexShrink: 1, maxWidth: '42%' }, rowName: { color: colors.ink, fontWeight: '900', fontSize: 15 }, rowSub: { color: colors.muted, fontSize: 12, marginTop: 3 }, emptyText: { color: colors.muted, lineHeight: 20 } });
