import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { putRecord } from '@/repositories/firestore';
import type { Budget, CategoryBudget } from '@/types/domain';

export const budgetRepository = {
  watch(_userId: string, projectId: string, callback: (budget: Budget | undefined) => void) { return onSnapshot(doc(db, 'budgets', projectId), (snapshot) => callback(snapshot.exists() ? ({ id: snapshot.id, ...snapshot.data() } as Budget) : undefined), () => callback(undefined)); },
  async get(_userId: string, projectId: string) { const snapshot = await getDoc(doc(db, 'budgets', projectId)); return snapshot.exists() ? ({ id: snapshot.id, ...snapshot.data() } as Budget) : undefined; },
  save(userId: string, projectId: string, totalBudget: number, categoryBudgets: CategoryBudget[]) { return putRecord('budgets', projectId, { projectId, totalBudget, categoryBudgets, updatedBy: userId }); },
};
