import { ResumeData, ResumePaidSnapshot, Transaction } from '../types';

/**
 * Deep cleans an object/array removing undefined, null, empty strings and sorting keys
 * so JSON comparison is stable, deterministic and ignores formatting discrepancies.
 */
function cleanValueForCompare(val: any): any {
  if (val === undefined || val === null || val === '') return undefined;
  if (Array.isArray(val)) {
    const cleaned = val
      .map(cleanValueForCompare)
      .filter((v) => v !== undefined && (typeof v !== 'object' || Object.keys(v).length > 0));
    return cleaned.length > 0 ? cleaned : undefined;
  }
  if (typeof val === 'object') {
    const sorted: Record<string, any> = {};
    for (const key of Object.keys(val).sort()) {
      const cleaned = cleanValueForCompare(val[key]);
      if (cleaned !== undefined) {
        sorted[key] = cleaned;
      }
    }
    return Object.keys(sorted).length > 0 ? sorted : undefined;
  }
  if (typeof val === 'string') {
    return val.trim();
  }
  return val;
}

/**
 * Checks if the current CV content has changes compared to its last paid snapshot.
 */
export function checkIfCvHasUnpaidEdits(cv: ResumeData): boolean {
  if (!cv || !cv.paidSnapshot) {
    return false;
  }

  const currentPayload = cleanValueForCompare({
    personalInfo: cv.personalInfo,
    experiences: cv.experiences,
    educations: cv.educations,
    certifications: cv.certifications,
    skills: cv.skills,
    languages: cv.languages,
    references: cv.references,
    templateId: cv.templateId,
    accentColor: cv.accentColor,
  });

  const snapshotPayload = cleanValueForCompare({
    personalInfo: cv.paidSnapshot.personalInfo,
    experiences: cv.paidSnapshot.experiences,
    educations: cv.paidSnapshot.educations,
    certifications: cv.paidSnapshot.certifications,
    skills: cv.paidSnapshot.skills,
    languages: cv.paidSnapshot.languages,
    references: cv.paidSnapshot.references,
    templateId: cv.paidSnapshot.templateId,
    accentColor: cv.paidSnapshot.accentColor,
  });

  return JSON.stringify(currentPayload || {}) !== JSON.stringify(snapshotPayload || {});
}

/**
 * Generates an immutable snapshot of the CV when payment is approved.
 */
export function createPaidSnapshot(cv: ResumeData, txId?: string): ResumePaidSnapshot {
  const now = new Date();
  const day = now.getDate().toString().padStart(2, '0');
  const month = now.toLocaleString('pt-AO', { month: 'short' });
  const year = now.getFullYear();
  const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return {
    personalInfo: JSON.parse(JSON.stringify(cv.personalInfo)),
    experiences: JSON.parse(JSON.stringify(cv.experiences)),
    educations: JSON.parse(JSON.stringify(cv.educations)),
    certifications: JSON.parse(JSON.stringify(cv.certifications)),
    skills: JSON.parse(JSON.stringify(cv.skills)),
    languages: JSON.parse(JSON.stringify(cv.languages)),
    references: cv.references ? JSON.parse(JSON.stringify(cv.references)) : [],
    templateId: cv.templateId,
    accentColor: cv.accentColor,
    paidAt: `${day} ${month} ${year} às ${time}`,
    txId: txId || cv.pendingTransactionId,
  };
}

/**
 * Reconstructs a full ResumeData from its paid snapshot for free re-downloading.
 */
export function getPaidSnapshotAsResume(cv: ResumeData): ResumeData {
  if (!cv.paidSnapshot) {
    return cv;
  }

  return {
    ...cv,
    title: `${cv.title} (Versão Paga)`,
    templateId: cv.paidSnapshot.templateId,
    accentColor: cv.paidSnapshot.accentColor,
    personalInfo: JSON.parse(JSON.stringify(cv.paidSnapshot.personalInfo)),
    experiences: JSON.parse(JSON.stringify(cv.paidSnapshot.experiences)),
    educations: JSON.parse(JSON.stringify(cv.paidSnapshot.educations)),
    certifications: JSON.parse(JSON.stringify(cv.paidSnapshot.certifications)),
    skills: JSON.parse(JSON.stringify(cv.paidSnapshot.skills)),
    languages: JSON.parse(JSON.stringify(cv.paidSnapshot.languages)),
    references: cv.paidSnapshot.references ? JSON.parse(JSON.stringify(cv.paidSnapshot.references)) : [],
    isPaid: true,
    paymentStatus: 'approved',
    downloadsRemaining: 99,
  };
}

/**
 * Creates an independent duplicate of an existing CV for a family member or new application.
 * RULE: The duplicated CV MUST be an independent, unpaid draft (2.000 Kz required).
 */
