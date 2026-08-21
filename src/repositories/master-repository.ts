import { collection, deleteDoc, doc, getDocs, orderBy, query, updateDoc, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { createOwned, listenOwned } from '@/repositories/firestore';
import type { Expense, MasterItem, MasterType } from '@/types/domain';

const defaults: Record<MasterType, string[]> = {
  categories: ['Civil', 'Cement', 'Steel', 'Bricks', 'Sand', 'Aggregate', 'Electrical', 'Plumbing', 'Tiles', 'Doors & Windows', 'Woodwork', 'Painting', 'Kitchen', 'Interior', 'Labour', 'Architect', 'Engineer', 'Transportation', 'Other'],
  stages: ['Planning', 'Foundation', 'Basement', 'Structure', 'Brick Work', 'Plastering', 'Electrical', 'Plumbing', 'Flooring', 'Doors & Windows', 'Painting', 'Kitchen', 'Interior', 'External Work', 'Completion', 'Other'],
  vendors: [], units: ['Bag', 'Kg', 'Ton', 'Piece', 'Sq Ft', 'Sq M', 'Cft', 'Sq Yd', 'Litre', 'Meter', 'Day', 'Hour', 'Load', 'Trip', 'Other'],
  paymentMethods: ['Cash', 'UPI', 'Bank Transfer', 'Credit Card', 'Debit Card', 'Cheque', 'Loan', 'Other'], paymentStatuses: ['Paid', 'Pending', 'Partially Paid', 'Advance'],
};

export const masterRepository = {
  watch(projectId: string, type: MasterType, callback: (items: MasterItem[]) => void) { return listenOwned<MasterItem>(type, projectId, [where('projectId', '==', projectId), orderBy('name')], callback, undefined, false); },
  list: async (projectId: string, type: MasterType) => (await getDocs(query(collection(db, type), where('projectId', '==', projectId), orderBy('name')))).docs.map((item) => ({ id: item.id, ...item.data() } as MasterItem)),
  create(ownerId: string, projectId: string, type: MasterType, name: string) { return createOwned<MasterItem>(type, { ownerId, projectId, type, name: name.trim() }); },
  update(_userId: string, type: MasterType, id: string, name: string) { return updateDoc(doc(db, type, id), { name: name.trim(), updatedAt: new Date().toISOString() }); },
  delete: async (type: MasterType, id: string) => deleteDoc(doc(db, type, id)),
  async dependencies(projectId: string, type: MasterType, id: string) {
    const field: Partial<Record<MasterType, keyof Expense>> = { categories: 'categoryId', stages: 'stageId', vendors: 'vendorId', units: 'unitId', paymentMethods: 'paidById', paymentStatuses: 'paymentStatusId' };
    const expenseField = field[type]; if (!expenseField) return 0;
    return (await getDocs(query(collection(db, 'expenses'), where('projectId', '==', projectId), where(expenseField as string, '==', id)))).size;
  },
  async seed(ownerId: string, projectId: string) { await Promise.all((Object.keys(defaults) as MasterType[]).map(async (type) => { const current = await this.list(projectId, type); if (!current.length) await Promise.all(defaults[type].map((name) => createOwned<MasterItem>(type, { ownerId, projectId, type, name }))); })); },
};
