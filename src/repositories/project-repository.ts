import { collection, doc, orderBy, updateDoc, where, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { deleteOwned, listenOwned } from '@/repositories/firestore';
import type { Project } from '@/types/domain';

export const projectRepository = {
  watch(userId: string, callback: (items: Project[]) => void) { return listenOwned<Project>('projects', userId, [where('memberIds', 'array-contains', userId), orderBy('updatedAt', 'desc')], callback, undefined, false); },
  async create(ownerId: string, ownerName: string, input: Omit<Project, 'id' | 'ownerId' | 'ownerName' | 'createdAt' | 'updatedAt' | 'memberIds' | 'memberRoles' | 'updatedBy' | 'updatedByName'>) {
    const project = doc(collection(db, 'projects'));
    const updatedAt = new Date().toISOString();
    const batch = writeBatch(db);
    batch.set(project, { ...input, ownerId, ownerName, memberIds: [ownerId], memberRoles: { [ownerId]: 'admin' }, updatedBy: ownerId, updatedByName: ownerName, createdAt: updatedAt, updatedAt });
    batch.set(doc(project, 'members', ownerId), { userId: ownerId, displayName: ownerName, updatedAt });
    await batch.commit();
    return project.id;
  },
  update(userId: string, actorName: string, id: string, input: Partial<Project>) { return updateDoc(doc(db, 'projects', id), { ...input, updatedBy: userId, updatedByName: actorName, updatedAt: new Date().toISOString() }); },
  archive(userId: string, actorName: string, id: string) { return updateDoc(doc(db, 'projects', id), { status: 'archived', updatedBy: userId, updatedByName: actorName, updatedAt: new Date().toISOString() }); },
  reactivate(userId: string, actorName: string, id: string) { return updateDoc(doc(db, 'projects', id), { status: 'active', updatedBy: userId, updatedByName: actorName, updatedAt: new Date().toISOString() }); },
  delete: (ownerId: string, id: string) => deleteOwned('projects', id, ownerId),
};
