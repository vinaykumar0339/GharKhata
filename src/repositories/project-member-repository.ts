import { collection, doc, getDocs, onSnapshot, query, setDoc, where, writeBatch, type Unsubscribe } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { ProjectMember } from '@/types/domain';

const now = () => new Date().toISOString();

export const projectMemberRepository = {
  watch(projectId: string, callback: (members: ProjectMember[]) => void): Unsubscribe {
    return onSnapshot(collection(db, 'projects', projectId, 'members'), (snapshot) => callback(snapshot.docs.map((item) => ({ ...item.data(), userId: item.id } as ProjectMember))), () => callback([]));
  },
  async syncDisplayName(userId: string, displayName: string) {
    const projects = await getDocs(query(collection(db, 'projects'), where('memberIds', 'array-contains', userId)));
    if (projects.empty) return;
    const batch = writeBatch(db);
    const updatedAt = now();
    projects.docs.forEach((project) => batch.set(doc(db, 'projects', project.id, 'members', userId), { userId, displayName, updatedAt }, { merge: true }));
    await batch.commit();
  },
};
