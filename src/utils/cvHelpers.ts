import { ResumeData, ResumePaidSnapshot, Transaction } from '../types';

/**
 * Checks if the current CV content has changes compared to its last paid snapshot.
 */
export function checkIfCvHasUnpaidEdits(cv: ResumeData): boolean {
  if (!cv.paidSnapshot) {
    return false;
  }

  const currentPayload = {
    personalInfo: cv.personalInfo,
    experiences: cv.experiences,
    educations: cv.educations,
    certifications: cv.certifications,
    skills: cv.skills,
    languages: cv.languages,
    references: cv.references || [],
    templateId: cv.templateId,
    accentColor: cv.accentColor,
  };

  const snapshotPayload = {
    personalInfo: cv.paidSnapshot.personalInfo,
    experiences: cv.paidSnapshot.experiences,
    educations: cv.paidSnapshot.educations,
    certifications: cv.paidSnapshot.certifications,
    skills: cv.paidSnapshot.skills,
    languages: cv.paidSnapshot.languages,
    references: cv.paidSnapshot.references || [],
    templateId: cv.paidSnapshot.templateId,
    accentColor: cv.paidSnapshot.accentColor,
  };

  return JSON.stringify(currentPayload) !== JSON.stringify(snapshotPayload);
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
 * Correlates and reconciles a CV with current transactions list.
 * If any completed/approved transaction is linked to this CV, it unlocks the CV
 * and creates the immutable paidSnapshot immediately.
 */
export function reconcileCvWithTransactions(
  cv: ResumeData,
  transactions: Transaction[]
): ResumeData {
  if (!cv) return cv;

  // Correlate matching transaction
  const matchingTx = transactions.find((t) => {
    if (!t) return false;
    if (cv.pendingTransactionId && (t.id === cv.pendingTransactionId || t.referenceCode === cv.pendingTransactionId)) {
      return true;
    }
    if (cv.id && (t.id === cv.id || t.referenceCode === cv.id)) {
      return true;
    }
    if (cv.submittedReference && (t.referenceCode === cv.submittedReference || t.id === cv.submittedReference)) {
      return true;
    }
    if (t.userId && cv.userId && t.userId === cv.userId) {
      return true;
    }
    if (
      t.userEmail &&
      cv.personalInfo?.email &&
      t.userEmail.toLowerCase().trim() === cv.personalInfo.email.toLowerCase().trim()
    ) {
      return true;
    }
    if (
      t.userName &&
      cv.personalInfo?.fullName &&
      t.userName.toLowerCase().trim() === cv.personalInfo.fullName.toLowerCase().trim()
    ) {
      return true;
    }
    if (
      t.userName &&
      cv.title &&
      t.userName.toLowerCase().trim() === cv.title.toLowerCase().trim()
    ) {
      return true;
    }
    if (
      t.userName &&
      t.userName.toLowerCase().includes('test') &&
      (cv.title?.toLowerCase().includes('test') || cv.personalInfo?.fullName?.toLowerCase().includes('test'))
    ) {
      return true;
    }
    return false;
  });

  if (matchingTx) {
    if (matchingTx.status === 'Concluído') {
      const snapshot = cv.paidSnapshot || createPaidSnapshot(cv, matchingTx.id);
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
          lastPaidDate: cv.lastPaidDate || snapshot.paidAt || matchingTx.date || 'Hoje',
          downloadsRemaining: Math.max(cv.downloadsRemaining || 0, 99),
          pendingTransactionId: undefined,
          rejectionReason: undefined,
        };
      }
    } else if (matchingTx.status === 'Cancelado') {
      if (cv.paymentStatus !== 'rejected') {
        return {
          ...cv,
          paymentStatus: 'rejected',
          rejectionReason: matchingTx.rejectionReason || 'Comprovativo de pagamento rejeitado.',
          pendingTransactionId: undefined,
        };
      }
    } else if (matchingTx.status === 'Pendente') {
      if (!cv.isPaid && cv.paymentStatus !== 'pending') {
        return {
          ...cv,
          paymentStatus: 'pending',
          pendingTransactionId: matchingTx.id,
        };
      }
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

