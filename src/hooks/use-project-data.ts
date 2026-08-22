import { doc, onSnapshot, type Unsubscribe } from 'firebase/firestore';
import { useEffect, useMemo, useState } from 'react';
import { budgetRepository } from '@/repositories/budget-repository';
import { expenseRepository } from '@/repositories/expense-repository';
import { masterRepository } from '@/repositories/master-repository';
import { projectMemberRepository } from '@/repositories/project-member-repository';
import { db } from '@/lib/firebase';
import type { Budget, Expense, ExpenseFilters, MasterItem, MasterType, Profile, Project, ProjectAccess, ProjectMember } from '@/types/domain';

export function useProjects(userId?: string) {
  const [memberships, setMemberships] = useState<ProjectMember[]>([]); const [projectMap, setProjectMap] = useState<Record<string, Project>>({});
  useEffect(() => userId ? projectMemberRepository.watchForUser(userId, setMemberships) : undefined, [userId]);
  const projectIds = memberships.map((member) => member.projectId).sort().join('|');
  useEffect(() => {
    if (!projectIds) { setProjectMap({}); return; }
    const stops: Unsubscribe[] = [];
    projectIds.split('|').forEach((projectId) => stops.push(onSnapshot(doc(db, 'projects', projectId), (snapshot) => setProjectMap((current) => {
      const next = { ...current }; if (snapshot.exists()) next[projectId] = { id: snapshot.id, ...snapshot.data() } as Project; else delete next[projectId]; return next;
    }), () => setProjectMap((current) => { const next = { ...current }; delete next[projectId]; return next; }))));
    return () => stops.forEach((stop) => stop());
  }, [projectIds]);
  return useMemo<ProjectAccess[]>(() => memberships.map((member) => projectMap[member.projectId] ? { ...projectMap[member.projectId], role: member.role } : undefined).filter((item): item is ProjectAccess => Boolean(item)).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)), [memberships, projectMap]);
}
export function useProjectMembers(projectId?: string) { const [members, setMembers] = useState<ProjectMember[]>([]); useEffect(() => projectId ? projectMemberRepository.watchProject(projectId, setMembers) : undefined, [projectId]); return members; }
export function useProfiles(userIds: string[]) {
  const [profiles, setProfiles] = useState<Record<string, Profile>>({}); const ids = [...new Set(userIds.filter(Boolean))].sort().join('|');
  useEffect(() => {
    if (!ids) { setProfiles({}); return; }
    const stops = ids.split('|').map((userId) => onSnapshot(doc(db, 'users', userId), (snapshot) => setProfiles((current) => {
      const next = { ...current }; if (snapshot.exists()) next[userId] = { id: snapshot.id, ...snapshot.data() } as Profile; else delete next[userId]; return next;
    }), () => undefined));
    return () => stops.forEach((stop) => stop());
  }, [ids]);
  return profiles;
}
export function useMaster(projectId: string | undefined, type: MasterType) { const [items, setItems] = useState<MasterItem[]>([]); useEffect(() => projectId ? masterRepository.watch(projectId, type, setItems) : undefined, [projectId, type]); return items; }
export function useExpenses(userId: string | undefined, projectId: string | undefined, filters: ExpenseFilters = {}) { const [items, setItems] = useState<Expense[]>([]); const [error, setError] = useState(false); useEffect(() => userId && projectId ? expenseRepository.watch(userId, projectId, filters, setItems, () => setError(true)) : undefined, [userId, projectId, filters.search, filters.categoryId, filters.stageId, filters.vendorId, filters.paymentStatusId, filters.paidById, filters.fundingSourceId, filters.costBucket, filters.from, filters.to, filters.sort]); return { items, error }; }
export function useBudget(userId?: string, projectId?: string) { const [budget, setBudget] = useState<Budget>(); useEffect(() => userId && projectId ? budgetRepository.watch(userId, projectId, setBudget) : undefined, [userId, projectId]); return budget; }