export function duplicateResumeForFamily(
  sourceCv: ResumeData,
  newTitle?: string,
  newPersonName?: string,
  userId?: string
): ResumeData {
  const now = new Date();
  const day = now.getDate().toString().padStart(2, '0');
  const month = now.toLocaleString('pt-AO', { month: 'short' });
  const year = now.getFullYear();
  const dateFormatted = `${day} ${month} ${year}`;

  const clonedPersonalInfo = JSON.parse(JSON.stringify(sourceCv.personalInfo));
  if (newPersonName && newPersonName.trim()) {
    clonedPersonalInfo.fullName = newPersonName.trim();
  }

  return {
    id: `cv-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    userId: userId || sourceCv.userId || 'usr-guest',
    title: newTitle?.trim() || `Cópia de ${sourceCv.title || 'Currículo'}`,
    targetPersonName: newPersonName?.trim() || sourceCv.targetPersonName,
    createdAt: dateFormatted,
    updatedAt: 'Criado agora (Cópia independente)',
    templateId: sourceCv.templateId,
    accentColor: sourceCv.accentColor,
    // STRICT BUSINESS RULE: Duplicated CVs are always new and unpaid!
    isPaid: false,
    paymentStatus: 'none',
    pendingTransactionId: undefined,
    rejectionReason: undefined,
    submittedPaymentMethod: undefined,
    submittedReference: undefined,
    paidSnapshot: undefined,
    hasUnpaidEdits: false,
    downloadCount: 0,
    downloadsRemaining: 0,
    personalInfo: clonedPersonalInfo,
    experiences: JSON.parse(JSON.stringify(sourceCv.experiences)),
    educations: JSON.parse(JSON.stringify(sourceCv.educations)),
    certifications: JSON.parse(JSON.stringify(sourceCv.certifications)),
    skills: JSON.parse(JSON.stringify(sourceCv.skills)),
    languages: JSON.parse(JSON.stringify(sourceCv.languages)),
    references: sourceCv.references ? JSON.parse(JSON.stringify(sourceCv.references)) : [],
  };
}

/**
 * Checks if a transaction relates to a specific CV document based on IDs, references, or candidate details.
 */
export function isCvMatchingTransaction(cv: ResumeData, t: Transaction): boolean {
  if (!cv || !t) return false;

  // 1. Direct pending transaction link
  if (cv.pendingTransactionId && (t.id === cv.pendingTransactionId || t.referenceCode === cv.pendingTransactionId)) {
    return true;
  }

  // 2. Paid snapshot transaction link
  if (cv.paidSnapshot?.txId && (t.id === cv.paidSnapshot.txId || t.referenceCode === cv.paidSnapshot.txId)) {
    return true;
  }

  // 3. Document ID matching
  if (cv.id && (t.id === cv.id || t.referenceCode === cv.id || (t as any).cvId === cv.id || (t as any).targetCvId === cv.id)) {
    return true;
  }

  // 4. Submitted payment reference code
  if (cv.submittedReference && (t.referenceCode === cv.submittedReference || t.id === cv.submittedReference)) {
    return true;
  }

  // 5. User ID matching (for authenticated accounts)
  if (t.userId && cv.userId && t.userId === cv.userId && t.userId !== 'usr-admin-cviaangola' && t.userId !== 'usr-guest' && t.userId !== 'guest_user') {
    return true;
  }

  // 6. User / Candidate email matching
  if (
    t.userEmail &&
    cv.personalInfo?.email &&
    t.userEmail.toLowerCase().trim() === cv.personalInfo.email.toLowerCase().trim()
  ) {
    return true;
  }

  // 7. Candidate full name matching
  if (
    t.userName &&
    cv.personalInfo?.fullName &&
    t.userName.toLowerCase().trim() === cv.personalInfo.fullName.toLowerCase().trim()
  ) {
    return true;
  }

  // 8. CV Title matching
  if (
    t.userName &&
    cv.title &&
    t.userName.toLowerCase().trim() === cv.title.toLowerCase().trim()
  ) {
    return true;
  }

  return false;
}

/**
 * Checks if a CV is paid/approved either directly on the document or via an approved transaction.
 */
export function isCvPaidOrApproved(
  cv: ResumeData,
  transactions: Transaction[] = [],
  isAdmin: boolean = false
): boolean {
  if (isAdmin) return true;
  if (!cv) return false;

  const hasUnpaidEdits = checkIfCvHasUnpaidEdits(cv);
  if ((cv.isPaid === true || cv.paymentStatus === 'approved') && !hasUnpaidEdits) {
    return true;
  }

  // Cross-reference with transactions: if any matching transaction is approved/completed
  const completedTx = transactions.find(
    (t) =>
      ((t.status || '').toLowerCase() === 'concluído' ||
        (t.status || '').toLowerCase() === 'concluido' ||
        (t.status || '').toLowerCase() === 'aprovado' ||
        (t.status || '').toLowerCase() === 'approved') &&
      isCvMatchingTransaction(cv, t)
  );

  if (completedTx && !hasUnpaidEdits) {
    return true;
  }

  return false;
}

/**
 * Checks if a CV has a payment currently pending review.
 */
export function isCvPendingApproval(
  cv: ResumeData,
  transactions: Transaction[] = [],
  isAdmin: boolean = false
): boolean {
  if (isAdmin) return false;
  if (!cv) return false;

  if (isCvPaidOrApproved(cv, transactions, isAdmin)) return false;
  if (cv.paidSnapshot && checkIfCvHasUnpaidEdits(cv)) return false; // marked as modified after payment

  // Check if any matching transaction is pending
  const pendingTx = transactions.find((t) => {
    if (!isCvMatchingTransaction(cv, t)) return false;
    const s = (t.status || '').toLowerCase();
    return s === 'pendente' || s === 'pending';
  });

  if (pendingTx) {
    return true;
  }

  if (cv.paymentStatus === 'pending' || Boolean(cv.pendingTransactionId)) {
    return cv.paymentStatus !== 'rejected';
  }

  return false;
}

/**
 * Checks if a CV payment was rejected.
 */
export function isCvRejected(
  cv: ResumeData,
  transactions: Transaction[] = [],
  isAdmin: boolean = false
): boolean {
  if (isAdmin) return false;
  if (!cv) return false;
  if (isCvPaidOrApproved(cv, transactions, isAdmin)) return false;
  if (cv.paymentStatus === 'rejected') return true;

  const rejectedTx = transactions.find(
    (t) =>
      ((t.status || '').toLowerCase() === 'cancelado' ||
        (t.status || '').toLowerCase() === 'rejeitado' ||
        (t.status || '').toLowerCase() === 'rejected') &&
      isCvMatchingTransaction(cv, t)
  );

  return Boolean(rejectedTx);
}

/**
 * Correlates and reconciles a CV with current transactions list.
 * If any completed/approved transaction is linked to this CV, it unlocks the CV
 * and creates the immutable paidSnapshot immediately.
 */
export function reconcileCvWithTransactions(
  cv: ResumeData,
  transactions: Transaction[]
): ResumeData {
  if (!cv || !transactions || transactions.length === 0) return cv;

  // 1. First Priority: Check if ANY matching transaction is completed/approved
  const approvedTx = transactions.find((t) => {
    const s = (t.status || '').toLowerCase();
    return (s === 'concluído' || s === 'concluido' || s === 'aprovado' || s === 'approved') && isCvMatchingTransaction(cv, t);
  });

  if (approvedTx) {
    const snapshot = cv.paidSnapshot || createPaidSnapshot(cv, approvedTx.id);
    const isAlreadyUnlocked =
      cv.isPaid === true &&
      cv.paymentStatus === 'approved' &&
      cv.pendingTransactionId === undefined &&
      Boolean(cv.paidSnapshot);

    if (!isAlreadyUnlocked) {
      return {
        ...cv,
        paymentStatus: 'approved',
        isPaid: true,
        paidSnapshot: snapshot,
        hasUnpaidEdits: false,
        lastPaidDate: cv.lastPaidDate || snapshot.paidAt || approvedTx.date || 'Hoje',
        downloadsRemaining: Math.max(cv.downloadsRemaining || 0, 99),
        pendingTransactionId: undefined,
        rejectionReason: undefined,
      };
    }
    return cv;
  }

  // 2. Second Priority: Check if matching transaction is pending
  const pendingTx = transactions.find((t) => {
    const s = (t.status || '').toLowerCase();
    return (s === 'pendente' || s === 'pending') && isCvMatchingTransaction(cv, t);
  });

  if (pendingTx) {
    if (!cv.isPaid && cv.paymentStatus !== 'pending') {
      return {
        ...cv,
        paymentStatus: 'pending',
        pendingTransactionId: pendingTx.id,
      };
    }
    return cv;
  }

  // 3. Third Priority: Check if matching transaction was rejected
  const rejectedTx = transactions.find((t) => {
    const s = (t.status || '').toLowerCase();
    return (s === 'cancelado' || s === 'rejeitado' || s === 'rejected') && isCvMatchingTransaction(cv, t);
  });

  if (rejectedTx) {
    if (cv.paymentStatus !== 'rejected') {
      return {
        ...cv,
        paymentStatus: 'rejected',
        rejectionReason: rejectedTx.rejectionReason || 'Comprovativo de pagamento rejeitado.',
        pendingTransactionId: undefined,
      };
    }
  }

  return cv;
}

export function reconcileAllResumesWithTransactions(
  resumes: ResumeData[],
  transactions: Transaction[]
): ResumeData[] {
  return resumes.map((cv) => reconcileCvWithTransactions(cv, transactions));
}


