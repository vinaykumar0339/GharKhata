import { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { Button, Card, EmptyState, Header, Screen } from '@/components/ui';
import { colors } from '@/constants/design';
import { friendlyError } from '@/lib/errors';
import { inviteRepository } from '@/repositories/invite-repository';
import { profileRepository } from '@/repositories/profile-repository';
import { useApp } from '@/providers/app-provider';
import type { ProjectInvite } from '@/types/domain';

export default function Invites() {
  const { user } = useApp(); const [invites, setInvites] = useState<ProjectInvite[]>([]); const [busy, setBusy] = useState<string>();
  useEffect(() => user?.email ? inviteRepository.watchForEmail(user.email, setInvites) : undefined, [user?.email]);
  const accept = async (invite: ProjectInvite) => {
    if (!user) return; setBusy(invite.id);
    try { await inviteRepository.accept(user.uid, invite); await profileRepository.selectProject(user.uid, invite.projectId); Alert.alert('Project joined', `You can now collaborate on ${invite.projectName}.`); }
    catch (error) { Alert.alert('Could not join project', friendlyError(error, 'Please try again.')); } finally { setBusy(undefined); }
  };
  const decline = async (invite: ProjectInvite) => {
    setBusy(invite.id);
    try { await inviteRepository.decline(invite.id); }
    catch (error) { Alert.alert('Could not decline invitation', friendlyError(error, 'Please try again.')); } finally { setBusy(undefined); }
  };
  return <Screen><Header title="Invitations" subtitle={invites.length ? `${invites.length} pending project invitation${invites.length === 1 ? '' : 's'}.` : 'Projects shared with you.'} />{invites.length ? <View style={styles.list}>{invites.map((invite) => <Card key={invite.id} style={styles.card}><View><Text style={styles.name}>{invite.projectName}</Text><Text style={styles.email}>Invited as {invite.role} · {invite.invitedEmail}</Text></View><View style={styles.actions}><Button loading={busy === invite.id} onPress={() => accept(invite)}>Accept</Button><Button disabled={Boolean(busy)} variant="ghost" onPress={() => decline(invite)}>Decline</Button></View></Card>)}</View> : <EmptyState icon="✦" title="No pending invitations" body="When a project owner invites your account email, it will appear here." />}</Screen>;
}
const styles = StyleSheet.create({ list: { gap: 12 }, card: { gap: 16 }, name: { color: colors.ink, fontWeight: '900', fontSize: 18 }, email: { color: colors.muted, fontSize: 13, marginTop: 4 }, actions: { flexDirection: 'row', gap: 8 } });
