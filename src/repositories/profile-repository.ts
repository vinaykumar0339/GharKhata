import { doc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { CurrencyCode, Profile } from '@/types/domain';

export const profileRepository = {
  watch(userId: string, callback: (profile: Profile | undefined) => void) { return onSnapshot(doc(db, 'users', userId), (snapshot) => callback(snapshot.exists() ? ({ id: snapshot.id, ...snapshot.data() } as Profile) : undefined), () => callback(undefined)); },
  async create(profile: Omit<Profile, 'id'>) { await setDoc(doc(db, 'users', profile.email ? profile.email : crypto.randomUUID()), profile); },
  async ensure(userId: string, email: string, displayName: string) { await setDoc(doc(db, 'users', userId), { email, displayName, currency: 'INR', createdAt: new Date().toISOString() }, { merge: true }); },
  currency: (userId: string, currency: CurrencyCode) => updateDoc(doc(db, 'users', userId), { currency }),
  selectProject: (userId: string, selectedProjectId: string) => updateDoc(doc(db, 'users', userId), { selectedProjectId }),
};
