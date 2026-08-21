import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { AuditText, Button, Card, EmptyState, Header, Pill, Screen, Selector } from '@/components/ui';
import { ProjectPicker } from '@/components/project-picker';
import { colors } from '@/constants/design';
import { formatCurrency, formatDate } from '@/lib/format';
import { useExpenses, useMaster, useProjects } from '@/hooks/use-project-data';
import { useApp } from '@/providers/app-provider';
import type { ExpenseFilters } from '@/types/domain';

export default function Expenses() {
  const { user, profile, currency } = useApp();
  const projects = useProjects(user?.uid);
  const selected = projects.find((item) => item.id === profile?.selectedProjectId) ?? projects[0];
  const [filters, setFilters] = useState<ExpenseFilters>({ sort: 'newest' });
  const [showFilter, setShowFilter] = useState(false);
  const { items } = useExpenses(user?.uid, selected?.id, filters);
  const categories = useMaster(selected?.id, 'categories');
  const stages = useMaster(selected?.id, 'stages');
  const vendors = useMaster(selected?.id, 'vendors');
  const statuses = useMaster(selected?.id, 'paymentStatuses');
  const canEdit = Boolean(selected && selected.status === 'active' && user && (selected.ownerId === user.uid || ['admin', 'editor'].includes(selected.memberRoles[user.uid])));
  const category = (id: string) => categories.find((item) => item.id === id)?.name ?? 'Uncategorized';
  const stage = (id: string) => stages.find((item) => item.id === id)?.name ?? 'No stage';
  const status = (id: string) => statuses.find((item) => item.id === id)?.name ?? 'Unknown';
  const activeCount = Object.entries(filters).filter(([key, value]) => key !== 'sort' && value).length;

  return <Screen>
    <Header title="Expenses" subtitle={`${items.length} recorded`} right={selected ? <ProjectPicker projects={projects} /> : undefined} />
    <View style={styles.searchRow}>
      <TextInput value={filters.search ?? ''} onChangeText={(search) => setFilters((current) => ({ ...current, search }))} placeholder="Search items or notes" placeholderTextColor="#94A19A" style={styles.search} />
      <Pressable onPress={() => setShowFilter(!showFilter)} style={styles.filter}><Text style={styles.filterText}>Filter{activeCount ? ` · ${activeCount}` : ''}</Text></Pressable>
    </View>
    {showFilter ? <Card style={styles.filters}>
      <Selector label="Category" value={filters.categoryId} options={categories} onChange={(categoryId) => setFilters((current) => ({ ...current, categoryId }))} />
      <Selector label="Stage" value={filters.stageId} options={stages} onChange={(stageId) => setFilters((current) => ({ ...current, stageId }))} />
      <Selector label="Vendor" value={filters.vendorId} options={vendors} onChange={(vendorId) => setFilters((current) => ({ ...current, vendorId }))} />
      <Selector label="Payment status" value={filters.paymentStatusId} options={statuses} onChange={(paymentStatusId) => setFilters((current) => ({ ...current, paymentStatusId }))} />
      <View style={styles.filterActions}><Button variant="ghost" style={styles.half} onPress={() => setFilters({ sort: 'newest' })}>Clear</Button><Button style={styles.half} onPress={() => setShowFilter(false)}>Apply</Button></View>
    </Card> : null}
    {activeCount ? <View style={styles.chips}><Pill>{activeCount} filter{activeCount > 1 ? 's' : ''} active</Pill><Pressable onPress={() => setFilters({ sort: filters.sort })}><Text style={styles.clear}>Clear all</Text></Pressable></View> : null}
    {items.length ? <View style={styles.list}>{items.map((expense) => <Pressable key={expense.id} onPress={() => router.push({ pathname: '/(app)/expense/[id]', params: { id: expense.id } })}>
      <Card style={styles.row}><View style={styles.rowMain}><Text style={styles.item}>{expense.item}</Text><Text style={styles.meta}>{category(expense.categoryId)} · {stage(expense.stageId)}</Text><Text style={styles.date}>{formatDate(expense.date, currency)}</Text><AuditText createdByName={expense.createdByName} updatedByName={expense.updatedByName} /></View><View style={styles.rowAmount}><Text style={styles.amount}>{formatCurrency(expense.amount, currency)}</Text><Pill tone={status(expense.paymentStatusId) === 'Paid' ? 'green' : 'amber'}>{status(expense.paymentStatusId)}</Pill></View></Card>
    </Pressable>)}</View> : <EmptyState icon="◌" title="No expenses found" body={activeCount ? 'Try clearing a filter or searching for something else.' : 'Track your first construction expense to make your budget useful.'} action={!activeCount && canEdit ? <Button onPress={() => router.push('/(app)/expense-form')}>Add expense</Button> : undefined} />}
    {canEdit && items.length ? <Button onPress={() => router.push('/(app)/expense-form')}>＋ Add expense</Button> : null}
    <View style={styles.bottomSpace} />
  </Screen>;
}

const styles = StyleSheet.create({
  searchRow: { flexDirection: 'row', gap: 9 }, search: { flex: 1, minHeight: 48, borderRadius: 14, borderWidth: 1, borderColor: colors.line, backgroundColor: 'white', paddingHorizontal: 14, color: colors.ink, fontSize: 15 }, filter: { justifyContent: 'center', paddingHorizontal: 14, borderRadius: 14, backgroundColor: colors.mint }, filterText: { color: colors.forest, fontWeight: '900', fontSize: 13 }, filters: { gap: 14 }, filterActions: { flexDirection: 'row', gap: 10 }, half: { flex: 1 }, chips: { flexDirection: 'row', gap: 12, alignItems: 'center' }, clear: { color: colors.forest, fontWeight: '800', fontSize: 13 }, list: { gap: 10 }, row: { padding: 15, flexDirection: 'row', justifyContent: 'space-between', gap: 12 }, rowMain: { flex: 1, gap: 4 }, item: { color: colors.ink, fontSize: 16, fontWeight: '900' }, meta: { color: colors.muted, fontSize: 12, fontWeight: '600' }, date: { color: colors.muted, fontSize: 12 }, rowAmount: { alignItems: 'flex-end', gap: 7 }, amount: { color: colors.ink, fontWeight: '900', fontSize: 14 }, bottomSpace: { height: 12 },
});
