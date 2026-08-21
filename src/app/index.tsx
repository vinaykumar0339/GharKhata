import { Redirect } from 'expo-router';
import { LoadingState, Screen } from '@/components/ui';
import { useApp } from '@/providers/app-provider';
export default function Index() { const { user, loading } = useApp(); if (loading) return <Screen><LoadingState /></Screen>; return <Redirect href={user ? '/(app)/(tabs)' : '/(auth)/login'} />; }
