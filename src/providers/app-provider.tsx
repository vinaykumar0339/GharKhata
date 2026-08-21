import { onAuthStateChanged, type User } from 'firebase/auth';
import { useEffect, useMemo, useState, createContext, useContext, type PropsWithChildren } from 'react';
import { auth } from '@/lib/firebase';
import { profileRepository } from '@/repositories/profile-repository';
import { projectMemberRepository } from '@/repositories/project-member-repository';
import type { CurrencyCode, Profile } from '@/types/domain';

type AppContextValue = { user: User | null; profile?: Profile; loading: boolean; currency: CurrencyCode; setCurrency: (currency: CurrencyCode) => Promise<void>; };
const AppContext = createContext<AppContextValue | undefined>(undefined);

export function AppProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null); const [profile, setProfile] = useState<Profile>(); const [loading, setLoading] = useState(true);
  useEffect(() => {
    let stopProfile: (() => void) | undefined;
    const stopAuth = onAuthStateChanged(auth, (nextUser) => { void (async () => {
      stopProfile?.(); setUser(nextUser);
      if (!nextUser) { setProfile(undefined); setLoading(false); return; }
      await profileRepository.ensure(nextUser.uid, nextUser.email ?? '', nextUser.displayName ?? 'Homeowner');
      void projectMemberRepository.syncDisplayName(nextUser.uid, nextUser.displayName ?? 'Homeowner').catch(() => undefined);
      stopProfile = profileRepository.watch(nextUser.uid, (nextProfile) => { if (!nextProfile) void profileRepository.ensure(nextUser.uid, nextUser.email ?? '', nextUser.displayName ?? 'Homeowner'); setProfile(nextProfile); }); setLoading(false);
    })(); });
    return () => { stopProfile?.(); stopAuth(); };
  }, []);
  const value = useMemo<AppContextValue>(() => ({ user, profile, loading, currency: profile?.currency ?? 'INR', setCurrency: async (currency) => { if (user) await profileRepository.currency(user.uid, currency); } }), [user, profile, loading]);
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
export function useApp() { const value = useContext(AppContext); if (!value) throw new Error('useApp must be used within AppProvider'); return value; }
