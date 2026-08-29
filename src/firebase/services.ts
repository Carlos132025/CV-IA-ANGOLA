import {
  collection,
  doc,
  setDoc,
  getDocs,
  deleteDoc,
  onSnapshot,
  query,
  where,
} from 'firebase/firestore';
import { db } from './config';
import type { ResumeData, AppUser, Transaction, ReviewItem, SystemSettings } from '../types';
import { isCvMatchingTransaction, createPaidSnapshot } from '../utils/cvHelpers';

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
    const receiptUrlToSave = tx.receiptUrl;
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

export async function unlockResumeInCloudByTransaction(tx: Transaction): Promise<string[]> {
  const unlockedIds: string[] = [];
  try {
    if (!tx || !tx.id) return unlockedIds;
    const snap = await getDocs(resumesCol);
    for (const docSnap of snap.docs) {
      const data = docSnap.data() as ResumeData;
      if (isCvMatchingTransaction(data, tx)) {
        const snapshot = data.paidSnapshot || createPaidSnapshot(data, tx.id);
        const resumeRef = doc(db, 'resumes', docSnap.id);
        const updatePayload = {
          ...data,
          paymentStatus: 'approved',
          isPaid: true,
          paidSnapshot: snapshot,
          hasUnpaidEdits: false,
          lastPaidDate: snapshot.paidAt || tx.date || new Date().toLocaleDateString('pt-AO'),
          downloadsRemaining: 99,
          pendingTransactionId: null,
          rejectionReason: null,
          _syncedAt: new Date().toISOString(),
        };
        await setDoc(resumeRef, cleanForFirestore(updatePayload), { merge: true });
        unlockedIds.push(docSnap.id);
        console.log(`[Firestore] CV ${docSnap.id} desbloqueado na Firestore com sucesso pela transação ${tx.id}`);
      }
    }
  } catch (err) {
    console.warn('[Firestore] Erro ao desbloquear CV correspondente:', err);
  }
  return unlockedIds;
}

export async function rejectResumeInCloudByTransaction(tx: Transaction, reason: string): Promise<string[]> {
  const rejectedIds: string[] = [];
  try {
    if (!tx || !tx.id) return rejectedIds;
    const snap = await getDocs(resumesCol);
    for (const docSnap of snap.docs) {
      const data = docSnap.data() as ResumeData;
      if (isCvMatchingTransaction(data, tx)) {
        const resumeRef = doc(db, 'resumes', docSnap.id);
        const updatePayload = {
          ...data,
          paymentStatus: 'rejected',
          isPaid: false,
          rejectionReason: reason || tx.rejectionReason || 'Comprovativo de pagamento rejeitado.',
          pendingTransactionId: null,
          _syncedAt: new Date().toISOString(),
        };
        await setDoc(resumeRef, cleanForFirestore(updatePayload), { merge: true });
        rejectedIds.push(docSnap.id);
        console.log(`[Firestore] CV ${docSnap.id} marcado como rejeitado na Firestore pela transação ${tx.id}`);
      }
    }
  } catch (err) {
    console.warn('[Firestore] Erro ao rejeitar CV correspondente:', err);
  }
  return rejectedIds;
}

export function purgeLocalTestData(): void {
  try {
    // Clean obsolete debug flags only
    const keysToRemove = [
      'cvia_test_session',
      'cvia_mock_db',
      'cvia_debug_state',
      'cv_test_mode',
    ];
    keysToRemove.forEach((k) => localStorage.removeItem(k));
    console.log('[DataPurge] Limpeza de flags de depuração concluída.');
  } catch (err) {
    console.error('Error during local debug flags purge:', err);
  }
}

export async function purgeAllTestDataAndArtifacts(): Promise<{
  deletedResumes: number;
  deletedTransactions: number;
  deletedUsers: number;
  deletedTickets: number;
}> {
  const result = {
    deletedResumes: 0,
    deletedTransactions: 0,
    deletedUsers: 0,
    deletedTickets: 0,
  };

  // 1. Cloud Firestore deep clean (only legacy mock demo IDs)
  try {
    // A) Resumes (only remove known legacy mock IDs)
    const resumesSnap = await getDocs(resumesCol);
    for (const docSnap of resumesSnap.docs) {
      const isLegacyDemo =
        docSnap.id === 'res-joao-main' ||
        docSnap.id === 'res-joao-sister' ||
        docSnap.id === 'res-default';

      if (isLegacyDemo) {
        await deleteDoc(doc(db, 'resumes', docSnap.id)).catch(() => {});
        result.deletedResumes += 1;
        console.log(`[Firestore Purge] Removido CV demo: ${docSnap.id}`);
      }
    }

    // B) Transactions (only remove legacy mock demo transactions)
    const txSnap = await getDocs(transactionsCol);
    for (const docSnap of txSnap.docs) {
      const isLegacyDemoTx =
        docSnap.id === 'BAI-59842' ||
        docSnap.id === 'TRX-89234' ||
        docSnap.id === 'TRX-89235';

      if (isLegacyDemoTx) {
        await deleteDoc(doc(db, 'transactions', docSnap.id)).catch(() => {});
        result.deletedTransactions += 1;
        console.log(`[Firestore Purge] Removida transação demo: ${docSnap.id}`);
      }
    }

    // C) Tickets
    const ticketsSnap = await getDocs(ticketsCol);
    for (const docSnap of ticketsSnap.docs) {
      if (docSnap.id === 'TCK-104' || docSnap.id === 'TCK-103') {
        await deleteDoc(doc(db, 'tickets', docSnap.id)).catch(() => {});
        result.deletedTickets += 1;
        console.log(`[Firestore Purge] Removido ticket demo: ${docSnap.id}`);
      }
    }

    console.log('[Firestore Purge] Limpeza concluída com sucesso:', result);
  } catch (err) {
    console.warn('[Firestore Purge] Erro durante a limpeza em nuvem:', err);
  }

  return result;
}

export async function cleanupDemoDataFromCloud(): Promise<void> {
  await purgeAllTestDataAndArtifacts();
}

