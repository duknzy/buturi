import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import {
  getDatabase,
  ref,
  set,
  get,
  onValue,
  Unsubscribe,
} from 'firebase/database';
import { TodoItem } from '../types';

export const firebaseConfig = {
  apiKey: "AIzaSyB55MdhpjJizQaLEdRu-XhBVJ4PqrHsAyY",
  authDomain: "buturi-2449e.firebaseapp.com",
  databaseURL: "https://buturi-2449e-default-rtdb.asia-southeast1.firebasedatabase.app/",
  projectId: "buturi-2449e",
  storageBucket: "buturi-2449e.appspot.com",
  messagingSenderId: "976306696124",
  appId: "1:976306696124:web:e455c1953544bff5c345b9",
};

// Initialize Firebase once
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const database = getDatabase(app);
export const googleProvider = new GoogleAuthProvider();

// Google Sign In
export async function loginWithGoogle(): Promise<User | null> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error('Google Sign-In Error:', error);
    throw error;
  }
}

// Sign Out
export async function logoutUser(): Promise<void> {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Sign-Out Error:', error);
    throw error;
  }
}

// Subscribe to Auth State
export function onUserAuthStateChanged(callback: (user: User | null) => void): Unsubscribe {
  return onAuthStateChanged(auth, callback);
}

// Save Todos to Firebase Cloud
export async function saveTodosToCloud(uid: string, todos: TodoItem[]): Promise<void> {
  if (!uid) return;
  try {
    const todosRef = ref(database, `users/${uid}/todos`);
    // Firebase Realtime Database rejects `undefined` values. Sanitize by serializing.
    const sanitized = JSON.parse(JSON.stringify(todos));
    await set(todosRef, sanitized);
  } catch (error) {
    console.error('Failed to save todos to Firebase:', error);
    throw error;
  }
}

// Load Todos from Firebase Cloud
export async function loadTodosFromCloud(uid: string): Promise<TodoItem[] | null> {
  if (!uid) return null;
  try {
    const todosRef = ref(database, `users/${uid}/todos`);
    const snapshot = await get(todosRef);
    if (snapshot.exists()) {
      const data = snapshot.val();
      if (Array.isArray(data)) {
        return data;
      } else if (typeof data === 'object' && data !== null) {
        return Object.values(data) as TodoItem[];
      }
    }
    return null;
  } catch (error) {
    console.error('Failed to load todos from Firebase:', error);
    return null;
  }
}

// Real-time Subscribe to Todos in Cloud
export function subscribeToCloudTodos(
  uid: string,
  callback: (todos: TodoItem[], exists: boolean) => void
): Unsubscribe {
  const todosRef = ref(database, `users/${uid}/todos`);
  return onValue(todosRef, (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.val();
      if (Array.isArray(data)) {
        callback(data, true);
      } else if (typeof data === 'object' && data !== null) {
        callback(Object.values(data) as TodoItem[], true);
      } else {
        callback([], true);
      }
    } else {
      callback([], false);
    }
  }, (error) => {
    console.error('Realtime Todos listener error:', error);
  });
}
