import { Redirect, Stack } from 'expo-router';
import { useApp } from '@/providers/app-provider';
export default function ProtectedLayout() { const { user, loading } = useApp(); if (!loading && !user) return <Redirect href="/(auth)/login" />; return <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }} />; }
