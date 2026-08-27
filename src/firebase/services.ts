import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './config';
import type { ResumeData, AppUser, Transaction, ReviewItem, SupportTicket, SystemSettings } from '../types';

// Helper to recursively remove undefined properties for Firestore
function cleanForFirestore<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) {
    return obj.map((item) => cleanForFirestore(item)) as unknown as T;
  }
  if (typeof obj === 'object') {
    const cleaned: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj as Record<string, any>)) {
      if (value !== undefined) {
        cleaned[key] = cleanForFirestore(value);
      }
    }
    return cleaned as T;
  }
  return obj;
}

// Collection References
export const usersCol = collection(db, 'users');
export const resumesCol = collection(db, 'resumes');
export const transactionsCol = collection(db, 'transactions');
export const reviewsCol = collection(db, 'reviews');
export const ticketsCol = collection(db, 'tickets');
export const settingsCol = collection(db, 'settings');
export const auditLogsCol = collection(db, 'audit_logs');

// ==========================================
// RESUME SERVICES
// ==========================================

export async function saveResumeToCloud(resume: ResumeData): Promise<void> {
  try {
    if (!resume.id) return;
    const resumeRef = doc(db, 'resumes', resume.id);
    const cleaned = cleanForFirestore({
      ...resume,
      _syncedAt: new Date().toISOString(),
    });
    await setDoc(resumeRef, cleaned, { merge: true });
  } catch (err) {
    console.warn('Could not sync resume to Firestore (will use local copy):', err);
  }
}

export async function deleteResumeFromCloud(resumeId: string): Promise<void> {
  try {
    if (!resumeId) return;
    const resumeRef = doc(db, 'resumes', resumeId);
    await deleteDoc(resumeRef);
  } catch (err) {
    console.warn('Could not delete resume from Firestore:', err);
  }
}

export function subscribeAllResumes(onUpdate: (resumes: ResumeData[]) => void) {
  try {
    return onSnapshot(
      resumesCol,
      (snapshot) => {
        const list: ResumeData[] = [];
        snapshot.forEach((docSnap) => {
          list.push(docSnap.data() as ResumeData);
        });
        if (list.length > 0) {
          onUpdate(list);
        }
      },
      (error) => {
        console.warn('All resumes listener disconnected:', error);
      }
    );
  } catch (err) {
    console.warn('Error subscribing to all resumes:', err);
    return () => {};
  }
}

export async function fetchResumesFromCloud(): Promise<ResumeData[]> {
  try {
    const snap = await getDocs(resumesCol);
    const list: ResumeData[] = [];
    snap.forEach((docSnap) => {
      list.push(docSnap.data() as ResumeData);
    });
    return list;
  } catch (err) {
    console.warn('[Firestore] Erro ao obter currículos:', err);
    return [];
  }
}

export function subscribeUserResumes(
  userId: string,
  onUpdate: (resumes: ResumeData[]) => void
) {
  try {
    const q = query(resumesCol, where('userId', '==', userId));
    return onSnapshot(q, (snapshot) => {
      const list: ResumeData[] = [];
      snapshot.forEach((docSnap) => {
        list.push(docSnap.data() as ResumeData);
      });
      if (list.length > 0) {
        onUpdate(list);
      }
    }, (error) => {
      console.warn('Resumes listener disconnected or permission denied:', error);
    });
  } catch (err) {
    console.warn('Error subscribing to resumes:', err);
    return () => {};
  }
}

// ==========================================
// USER SERVICES
// ==========================================

export async function saveUserToCloud(user: AppUser): Promise<void> {
  try {
    if (!user.id) return;
    const userRef = doc(db, 'users', user.id);
    const cleaned = cleanForFirestore({
      ...user,
      _lastActive: new Date().toISOString(),
    });
    await setDoc(userRef, cleaned, { merge: true });
  } catch (err) {
    console.warn('Could not sync user to Firestore:', err);
  }
}

