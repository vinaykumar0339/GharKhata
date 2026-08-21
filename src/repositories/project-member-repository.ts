import { collection, doc, onSnapshot, orderBy, query, where, type Unsubscribe } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { ProjectMember } from '@/types/domain';

export const projectMemberId = (projectId: string, userId: string) => `${projectId}__${userId}`;
const fromMember = (id: string, value: Record<string, unknown>) => ({ id, ...value } as ProjectMember);

export const projectMemberRepository = {
  watchProject(projectId: string, callback: (members: ProjectMember[]) => void): Unsubscribe {
    return onSnapshot(query(collection(db, 'projectMembers'), where('projectId', '==', projectId), orderBy('createdAt')), (snapshot) => callback(snapshot.docs.map((item) => fromMember(item.id, item.data()))), () => callback([]));
  },
  watchForUser(userId: string, callback: (members: ProjectMember[]) => void): Unsubscribe {
    return onSnapshot(query(collection(db, 'projectMembers'), where('userId', '==', userId)), (snapshot) => callback(snapshot.docs.map((item) => fromMember(item.id, item.data()))), () => callback([]));
  },
  watch(projectId: string, userId: string, callback: (membership: ProjectMember | undefined) => void): Unsubscribe {
    return onSnapshot(doc(db, 'projectMembers', projectMemberId(projectId, userId)), (snapshot) => callback(snapshot.exists() ? fromMember(snapshot.id, snapshot.data()) : undefined), () => callback(undefined));
  },
};
