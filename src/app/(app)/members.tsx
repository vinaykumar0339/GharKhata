import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { Button, Card, EmptyState, Field, Header, Pill, Screen, Selector } from '@/components/ui';
import { colors } from '@/constants/design';
import { friendlyError } from '@/lib/errors';
import { useProjectMembers, useProjects } from '@/hooks/use-project-data';
import { inviteRepository } from '@/repositories/invite-repository';
import { useApp } from '@/providers/app-provider';
import type { ProjectInvite, ProjectRole } from '@/types/domain';

const roles = [{ id: 'admin', name: 'Admin — manage the project and team' }, { id: 'editor', name: 'Editor — add and edit records' }, { id: 'viewer', name: 'Viewer — view-only access' }];

export default function Members() {
  const { user, profile } = useApp(); const projects = useProjects(user?.uid); const project = projects.find((item) => item.id === profile?.selectedProjectId) ?? projects[0];
  const members = useProjectMembers(project?.id);
  const [email, setEmail] = useState(''); const [role, setRole] = useState<ProjectRole>('editor'); const [saving, setSaving] = useState(false); const [removingId, setRemovingId] = useState<string>(); const [updatingId, setUpdatingId] = useState<string>(); const [invites, setInvites] = useState<ProjectInvite[]>([]);
  const canManage = Boolean(project && project.status === 'active' && user && (project.ownerId === user.uid || project.memberRoles[user.uid] === 'admin'));
  useEffect(() => project && canManage ? inviteRepository.watchForProject(project.id, setInvites) : undefined, [project?.id, canManage]);
  const invite = async () => {
    if (!user || !project || !email.trim()) return Alert.alert('Enter an email', 'Add the collaborator’s account email first.');
    setSaving(true);
    try { await inviteRepository.invite(user.uid, project, email, role); setEmail(''); Alert.alert('Invitation ready', 'The user will see it in GharKhata after signing in with this email.'); }
    catch (error) { Alert.alert('Could not create invitation', friendlyError(error, 'Enter a valid email and try again.')); } finally { setSaving(false); }
  };
  const updateRole = (memberId: string) => {
    if (!project) return;
    const choose = (nextRole: ProjectRole) => Alert.alert(`Set role to ${nextRole}?`, nextRole === 'admin' ? 'Admins can manage the project and team.' : nextRole === 'editor' ? 'Editors can add and edit records.' : 'Viewers can only read this project.', [{ text: 'Cancel', style: 'cancel' }, { text: 'Save role', onPress: async () => {
      setUpdatingId(memberId);
      try { await inviteRepository.updateMemberRole(project.id, memberId, nextRole); }
      catch (error) { Alert.alert('Could not change role', friendlyError(error, 'Please try again.')); } finally { setUpdatingId(undefined); }
    } }]);
    Alert.alert('Change member role', 'Choose the access level for this collaborator.', [{ text: 'Admin', onPress: () => choose('admin') }, { text: 'Editor', onPress: () => choose('editor') }, { text: 'Viewer', onPress: () => choose('viewer') }]);
  };
  const remove = (memberId: string) => {
    if (!project || !user) return;
    Alert.alert('Remove member?', 'They will immediately lose access to this project.', [{ text: 'Cancel', style: 'cancel' }, { text: 'Remove', style: 'destructive', onPress: async () => {
      setRemovingId(memberId);
      try { await inviteRepository.removeMember(project.id, project.memberIds, project.memberRoles, memberId, invites.filter((invite) => invite.acceptedBy === memberId).map((invite) => invite.id)); Alert.alert('Member removed', 'Their access to this project has been removed.'); }
      catch (error) { Alert.alert('Could not remove member', friendlyError(error, 'Please try again.')); } finally { setRemovingId(undefined); }
    } }]);
  };
  if (!project) return <Screen><EmptyState title="No project selected" body="Create a project before inviting collaborators." action={<Button onPress={() => router.push('/(app)/project-form')}>Create project</Button>} /></Screen>;
  if (project.status === 'archived') return <Screen><Header title="Project members" subtitle="Archived project · view only." /><EmptyState title="Project archived" body="Reactivate the project from Projects before changing members or invitations." /></Screen>;
  if (!canManage) return <Screen><Header title="Project members" /><EmptyState title="Admin access required" body="Only project owners and admins can invite or remove members." /></Screen>;
  const pending = invites.filter((invite) => invite.status === 'pending');
  return <Screen><Header title="Project members" subtitle={`Invite people to ${project.name}.`} /><Card style={styles.invite}><Field label="Collaborator email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" placeholder="person@example.com" /><Selector label="Role" value={role} options={roles} onChange={(value) => setRole(value as ProjectRole)} /><Button loading={saving} onPress={invite}>Invite collaborator</Button></Card><Text style={styles.help}>Sending the same email again refreshes its invitation and role.</Text><Text style={styles.section}>Team ({project.memberIds.length})</Text><Card style={styles.list}>{project.memberIds.map((memberId) => { const member = members.find((item) => item.userId === memberId); const memberName = member?.displayName || (memberId === project.ownerId ? project.ownerName || 'Project owner' : memberId === user?.uid ? profile?.displayName || 'You' : 'Collaborator'); return <View key={memberId} style={styles.row}><View style={styles.member}><Text style={styles.memberName}>{memberName}</Text><Text numberOfLines={1} style={styles.memberId}>{memberId}</Text></View><View style={styles.actions}><Pill tone={project.memberRoles[memberId] === 'viewer' ? 'soft' : 'green'}>{memberId === project.ownerId ? 'Owner' : project.memberRoles[memberId]}</Pill>{memberId !== project.ownerId ? <View style={styles.memberButtons}><Button loading={updatingId === memberId} variant="secondary" style={styles.memberButton} onPress={() => updateRole(memberId)}>Change role</Button><Button loading={removingId === memberId} variant="ghost" style={styles.memberButton} onPress={() => remove(memberId)}>Remove</Button></View> : null}</View></View>; })}</Card><Text style={styles.section}>Invitations ({pending.length} pending)</Text>{pending.length ? <Card style={styles.list}>{pending.map((invite) => <View key={invite.id} style={styles.row}><View style={styles.member}><Text style={styles.memberName}>{invite.invitedEmail}</Text><Text style={styles.memberId}>{invite.role} · pending</Text></View><Pill tone="amber">pending</Pill></View>)}</Card> : <Text style={styles.help}>No pending invitations.</Text>}</Screen>;
}
const styles = StyleSheet.create({ invite: { gap: 14 }, help: { color: colors.muted, fontSize: 13, lineHeight: 18 }, section: { color: colors.ink, fontWeight: '900', fontSize: 18, marginTop: 2 }, list: { paddingVertical: 0 }, row: { minHeight: 76, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12, borderBottomColor: colors.line, borderBottomWidth: 1 }, member: { flex: 1 }, memberName: { color: colors.ink, fontWeight: '900' }, memberId: { color: colors.muted, fontSize: 11, marginTop: 3 }, actions: { alignItems: 'flex-end', gap: 5 }, memberButtons: { flexDirection: 'row', gap: 6 }, memberButton: { minHeight: 31, borderRadius: 10, paddingHorizontal: 9 } });