export function subscribeAllUsers(onUpdate: (users: AppUser[]) => void) {
  try {
    return onSnapshot(usersCol, (snapshot) => {
      const list: AppUser[] = [];
      snapshot.forEach((docSnap) => {
        list.push(docSnap.data() as AppUser);
      });
      if (list.length > 0) {
        onUpdate(list);
      }
    }, (error) => {
      console.warn('Users listener disconnected:', error);
    });
  } catch {
    return () => {};
  }
}

// ==========================================
// TRANSACTION SERVICES
// ==========================================

export async function saveTransactionToCloud(tx: Transaction): Promise<boolean> {
  try {
    if (!tx || !tx.id) return false;
    const txRef = doc(db, 'transactions', tx.id);
    
    // Ensure large base64 payload is safety-checked (Firestore doc limit is 1MB)
    let receiptUrlToSave = tx.receiptUrl;
    if (receiptUrlToSave && receiptUrlToSave.startsWith('data:') && receiptUrlToSave.length > 600000) {
      console.warn('Receipt base64 data exceeds safe limit for Firestore document; optimizing payload.');
    }

    const payload = cleanForFirestore({
      ...tx,
      receiptUrl: receiptUrlToSave,
      _syncedAt: new Date().toISOString(),
    });

    await setDoc(txRef, payload, { merge: true });
    console.log(`[Firestore] Transação ${tx.id} gravada com sucesso na coleção 'transactions'.`);
    return true;
  } catch (err) {
    console.error(`[Firestore] Erro ao gravar transação ${tx.id}:`, err);
    return false;
  }
}

export async function fetchTransactionsFromCloud(): Promise<Transaction[]> {
  try {
    const snap = await getDocs(transactionsCol);
    const list: Transaction[] = [];
    snap.forEach((docSnap) => {
      list.push(docSnap.data() as Transaction);
    });
    return list;
  } catch (err) {
    console.warn('[Firestore] Erro ao obter transações:', err);
    return [];
  }
}

export function subscribeTransactions(onUpdate: (transactions: Transaction[]) => void) {
  try {
    return onSnapshot(transactionsCol, (snapshot) => {
      const list: Transaction[] = [];
      snapshot.forEach((docSnap) => {
        list.push(docSnap.data() as Transaction);
      });
      if (list.length > 0) {
        // Sort FIFO or recent
        list.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        onUpdate(list);
      }
    }, (error) => {
      console.warn('Transactions listener error:', error);
    });
  } catch {
    return () => {};
  }
}

// ==========================================
// REVIEW SERVICES
// ==========================================

export async function saveReviewToCloud(review: ReviewItem): Promise<void> {
  try {
    if (!review.id) return;
    const reviewRef = doc(db, 'reviews', review.id);
    await setDoc(reviewRef, review, { merge: true });
  } catch (err) {
    console.warn('Could not sync review to Firestore:', err);
  }
}

export function subscribeReviews(onUpdate: (reviews: ReviewItem[]) => void) {
  try {
    return onSnapshot(reviewsCol, (snapshot) => {
      const list: ReviewItem[] = [];
      snapshot.forEach((docSnap) => {
        list.push(docSnap.data() as ReviewItem);
      });
      if (list.length > 0) {
        onUpdate(list);
      }
    }, (error) => {
      console.warn('Reviews listener error:', error);
    });
  } catch {
    return () => {};
  }
}

// ==========================================
// SETTINGS & LOGS SERVICES
// ==========================================

export async function saveSettingsToCloud(settings: SystemSettings): Promise<void> {
  try {
    const settingsRef = doc(db, 'settings', 'global');
    await setDoc(settingsRef, settings, { merge: true });
  } catch (err) {
    console.warn('Could not sync settings to Firestore:', err);
  }
}

export async function logAuditToCloud(action: string, by: string, details?: any): Promise<void> {
  try {
    const logId = `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const logRef = doc(db, 'audit_logs', logId);
    await setDoc(logRef, {
      id: logId,
      action,
      by,
      details: details || {},
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.warn('Could not log audit to Firestore:', err);
  }
}
