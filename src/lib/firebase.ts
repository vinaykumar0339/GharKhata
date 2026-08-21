import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth, initializeAuth, type Auth, type Persistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { Platform } from 'react-native';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || 'AIzaSyCgnV792WRLlQtPKSaYLeWdWAHxAohLosY',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || 'gharkhata-b6513.firebaseapp.com',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || 'gharkhata-b6513',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '282716307967',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || '1:282716307967:web:5d54b60d0379e4ae9e67ca',
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

function createAuth(): Auth {
  if (Platform.OS === 'web') return getAuth(app);
  // Firebase v12 no longer publicly exports its React Native adapter. This
  // adapter implements the same persistence contract with AsyncStorage.
  const nativePersistence = class {
    static type = 'LOCAL';
    type = 'LOCAL' as const;
    async _isAvailable() { try { await AsyncStorage.setItem('__gharkhata_auth_probe', '1'); await AsyncStorage.removeItem('__gharkhata_auth_probe'); return true; } catch { return false; } }
    _set(key: string, value: unknown) { return AsyncStorage.setItem(key, JSON.stringify(value)); }
    async _get(key: string) { const value = await AsyncStorage.getItem(key); return value ? JSON.parse(value) : null; }
    _remove(key: string) { return AsyncStorage.removeItem(key); }
    _addListener() { /* AsyncStorage has no change events. */ }
    _removeListener() { /* AsyncStorage has no change events. */ }
  } as unknown as Persistence;
  try { return initializeAuth(app, { persistence: nativePersistence }); }
  catch { return getAuth(app); }
}

export const auth = createAuth();
export const db = getFirestore(app);
