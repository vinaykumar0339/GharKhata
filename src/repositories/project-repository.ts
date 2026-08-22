import { collection, deleteDoc, doc, getDocs, query, updateDoc, where, writeBatch, type DocumentReference } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { projectMemberId } from '@/repositories/project-member-repository';
import type { Project } from '@/types/domain';

export const projectRepository = {
  async create(ownerId: string, input: Omit<Project, 'id' | 'ownerId' | 'createdAt' | 'updatedAt' | 'updatedBy'>) {
    const project = doc(collection(db, 'projects'));
    const updatedAt = new Date().toISOString();
    const batch = writeBatch(db);
    batch.set(project, { ...input, ownerId, updatedBy: ownerId, createdAt: updatedAt, updatedAt });
    batch.set(doc(db, 'projectMembers', projectMemberId(project.id, ownerId)), { projectId: project.id, userId: ownerId, role: 'admin', createdAt: updatedAt, updatedAt });
    await batch.commit();
    return project.id;
  },
  update(userId: string, id: string, input: Partial<Project>) { return updateDoc(doc(db, 'projects', id), { ...input, updatedBy: userId, updatedAt: new Date().toISOString() }); },
  archive(userId: string, id: string) { return updateDoc(doc(db, 'projects', id), { status: 'archived', updatedBy: userId, updatedAt: new Date().toISOString() }); },
  reactivate(userId: string, id: string) { return updateDoc(doc(db, 'projects', id), { status: 'active', updatedBy: userId, updatedAt: new Date().toISOString() }); },
  async delete(id: string) {
    const paths = ['projectMembers', 'projectInvites', 'expenses', 'categories', 'stages', 'vendors', 'units', 'paymentMethods', 'paymentStatuses', 'fundingSources'];
    const snapshots = await Promise.all(paths.map((path) => getDocs(query(collection(db, path), where('projectId', '==', id)))));
    const records = snapshots.flatMap((snapshot) => snapshot.docs.map((item) => item.ref as DocumentReference));
    for (let index = 0; index < records.length; index += 450) {
      const batch = writeBatch(db); records.slice(index, index + 450).forEach((record) => batch.delete(record)); await batch.commit();
    }
    await deleteDoc(doc(db, 'budgets', id));
    await deleteDoc(doc(db, 'projects', id));
  },
};
