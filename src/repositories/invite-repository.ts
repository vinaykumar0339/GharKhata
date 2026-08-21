import { arrayUnion, doc, onSnapshot, query, runTransaction, setDoc, updateDoc, where, writeBatch, collection, type Unsubscribe } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Project, ProjectInvite, ProjectRole } from '@/types/domain';

const now = () => new Date().toISOString();
const inviteId = (projectId: string, email: string) => `${projectId}__${email.trim().toLowerCase()}`;

export const inviteRepository = {
  async invite(_userId: string, project: Project, email: string, role: ProjectRole) {
    const invitedEmail = email.trim().toLowerCase();
    if (!invitedEmail.includes('@')) throw new Error('invalid-email');
    await setDoc(doc(db, 'projectInvites', inviteId(project.id, invitedEmail)), {
      ownerId: project.ownerId, projectId: project.id, projectName: project.name, invitedEmail, role, status: 'pending', createdAt: now(), updatedAt: now(),
    });
  },
  watchForEmail(email: string, callback: (items: ProjectInvite[]) => void): Unsubscribe {
    return onSnapshot(query(collection(db, 'projectInvites'), where('invitedEmail', '==', email.trim().toLowerCase()), where('status', '==', 'pending')), (snapshot) => callback(snapshot.docs.map((item) => ({ id: item.id, ...item.data() } as ProjectInvite))), () => callback([]));
  },
  watchForProject(projectId: string, callback: (items: ProjectInvite[]) => void): Unsubscribe {
    return onSnapshot(query(collection(db, 'projectInvites'), where('projectId', '==', projectId)), (snapshot) => callback(snapshot.docs.map((item) => ({ id: item.id, ...item.data() } as ProjectInvite))), () => callback([]));
  },
  async accept(userId: string, invite: ProjectInvite) {
    await runTransaction(db, async (transaction) => {
      const inviteRef = doc(db, 'projectInvites', invite.id); const projectRef = doc(db, 'projects', invite.projectId);
      const inviteSnapshot = await transaction.get(inviteRef);
      if (!inviteSnapshot.exists() || inviteSnapshot.data().status !== 'pending') throw new Error('not-found');
      const current = inviteSnapshot.data() as ProjectInvite;
      transaction.update(inviteRef, { status: 'accepted', acceptedBy: userId, updatedAt: now() });
      transaction.update(projectRef, { memberIds: arrayUnion(userId), [`memberRoles.${userId}`]: current.role, updatedAt: now() });
    });
  },
  decline: (id: string) => updateDoc(doc(db, 'projectInvites', id), { status: 'declined', updatedAt: now() }),
  updateMemberRole: (projectId: string, userId: string, role: ProjectRole) => updateDoc(doc(db, 'projects', projectId), { [`memberRoles.${userId}`]: role, updatedAt: now() }),
  async removeMember(projectId: string, memberIds: string[], memberRoles: Record<string, ProjectRole>, userId: string, acceptedInviteIds: string[]) {
    const batch = writeBatch(db);
    batch.update(doc(db, 'projects', projectId), { memberIds: memberIds.filter((id) => id !== userId), memberRoles: Object.fromEntries(Object.entries(memberRoles).filter(([id]) => id !== userId)), updatedAt: now() });
    acceptedInviteIds.forEach((id) => batch.delete(doc(db, 'projectInvites', id)));
    await batch.commit();
  },
};
