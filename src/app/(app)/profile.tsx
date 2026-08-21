import { useEffect, useState } from 'react';
import { Alert, Text } from 'react-native';
import { Button, Field, Header, Screen } from '@/components/ui';
import { colors } from '@/constants/design';
import { friendlyError } from '@/lib/errors';
import { authRepository } from '@/repositories/auth-repository';
import { profileRepository } from '@/repositories/profile-repository';
import { projectMemberRepository } from '@/repositories/project-member-repository';
import { useApp } from '@/providers/app-provider';

export default function ProfileScreen() {
  const { user, profile } = useApp();
  const [displayName, setDisplayName] = useState(profile?.displayName ?? user?.displayName ?? '');
  const [saving, setSaving] = useState(false);

  useEffect(() => setDisplayName(profile?.displayName ?? user?.displayName ?? ''), [profile?.displayName, user?.displayName]);

  const save = async () => {
    if (!user) return;
    const name = displayName.trim();
    if (!name) return Alert.alert('Add your name', 'Your name helps your collaborators identify project activity.');
    setSaving(true);
    try {
      await authRepository.updateDisplayName(name);
      await profileRepository.displayName(user.uid, name);
      await projectMemberRepository.syncDisplayName(user.uid, name);
      Alert.alert('Profile updated', 'Your name will be used for new project activity.');
    } catch (error) {
      Alert.alert('Could not update profile', friendlyError(error, 'Please try again.'));
    } finally {
      setSaving(false);
    }
  };

  return <Screen><Header title="Profile" subtitle="Your details appear on new project activity." /><Field label="Display name" value={displayName} onChangeText={setDisplayName} placeholder="Your name" autoCapitalize="words" /><Field label="Email" value={user?.email ?? ''} editable={false} /><Text style={{ color: colors.muted, fontSize: 13, lineHeight: 19 }}>Changing your name does not rewrite activity that was already recorded.</Text><Button loading={saving} onPress={save}>Save profile</Button></Screen>;
}
