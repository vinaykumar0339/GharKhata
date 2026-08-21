import { collection, deleteDoc, doc, getDocs, orderBy, query, updateDoc, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { createRecord, listenRecords } from '@/repositories/firestore';
import type { Expense, MasterItem, MasterType } from '@/types/domain';

const defaults: Record<MasterType, string[]> = {
  categories: ['Civil', 'Cement', 'Steel', 'Bricks', 'Sand', 'Aggregate', 'Electrical', 'Plumbing', 'Tiles', 'Doors & Windows', 'Woodwork', 'Painting', 'Kitchen', 'Interior', 'Labour', 'Architect', 'Engineer', 'Approvals', 'Transportation', 'Other'],
  stages: ['Planning', 'Foundation', 'Basement', 'Structure', 'Brick Work', 'Plastering', 'Electrical', 'Plumbing', 'Flooring', 'Doors & Windows', 'Painting', 'Kitchen', 'Interior', 'External Work', 'Completion', 'Other'],
  vendors: [], units: ['Bag', 'Kg', 'Ton', 'Piece', 'Sq Ft', 'Sq M', 'Cft', 'Sq Yd', 'Litre', 'Meter', 'Day', 'Hour', 'Load', 'Trip', 'Other'],
  paymentMethods: ['Cash', 'UPI', 'Bank Transfer', 'Credit Card', 'Debit Card', 'Cheque', 'Loan', 'Other'], paymentStatuses: ['Paid', 'Pending', 'Partially Paid', 'Advance'],
};

export const masterRepository = {
  watch(projectId: string, type: MasterType, callback: (items: MasterItem[]) => void) { return listenRecords<MasterItem>(type, [where('projectId', '==', projectId), orderBy('name')], callback); },
  list: async (projectId: string, type: MasterType) => (await getDocs(query(collection(db, type), where('projectId', '==', projectId), orderBy('name')))).docs.map((item) => ({ id: item.id, ...item.data() } as MasterItem)),
  create(userId: string, projectId: string, type: MasterType, name: string) { return createRecord<MasterItem>(type, { projectId, type, name: name.trim(), createdBy: userId, updatedBy: userId }); },
  update(userId: string, type: MasterType, id: string, name: string) { return updateDoc(doc(db, type, id), { name: name.trim(), updatedBy: userId, updatedAt: new Date().toISOString() }); },
  delete: async (type: MasterType, id: string) => deleteDoc(doc(db, type, id)),
  async dependencies(projectId: string, type: MasterType, id: string) {
    const field: Partial<Record<MasterType, keyof Expense>> = { categories: 'categoryId', stages: 'stageId', vendors: 'vendorId', units: 'unitId', paymentMethods: 'paidById', paymentStatuses: 'paymentStatusId' };
    const expenseField = field[type]; if (!expenseField) return 0;
    return (await getDocs(query(collection(db, 'expenses'), where('projectId', '==', projectId), where(expenseField as string, '==', id)))).size;
  },
  async seed(userId: string, projectId: string) { await Promise.all((Object.keys(defaults) as MasterType[]).map(async (type) => { const current = await this.list(projectId, type); if (!current.length) await Promise.all(defaults[type].map((name) => createRecord<MasterItem>(type, { projectId, type, name, createdBy: userId, updatedBy: userId }))); })); },
};
