import { doc, onSnapshot, query, runTransaction, setDoc, updateDoc, where, writeBatch, collection, type Unsubscribe } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { projectMemberId } from '@/repositories/project-member-repository';
import type { Project, ProjectInvite, ProjectRole } from '@/types/domain';

const now = () => new Date().toISOString();
const inviteId = (projectId: string, email: string) => `${projectId}__${email.trim().toLowerCase()}`;

export const inviteRepository = {
  async invite(_userId: string, project: Project, email: string, role: ProjectRole) {
    const invitedEmail = email.trim().toLowerCase();
    if (!invitedEmail.includes('@')) throw new Error('invalid-email');
    await setDoc(doc(db, 'projectInvites', inviteId(project.id, invitedEmail)), {
      projectId: project.id, invitedEmail, role, status: 'pending', createdAt: now(), updatedAt: now(),
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
      const inviteRef = doc(db, 'projectInvites', invite.id);
      const inviteSnapshot = await transaction.get(inviteRef);
      if (!inviteSnapshot.exists() || inviteSnapshot.data().status !== 'pending') throw new Error('not-found');
      const current = inviteSnapshot.data() as ProjectInvite;
      transaction.update(inviteRef, { status: 'accepted', acceptedBy: userId, updatedAt: now() });
      transaction.set(doc(db, 'projectMembers', projectMemberId(invite.projectId, userId)), { projectId: invite.projectId, userId, role: current.role, createdAt: now(), updatedAt: now() });
    });
  },
  decline: (id: string) => updateDoc(doc(db, 'projectInvites', id), { status: 'declined', updatedAt: now() }),
  updateMemberRole: (projectId: string, userId: string, role: ProjectRole) => updateDoc(doc(db, 'projectMembers', projectMemberId(projectId, userId)), { role, updatedAt: now() }),
  async removeMember(projectId: string, userId: string, acceptedInviteIds: string[]) {
    const batch = writeBatch(db);
    batch.delete(doc(db, 'projectMembers', projectMemberId(projectId, userId)));
    acceptedInviteIds.forEach((id) => batch.delete(doc(db, 'projectInvites', id)));
    await batch.commit();
  },
};
