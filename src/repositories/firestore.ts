import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, limit, onSnapshot, orderBy, query, setDoc, updateDoc, where, type DocumentData, type QueryConstraint, type Unsubscribe } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const stamp = () => new Date().toISOString();

export function fromDoc<T>(snapshot: { id: string; data: () => DocumentData }): T { return { id: snapshot.id, ...snapshot.data() } as T; }

export async function createOwned<T extends { ownerId: string }>(path: string, value: Omit<T, 'id' | 'createdAt' | 'updatedAt'>) {
  const created = await addDoc(collection(db, path), { ...value, createdAt: stamp(), updatedAt: stamp() });
  return created.id;
}

export function listenOwned<T>(path: string, ownerId: string, constraints: QueryConstraint[], callback: (items: T[]) => void, onError?: (error: Error) => void, useOwnerFilter = true): Unsubscribe {
  const filters = useOwnerFilter ? [where('ownerId', '==', ownerId), ...constraints] : constraints;
  return onSnapshot(query(collection(db, path), ...filters),
    (snapshot) => callback(snapshot.docs.map((item) => fromDoc<T>(item))), (error) => { callback([]); onError?.(error); });
}

export async function listOwned<T>(path: string, ownerId: string, constraints: QueryConstraint[] = []) {
  const result = await getDocs(query(collection(db, path), where('ownerId', '==', ownerId), ...constraints));
  return result.docs.map((item) => fromDoc<T>(item));
}

export async function getOwned<T>(path: string, id: string, ownerId: string) {
  const result = await getDoc(doc(db, path, id));
  if (!result.exists() || result.data().ownerId !== ownerId) return undefined;
  return fromDoc<T>(result);
}

export async function updateOwned(path: string, id: string, ownerId: string, changes: Record<string, unknown>) {
  const target = doc(db, path, id); const existing = await getDoc(target);
  if (!existing.exists() || existing.data().ownerId !== ownerId) throw new Error('permission-denied');
  await updateDoc(target, { ...changes, updatedAt: stamp() });
}

export async function deleteOwned(path: string, id: string, ownerId: string) {
  const target = doc(db, path, id); const existing = await getDoc(target);
  if (!existing.exists() || existing.data().ownerId !== ownerId) throw new Error('permission-denied');
  await deleteDoc(target);
}

export async function putOwned(path: string, id: string, value: Record<string, unknown>) {
  await setDoc(doc(db, path, id), { ...value, updatedAt: stamp() }, { merge: true });
}

export const newestFirst = [orderBy('date', 'desc'), limit(150)];
