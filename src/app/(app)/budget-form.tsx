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

export default function BudgetForm() {
  const { user, profile } = useApp();
  const projects = useProjects(user?.uid);
  const project = projects.find((item) => item.id === profile?.selectedProjectId) ?? projects[0];
  const categories = useMaster(project?.id, 'categories');
  const existing = useBudget(user?.uid, project?.id);
  const [total, setTotal] = useState('');
  const [values, setValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const canPlan = Boolean(project && project.status === 'active' && user && project.role === 'admin');
  const categoryBudgets = Object.entries(values).filter(([, amount]) => Number(amount) > 0).map(([categoryId, amount]) => ({ categoryId, amount: Number(amount) }));
  const budgetErrors = validateBudget(Number(total), categoryBudgets);
  useEffect(() => { if (existing) { setTotal(String(existing.totalBudget)); setValues(Object.fromEntries(existing.categoryBudgets.map((line) => [line.categoryId, String(line.amount)]))); } else if (project?.totalBudget) setTotal(String(project.totalBudget)); }, [existing?.updatedAt, project?.id]);
  const save = async () => {
    if (!user || !project || Number(total) <= 0) return Alert.alert('Add a total budget', 'It needs to be greater than zero.');
    if (budgetErrors.categoryBudgets) return Alert.alert('Category allocations are too high', budgetErrors.categoryBudgets);
    setSaving(true);
    try {
      await budgetRepository.save(user.uid, project.id, Number(total), categoryBudgets);
      await projectRepository.update(user.uid, project.id, { totalBudget: Number(total) });
      router.back();
    } catch { Alert.alert('Could not save budget', 'Please try again.'); } finally { setSaving(false); }
  };
  if (!project) return <Screen><EmptyState title="No project selected" body="Select a project before planning its budget." /></Screen>;
  if (!canPlan) return <Screen><Header title="Budget" /><EmptyState title={project.status === 'archived' ? 'Project archived' : 'Admin access required'} body={project.status === 'archived' ? 'This project is read-only until an admin reactivates it.' : 'Only the project owner and admins can change its budget.'} /></Screen>;
  return <Screen><Header title="Plan your budget" subtitle="Set a total, then allocate it where useful." /><Field label="Total project budget" value={total} onChangeText={setTotal} keyboardType="decimal-pad" placeholder="0" />{categories.length ? <><Text style={styles.section}>Category allocations</Text><Text style={styles.help}>Optional. Empty categories won’t appear in your comparison.</Text>{categories.map((category) => <View key={category.id} style={styles.category}><Text style={styles.categoryName}>{category.name}</Text><Field label="" value={values[category.id] ?? ''} onChangeText={(amount) => setValues((current) => ({ ...current, [category.id]: amount }))} keyboardType="decimal-pad" placeholder="0" style={styles.amount} /></View>)}{budgetErrors.categoryBudgets ? <Text style={styles.error}>{budgetErrors.categoryBudgets}</Text> : null}</> : null}<Button loading={saving} disabled={Boolean(budgetErrors.categoryBudgets)} onPress={save}>Save budget</Button></Screen>;
}
const styles = StyleSheet.create({ section: { color: colors.ink, fontSize: 18, fontWeight: '900', marginTop: 4 }, help: { color: colors.muted, fontSize: 13, marginTop: -10 }, category: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 15 }, categoryName: { color: colors.ink, fontWeight: '700', flex: 1 }, amount: { width: 118 }, error: { color: colors.coral, fontSize: 12, marginTop: -8 } });
