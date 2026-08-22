import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { Button, EmptyState, Field, Header, Screen } from '@/components/ui';
import { colors } from '@/constants/design';
import { useBudget, useMaster, useProjects } from '@/hooks/use-project-data';
import { validateBudget } from '@/lib/validation';
import { budgetRepository } from '@/repositories/budget-repository';
import { projectRepository } from '@/repositories/project-repository';
import { useApp } from '@/providers/app-provider';
import type { CostBucket } from '@/types/domain';

const allocationFor = (values: Record<string, string>, costBucket: CostBucket) => Object.entries(values)
  .filter(([, amount]) => Number(amount) > 0)
  .map(([categoryId, amount]) => ({ categoryId, amount: Number(amount), costBucket }));

export default function BudgetForm() {
  const { user, profile } = useApp();
  const projects = useProjects(user?.uid);
  const project = projects.find((item) => item.id === profile?.selectedProjectId) ?? projects[0];
  const categories = useMaster(project?.id, 'categories');
  const existing = useBudget(user?.uid, project?.id);
  const [construction, setConstruction] = useState('');
  const [other, setOther] = useState('');
  const [constructionValues, setConstructionValues] = useState<Record<string, string>>({});
  const [otherValues, setOtherValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const constructionBudget = Number(construction) || 0;
  const otherBudget = Number(other) || 0;
  const totalBudget = constructionBudget + otherBudget;
  const constructionAllocations = allocationFor(constructionValues, 'construction');
  const otherAllocations = allocationFor(otherValues, 'other');
  const constructionErrors = validateBudget(constructionBudget, constructionAllocations);
  const otherErrors = validateBudget(otherBudget, otherAllocations);
  const categoryBudgets = [...constructionAllocations, ...otherAllocations];
  const canPlan = Boolean(project && project.status === 'active' && user && project.role === 'admin');

  useEffect(() => {
    if (existing) {
      setConstruction(String(existing.constructionBudget ?? existing.totalBudget));
      setOther(String(existing.otherBudget ?? 0));
      setConstructionValues(Object.fromEntries(existing.categoryBudgets.filter((line) => (line.costBucket ?? 'construction') === 'construction').map((line) => [line.categoryId, String(line.amount)])));
      setOtherValues(Object.fromEntries(existing.categoryBudgets.filter((line) => line.costBucket === 'other').map((line) => [line.categoryId, String(line.amount)])));
    } else if (project?.totalBudget) {
      setConstruction(String(project.totalBudget));
      setOther('0');
    }
  }, [existing?.updatedAt, project?.id]);

  const save = async () => {
    if (!user || !project || totalBudget <= 0) return Alert.alert('Add a budget', 'Construction and other project costs together must be greater than zero.');
    const allocationError = constructionErrors.categoryBudgets || otherErrors.categoryBudgets;
    if (allocationError) return Alert.alert('Category allocations are too high', allocationError);
    setSaving(true);
    try {
      await budgetRepository.save(user.uid, project.id, { totalBudget, constructionBudget, otherBudget, categoryBudgets });
      await projectRepository.update(user.uid, project.id, { totalBudget });
      router.back();
    } catch { Alert.alert('Could not save budget', 'Please try again.'); } finally { setSaving(false); }
  };

  if (!project) return <Screen><EmptyState title="No project selected" body="Select a project before planning its budget." /></Screen>;
  if (!canPlan) return <Screen><Header title="Budget" /><EmptyState title={project.status === 'archived' ? 'Project archived' : 'Admin access required'} body={project.status === 'archived' ? 'This project is read-only until an admin reactivates it.' : 'Only the project owner and admins can change its budget.'} /></Screen>;
  return <Screen>
    <Header title="Plan your budget" subtitle="Keep construction and other project costs independently on track." />
    <Field label="Construction budget" value={construction} onChangeText={setConstruction} keyboardType="decimal-pad" placeholder="0" />
    <Field label="Other project costs" value={other} onChangeText={setOther} keyboardType="decimal-pad" placeholder="0" />
    <Text style={styles.help}>For approvals, consultants, temporary services, finance charges, furnishings, and anything not directly part of construction.</Text>
    <View style={styles.total}><Text style={styles.totalLabel}>TOTAL PROJECT BUDGET</Text><Text style={styles.totalValue}>{totalBudget.toLocaleString('en-IN')}</Text></View>
    {categories.length ? <>
      <AllocationSection title="Construction category allocations" help="Optional. These amounts must fit within the construction budget." categories={categories} values={constructionValues} onChange={setConstructionValues} error={constructionErrors.categoryBudgets} />
      <AllocationSection title="Other project cost allocations" help="Optional. Plan approvals and every other non-construction category here." categories={categories} values={otherValues} onChange={setOtherValues} error={otherErrors.categoryBudgets} />
    </> : null}
    <Button loading={saving} disabled={Boolean(constructionErrors.categoryBudgets || otherErrors.categoryBudgets)} onPress={save}>Save budget</Button>
  </Screen>;
}

function AllocationSection({ title, help, categories, values, onChange, error }: { title: string; help: string; categories: { id: string; name: string }[]; values: Record<string, string>; onChange: (next: Record<string, string>) => void; error?: string }) {
  return <><Text style={styles.section}>{title}</Text><Text style={styles.help}>{help}</Text>{categories.map((category) => <View key={category.id} style={styles.category}><Text numberOfLines={2} style={styles.categoryName}>{category.name}</Text><Field label="" value={values[category.id] ?? ''} onChangeText={(amount) => onChange({ ...values, [category.id]: amount })} keyboardType="decimal-pad" placeholder="0" style={styles.amount} /></View>)}{error ? <Text style={styles.error}>{error}</Text> : null}</>;
}

const styles = StyleSheet.create({ section: { color: colors.ink, fontSize: 18, fontWeight: '900', marginTop: 4 }, help: { color: colors.muted, fontSize: 13, marginTop: -10, lineHeight: 19 }, total: { backgroundColor: colors.mint, borderRadius: 16, padding: 15, gap: 4 }, totalLabel: { color: colors.muted, fontSize: 10, fontWeight: '900', letterSpacing: .8 }, totalValue: { color: colors.forest, fontSize: 24, fontWeight: '900' }, category: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 15 }, categoryName: { color: colors.ink, fontWeight: '700', flex: 1, flexShrink: 1 }, amount: { width: 118 }, error: { color: colors.coral, fontSize: 12, marginTop: -8 } });
