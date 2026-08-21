import { createUserWithEmailAndPassword, sendPasswordResetEmail, signInWithEmailAndPassword, signOut, updateProfile } from 'firebase/auth';
import { auth } from '@/lib/firebase';
export const authRepository = {
  login: (email: string, password: string) => signInWithEmailAndPassword(auth, email.trim().toLowerCase(), password),
  async signup(name: string, email: string, password: string) { const credential = await createUserWithEmailAndPassword(auth, email.trim().toLowerCase(), password); await updateProfile(credential.user, { displayName: name.trim() }); return credential; },
  resetPassword: (email: string) => sendPasswordResetEmail(auth, email.trim().toLowerCase()),
  logout: () => signOut(auth),
};
