import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { AuditText, Button, Card, Header, LoadingState, Pill, Screen, SectionTitle } from '@/components/ui';
import { colors } from '@/constants/design';
import { formatCurrency, formatDate } from '@/lib/format';
import { useMaster, useProjects } from '@/hooks/use-project-data';
import { expenseRepository } from '@/repositories/expense-repository';
import { useApp } from '@/providers/app-provider';
import type { Expense } from '@/types/domain';

export default function ExpenseDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user, profile, currency } = useApp();
  const projects = useProjects(user?.uid);
  const selected = projects.find((project) => project.id === profile?.selectedProjectId) ?? projects[0];
  const [expense, setExpense] = useState<Expense>();
  const [busy, setBusy] = useState(false);
  const project = projects.find((item) => item.id === expense?.projectId) ?? selected;
  const categories = useMaster(expense?.projectId, 'categories');
  const stages = useMaster(expense?.projectId, 'stages');
  const units = useMaster(expense?.projectId, 'units');
  const methods = useMaster(expense?.projectId, 'paymentMethods');
  const statuses = useMaster(expense?.projectId, 'paymentStatuses');
  const vendors = useMaster(expense?.projectId, 'vendors');
  const canEdit = Boolean(project && project.status === 'active' && user && ['admin', 'editor'].includes(project.role));

  useEffect(() => { if (user) expenseRepository.get(user.uid, id).then(setExpense); }, [id, user?.uid]);
  if (!expense) return <Screen><LoadingState /></Screen>;

  const name = (items: { id: string; name: string }[], value?: string) => items.find((item) => item.id === value)?.name ?? '—';
  const remove = () => Alert.alert('Delete expense?', 'This expense will be permanently deleted.', [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Delete', style: 'destructive', onPress: async () => {
      if (!user) return;
      setBusy(true);
      try { await expenseRepository.delete(user.uid, expense); router.back(); }
      catch { Alert.alert('Could not delete expense', 'Please try again.'); }
      finally { setBusy(false); }
    } },
  ]);

  const details = [
    ['Cost bucket', expense.costBucket === 'other' ? 'Other project cost' : 'Construction work'],
    ['Stage', name(stages, expense.stageId)],
    ['Category', name(categories, expense.categoryId)],
    ['Quantity', expense.quantity !== undefined ? `${expense.quantity} ${name(units, expense.unitId)}` : '—'],
    ['Rate', expense.rate ? formatCurrency(expense.rate, currency) : '—'],
    ['Paid by', name(methods, expense.paidById)],
    ['Vendor', name(vendors, expense.vendorId)],
  ];

  return <Screen>
    <Header title="Expense details" subtitle={project?.status === 'archived' ? `${formatDate(expense.date, currency)} · Archived project` : formatDate(expense.date, currency)} right={<Pill tone={name(statuses, expense.paymentStatusId) === 'Paid' ? 'green' : 'amber'}>{name(statuses, expense.paymentStatusId)}</Pill>} />
    <Card style={styles.amountCard}>
      <Text style={styles.item}>{expense.item}</Text>
      <Text style={styles.amount}>{formatCurrency(expense.amount, currency)}</Text>
      <Text style={styles.description}>{expense.description || expense.notes || 'No notes added.'}</Text>
      <AuditText createdBy={expense.createdBy} updatedBy={expense.updatedBy} />
    </Card>
    <SectionTitle title="Details" />
    <Card style={styles.details}>{details.map(([label, value]) => <View key={label} style={styles.detailRow}><Text style={styles.detailLabel}>{label}</Text><Text style={styles.detailValue}>{value}</Text></View>)}</Card>
    {canEdit ? <><Button onPress={() => router.push({ pathname: '/(app)/expense-form', params: { id: expense.id } })}>Edit expense</Button><Button loading={busy} variant="danger" onPress={remove}>Delete expense</Button></> : <Text style={styles.viewer}>{project?.status === 'archived' ? 'This archived project is read-only.' : 'You have view-only access to this project.'}</Text>}
  </Screen>;
}

const styles = StyleSheet.create({
  amountCard: { backgroundColor: colors.mint, gap: 7 }, item: { color: colors.ink, fontSize: 18, fontWeight: '900' }, amount: { color: colors.forest, fontSize: 32, fontWeight: '900', letterSpacing: -.7 }, description: { color: colors.muted, fontSize: 13, lineHeight: 19 }, details: { gap: 14 }, detailRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 16 }, detailLabel: { color: colors.muted, fontSize: 14 }, detailValue: { color: colors.ink, fontSize: 14, fontWeight: '800', textAlign: 'right', flexShrink: 1 }, viewer: { color: colors.muted, textAlign: 'center', fontSize: 13 },
});
