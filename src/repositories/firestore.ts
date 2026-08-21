import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, limit, onSnapshot, orderBy, query, setDoc, updateDoc, where, type DocumentData, type QueryConstraint, type Unsubscribe } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const stamp = () => new Date().toISOString();

export function fromDoc<T>(snapshot: { id: string; data: () => DocumentData }): T { return { id: snapshot.id, ...snapshot.data() } as T; }

export async function createRecord<T>(path: string, value: Omit<T, 'id' | 'createdAt' | 'updatedAt'>) {
  const created = await addDoc(collection(db, path), { ...value, createdAt: stamp(), updatedAt: stamp() });
  return created.id;
}

export function listenRecords<T>(path: string, constraints: QueryConstraint[], callback: (items: T[]) => void, onError?: (error: Error) => void): Unsubscribe {
  const filters = constraints;
  return onSnapshot(query(collection(db, path), ...filters),
    (snapshot) => callback(snapshot.docs.map((item) => fromDoc<T>(item))), (error) => { callback([]); onError?.(error); });
}

export async function putRecord(path: string, id: string, value: Record<string, unknown>) {
  await setDoc(doc(db, path, id), { ...value, updatedAt: stamp() }, { merge: true });
}

export const newestFirst = [orderBy('date', 'desc'), limit(150)];
