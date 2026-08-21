import { deleteDoc, doc, getDoc, orderBy, updateDoc, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { createOwned, listenOwned } from '@/repositories/firestore';
import type { Expense, ExpenseFilters } from '@/types/domain';

function applyFilters(items: Expense[], filters: ExpenseFilters) {
  const search = filters.search?.trim().toLowerCase();
  const filtered = items.filter((item) => (!search || [item.item, item.description, item.notes].some((text) => text.toLowerCase().includes(search)))
    && (!filters.categoryId || item.categoryId === filters.categoryId) && (!filters.stageId || item.stageId === filters.stageId)
    && (!filters.vendorId || item.vendorId === filters.vendorId) && (!filters.paymentStatusId || item.paymentStatusId === filters.paymentStatusId)
    && (!filters.paidById || item.paidById === filters.paidById) && (!filters.from || item.date >= filters.from) && (!filters.to || item.date <= filters.to));
  return [...filtered].sort((a, b) => {
    if (filters.sort === 'oldest') return a.date.localeCompare(b.date);
    if (filters.sort === 'highest') return b.amount - a.amount;
    if (filters.sort === 'lowest') return a.amount - b.amount;
    return b.date.localeCompare(a.date);
  });
}

export const expenseRepository = {
  watch(userId: string, projectId: string, filters: ExpenseFilters, callback: (items: Expense[]) => void, onError?: (error: Error) => void) {
    return listenOwned<Expense>('expenses', userId, [where('projectId', '==', projectId), orderBy('date', 'desc')], (items) => callback(applyFilters(items, filters)), onError, false);
  },
  async get(_userId: string, id: string) { const snapshot = await getDoc(doc(db, 'expenses', id)); return snapshot.exists() ? ({ id: snapshot.id, ...snapshot.data() } as Expense) : undefined; },
  create(userId: string, input: Omit<Expense, 'id' | 'ownerId' | 'createdAt' | 'updatedAt' | 'createdBy'>) { return createOwned<Expense>('expenses', { ...input, ownerId: userId, createdBy: userId }); },
  update(_userId: string, id: string, input: Partial<Expense>) { return updateDoc(doc(db, 'expenses', id), { ...input, updatedAt: new Date().toISOString() }); },
  delete: (_userId: string, expense: Expense) => deleteDoc(doc(db, 'expenses', expense.id)),
};
