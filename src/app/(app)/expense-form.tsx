import { router, useLocalSearchParams } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useEffect, useState } from 'react';
import { Alert, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Button, EmptyState, Field, Header, Screen, Selector } from '@/components/ui';
import { calculateAmount, today } from '@/lib/format';
import { friendlyError } from '@/lib/errors';
import { validateExpense } from '@/lib/validation';
import { useMaster, useProjects } from '@/hooks/use-project-data';
import { expenseRepository } from '@/repositories/expense-repository';
import { useApp } from '@/providers/app-provider';
import type { CostBucket, Expense } from '@/types/domain';

const decimalValue = (value: string) => value && value !== '.' ? Number(value) : undefined;
const isDecimalDraft = (value: string) => /^\d*(?:\.\d*)?$/.test(value);
const costBuckets: { id: CostBucket; name: string }[] = [
  { id: 'construction', name: 'Construction work' },
  { id: 'other', name: 'Other project cost' },
];
const dateFromString = (value?: string) => {
  const [year, month, day] = (value || today()).split('-').map(Number);
  return new Date(year, month - 1, day);
};
const dateToString = (value: Date) => [value.getFullYear(), String(value.getMonth() + 1).padStart(2, '0'), String(value.getDate()).padStart(2, '0')].join('-');

export default function ExpenseForm() {
  const { id } = useLocalSearchParams<{ id?: string }>(); const { user, profile } = useApp();
  const projects = useProjects(user?.uid); const selected = projects.find((item) => item.id === profile?.selectedProjectId) ?? projects[0];
  const [form, setForm] = useState<Partial<Expense>>({ projectId: selected?.id, costBucket: 'construction', date: today(), item: '', description: '', notes: '' });
  const activeProject = projects.find((project) => project.id === form.projectId) ?? selected;
  const categories = useMaster(form.projectId, 'categories'); const stages = useMaster(form.projectId, 'stages'); const units = useMaster(form.projectId, 'units');
  const paidBy = useMaster(form.projectId, 'paymentMethods'); const fundingSources = useMaster(form.projectId, 'fundingSources'); const statuses = useMaster(form.projectId, 'paymentStatuses'); const vendors = useMaster(form.projectId, 'vendors');
  const [errors, setErrors] = useState<Record<string, string>>({}); const [loading, setLoading] = useState(Boolean(id)); const [saving, setSaving] = useState(false); const [showDatePicker, setShowDatePicker] = useState(false); const [quantityText, setQuantityText] = useState(''); const [rateText, setRateText] = useState(''); const [amountText, setAmountText] = useState('');
  const canEdit = Boolean(activeProject && activeProject.status === 'active' && user && ['admin', 'editor'].includes(activeProject.role));
  useEffect(() => { if (selected && !form.projectId) setForm((current) => ({ ...current, projectId: selected.id })); }, [selected?.id]);
  useEffect(() => { if (!id || !user) return; expenseRepository.get(user.uid, id).then((expense) => { if (expense) { setForm(expense); setQuantityText(expense.quantity?.toString() ?? ''); setRateText(expense.rate?.toString() ?? ''); setAmountText(expense.amount?.toString() ?? ''); } setLoading(false); }); }, [id, user?.uid]);
  const set = <K extends keyof Expense>(key: K, value: Expense[K]) => setForm((current) => ({ ...current, [key]: value }));
  const computed = calculateAmount(form.quantity, form.rate, Number(form.amount) || 0); const usesRate = form.quantity !== undefined || form.rate !== undefined;
  const save = async (another = false) => {
    if (!user || !form.projectId) return;
    const draft = { ...form, costBucket: form.costBucket ?? 'construction', amount: usesRate ? computed : Number(form.amount) } as Partial<Expense>;
    const nextErrors = validateExpense(draft); setErrors(nextErrors); if (Object.keys(nextErrors).length) return;
    setSaving(true);
    try {
      if (id) await expenseRepository.update(user.uid, id, draft);
      else await expenseRepository.create(user.uid, draft as Omit<Expense, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'>);
      if (another) { setForm({ projectId: form.projectId, costBucket: form.costBucket ?? 'construction', date: today(), item: '', description: '', notes: '' }); setQuantityText(''); setRateText(''); setAmountText(''); setErrors({}); Alert.alert('Saved', 'Ready for the next expense.'); } else router.back();
    } catch (error) { Alert.alert('Unable to save expense', friendlyError(error, 'Please check your connection and try again.')); } finally { setSaving(false); }
  };
  if (loading) return <Screen><Header title="Loading expense" /></Screen>;
  if (!activeProject) return <Screen><EmptyState title="No project selected" body="Choose a project before adding an expense." /></Screen>;
  if (!canEdit) return <Screen><Header title="Expenses" /><EmptyState title={activeProject.status === 'archived' ? 'Project archived' : 'View-only access'} body={activeProject.status === 'archived' ? 'This project is read-only until an admin reactivates it.' : 'Your role can view expenses but cannot create or edit them.'} /></Screen>;
  return <Screen><Header title={id ? 'Edit expense' : 'Add expense'} subtitle="The essentials first — details when you have them." />
    <View style={styles.dateField}><Text style={styles.dateLabel}>Date</Text><Pressable onPress={() => setShowDatePicker(true)} style={[styles.dateInput, errors.date && styles.dateInputError]}><Text style={styles.dateValue}>{form.date}</Text><Text style={styles.dateAction}>Change</Text></Pressable>{errors.date ? <Text style={styles.dateError}>{errors.date}</Text> : null}{showDatePicker ? <DateTimePicker value={dateFromString(form.date)} mode="date" display={Platform.OS === 'ios' ? 'spinner' : 'default'} onChange={(event, value) => { if (Platform.OS !== 'ios') setShowDatePicker(false); if (event.type === 'set' && value) set('date', dateToString(value)); }} /> : null}</View>
    <Selector label="Cost bucket" value={form.costBucket ?? 'construction'} options={costBuckets} onChange={(value) => set('costBucket', value as CostBucket)} />
    <Text style={styles.bucketHelp}>Use Other project cost for permits, professional fees, temporary services, finance charges, furnishings, and similar non-construction spending.</Text>
    <Selector label="Stage" value={form.stageId} options={stages} onChange={(value) => set('stageId', value)} error={errors.stageId} />
    <Selector label="Category" value={form.categoryId} options={categories} onChange={(value) => set('categoryId', value)} error={errors.categoryId} />
    <Field label="What did you buy or pay for?" value={form.item} onChangeText={(value) => set('item', value)} error={errors.item} placeholder="e.g. ACC cement" />
    <View style={styles.measurements}>
      <View style={styles.measurementPair}>
        <View style={styles.measurementColumn}><Field label="Quantity" value={quantityText} onChangeText={(value) => { if (isDecimalDraft(value)) { setQuantityText(value); set('quantity', decimalValue(value)); } }} keyboardType="decimal-pad" placeholder="50 or 2.5" /></View>
        <View style={styles.measurementColumn}><Selector label="Unit" value={form.unitId} options={units} onChange={(value) => set('unitId', value)} /></View>
      </View>
      <Field label="Rate" value={rateText} onChangeText={(value) => { if (isDecimalDraft(value)) { setRateText(value); set('rate', decimalValue(value)); } }} keyboardType="decimal-pad" placeholder="420 or 420.50" />
    </View>
    <Field label={usesRate ? `Amount (calculated: ${computed})` : 'Amount'} value={usesRate ? String(computed) : amountText} onChangeText={(value) => { if (!usesRate && isDecimalDraft(value)) { setAmountText(value); set('amount', decimalValue(value) ?? 0); } }} editable={!usesRate} error={errors.amount} keyboardType="decimal-pad" placeholder="0 or 250.50" />
    <Selector label="Paid by" value={form.paidById} options={paidBy} onChange={(value) => set('paidById', value)} error={errors.paidById} />
    <Selector label="Funding source" value={form.fundingSourceId} options={fundingSources} onChange={(value) => set('fundingSourceId', value)} error={errors.fundingSourceId} />
    <Selector label="Payment status" value={form.paymentStatusId} options={statuses} onChange={(value) => set('paymentStatusId', value)} error={errors.paymentStatusId} />
    <Selector label="Vendor (optional)" value={form.vendorId} options={vendors} onChange={(value) => set('vendorId', value)} />
    <Field label="Notes (optional)" value={form.notes} onChangeText={(value) => set('notes', value)} multiline style={styles.notes} placeholder="Foundation work" />
    <Button loading={saving} onPress={() => save(false)}>{id ? 'Save changes' : 'Save expense'}</Button>
    {!id ? <Button variant="secondary" disabled={saving} onPress={() => save(true)}>Save & add another</Button> : null}
  </Screen>;
}
const styles = StyleSheet.create({ dateField: { gap: 7 }, dateLabel: { color: '#193126', fontWeight: '700', fontSize: 13 }, dateInput: { backgroundColor: 'white', borderColor: '#DCE5DE', borderWidth: 1, minHeight: 50, borderRadius: 14, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, dateInputError: { borderColor: '#E7725B' }, dateValue: { color: '#193126', fontSize: 16 }, dateAction: { color: '#1E6B47', fontWeight: '800', fontSize: 13 }, dateError: { color: '#E7725B', fontSize: 12 }, bucketHelp: { color: '#68746D', fontSize: 12, lineHeight: 17, marginTop: -10 }, measurements: { gap: 12 }, measurementPair: { flexDirection: 'row', gap: 12 }, measurementColumn: { flex: 1 }, notes: { minHeight: 88, paddingTop: 13, textAlignVertical: 'top' } });
