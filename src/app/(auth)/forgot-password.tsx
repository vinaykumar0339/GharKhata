import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { Button, Field, Screen } from '@/components/ui';
import { colors } from '@/constants/design';
import { friendlyError } from '@/lib/errors';
import { authRepository } from '@/repositories/auth-repository';
export default function ForgotPassword() { const [email, setEmail] = useState(''); const [loading, setLoading] = useState(false); const submit = async () => { if (!email) return Alert.alert('Enter your email', 'We will send a password reset link to it.'); setLoading(true); try { await authRepository.resetPassword(email); Alert.alert('Email sent', 'Check your inbox for a password reset link.', [{ text: 'Done', onPress: () => router.back() }]); } catch (error) { Alert.alert('Could not send email', friendlyError(error, 'Please try again.')); } finally { setLoading(false); } };
return <Screen style={styles.screen}><View style={styles.hero}><Text style={styles.title}>Reset password</Text><Text style={styles.sub}>Enter the email attached to your account and we’ll send you a reset link.</Text></View><View style={styles.form}><Field label="Email address" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" placeholder="you@example.com" /><Button loading={loading} onPress={submit}>Send reset link</Button><Button variant="ghost" onPress={() => router.back()}>Back to sign in</Button></View></Screen>; }
const styles = StyleSheet.create({ screen: { justifyContent: 'center', gap: 36, paddingHorizontal: 25 }, hero: { gap: 9 }, title: { color: colors.ink, fontSize: 32, fontWeight: '900' }, sub: { color: colors.muted, fontSize: 16, lineHeight: 23 }, form: { gap: 16 } });
