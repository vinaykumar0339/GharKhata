import { doc, orderBy, updateDoc, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { createOwned, deleteOwned, listenOwned, updateOwned } from '@/repositories/firestore';
import type { Project } from '@/types/domain';

export const projectRepository = {
  watch(userId: string, callback: (items: Project[]) => void) { return listenOwned<Project>('projects', userId, [where('memberIds', 'array-contains', userId), orderBy('updatedAt', 'desc')], callback, undefined, false); },
  create(ownerId: string, input: Omit<Project, 'id' | 'ownerId' | 'createdAt' | 'updatedAt' | 'memberIds' | 'memberRoles'>) { return createOwned<Project>('projects', { ...input, ownerId, memberIds: [ownerId], memberRoles: { [ownerId]: 'admin' } }); },
  update(_userId: string, id: string, input: Partial<Project>) { return updateDoc(doc(db, 'projects', id), { ...input, updatedAt: new Date().toISOString() }); },
  archive(_userId: string, id: string) { return updateDoc(doc(db, 'projects', id), { status: 'archived', updatedAt: new Date().toISOString() }); },
  reactivate(_userId: string, id: string) { return updateDoc(doc(db, 'projects', id), { status: 'active', updatedAt: new Date().toISOString() }); },
  delete: (ownerId: string, id: string) => deleteOwned('projects', id, ownerId),
};
