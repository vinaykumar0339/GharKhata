import { useEffect, useState } from 'react';
import { budgetRepository } from '@/repositories/budget-repository';
import { expenseRepository } from '@/repositories/expense-repository';
import { masterRepository } from '@/repositories/master-repository';
import { projectRepository } from '@/repositories/project-repository';
import type { Budget, Expense, ExpenseFilters, MasterItem, MasterType, Project } from '@/types/domain';

export function useProjects(ownerId?: string) { const [projects, setProjects] = useState<Project[]>([]); useEffect(() => ownerId ? projectRepository.watch(ownerId, setProjects) : undefined, [ownerId]); return projects; }
export function useMaster(projectId: string | undefined, type: MasterType) { const [items, setItems] = useState<MasterItem[]>([]); useEffect(() => projectId ? masterRepository.watch(projectId, type, setItems) : undefined, [projectId, type]); return items; }
export function useExpenses(ownerId: string | undefined, projectId: string | undefined, filters: ExpenseFilters = {}) { const [items, setItems] = useState<Expense[]>([]); const [error, setError] = useState(false); useEffect(() => ownerId && projectId ? expenseRepository.watch(ownerId, projectId, filters, setItems, () => setError(true)) : undefined, [ownerId, projectId, filters.search, filters.categoryId, filters.stageId, filters.vendorId, filters.paymentStatusId, filters.paidById, filters.from, filters.to, filters.sort]); return { items, error }; }
export function useBudget(ownerId?: string, projectId?: string) { const [budget, setBudget] = useState<Budget>(); useEffect(() => ownerId && projectId ? budgetRepository.watch(ownerId, projectId, setBudget) : undefined, [ownerId, projectId]); return budget; }
