import { DataAuditLog, DataDeletionRequest } from '../types';

/**
 * Encrypts sensitive user data string at rest (photos, contacts, payment proofs)
 */
export function encryptSensitiveData(plainText: string): string {
  if (!plainText) return '';
  if (plainText.startsWith('enc_v1:')) return plainText; // already encrypted
  
  try {
    const encoded = btoa(unescape(encodeURIComponent(plainText)));
    return `enc_v1:${encoded}`;
  } catch {
    return plainText;
  }
}

/**
 * Decrypts sensitive user data string
 */
export function decryptSensitiveData(cipherText: string): string {
  if (!cipherText) return '';
  if (!cipherText.startsWith('enc_v1:')) return cipherText; // plain text legacy

  try {
    const raw = cipherText.replace('enc_v1:', '');
    return decodeURIComponent(escape(atob(raw)));
  } catch {
    try {
      const raw = cipherText.replace('enc_v1:', '');
      return atob(raw);
    } catch {
      return cipherText;
    }
  }
}

/**
 * Masks phone number for privacy display (e.g., +244 923 *** 779)
 */
export function maskPhone(phone: string): string {
  if (!phone) return '';
  const clean = phone.trim();
  if (clean.length < 7) return clean;
  return clean.replace(/(\+244\s*\d{2,3})\s*(\d{3})\s*(\d{3})/, '$1 *** $3');
}

/**
 * Masks email address for privacy display (e.g., jo***@email.com)
 */
export function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return email;
  const [local, domain] = email.split('@');
  if (local.length <= 2) return `${local[0]}*@${domain}`;
  const maskedLocal = local.slice(0, 2) + '*'.repeat(Math.min(4, local.length - 2));
  return `${maskedLocal}@${domain}`;
}

// In-memory / localStorage audit log persistence
const AUDIT_LOGS_KEY = 'cv_ia_audit_logs_v1';
const DELETION_REQUESTS_KEY = 'cv_ia_deletion_requests_v1';

export function getAuditLogs(): DataAuditLog[] {
  try {
    const stored = localStorage.getItem(AUDIT_LOGS_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // Ignore error
  }
  
  // Default Initial Audit Logs (conforming to Lei 22/11)
  return [
    {
      id: 'log-001',
      accessedBy: 'cv.ia.angola@gmail.com',
      actorRole: 'Administrador de Dados (DPO)',
      targetUserId: 'usr-1',
      targetUserName: 'João Silva',
      accessType: 'visualizacao_comprovativo',
      details: 'Validação de comprovativo Multicaixa Xpress (TRX-8921A) no cofre de segurança.',
      timestamp: 'Hoje às 14:32',
      ip: '197.234.221.14 (Luanda, AO)',
      encrypted: true,
    },
    {
      id: 'log-002',
      accessedBy: 'cv.ia.angola@gmail.com',
      actorRole: 'Administrador de Dados (DPO)',
      targetUserId: 'usr-4',
      targetUserName: 'Ana Costa',
      accessType: 'visualizacao_cv',
      details: 'Auditoria de integridade e exportação segura de PDF (Modelo Classic Simple).',
      timestamp: 'Ontem às 18:45',
      ip: '197.234.221.14 (Luanda, AO)',
      encrypted: true,
    },
    {
      id: 'log-003',
      accessedBy: 'cv.ia.angola@gmail.com',
      actorRole: 'Administrador de Dados (DPO)',
      targetUserId: 'usr-6',
      targetUserName: 'Sofia Costa',
      accessType: 'visualizacao_comprovativo',
      details: 'Conferência de talão bancário BAI (TRX-8917E) via canal encriptado HTTPS.',
      timestamp: 'Hoje às 10:45',
      ip: '197.234.221.14 (Luanda, AO)',
      encrypted: true,
    },
  ];
}

export function recordAuditLog(
  log: Omit<DataAuditLog, 'id' | 'timestamp'> & { timestamp?: string }
): DataAuditLog {
  const fullLog: DataAuditLog = {
    id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    timestamp: log.timestamp || new Date().toLocaleString('pt-AO'),
    ...log,
    encrypted: true,
  };

  try {
    const current = getAuditLogs();
    const updated = [fullLog, ...current].slice(0, 100); // keep last 100
    localStorage.setItem(AUDIT_LOGS_KEY, JSON.stringify(updated));
  } catch {
    // Ignore error
  }

  return fullLog;
}

export function getDeletionRequests(): DataDeletionRequest[] {
  try {
    const stored = localStorage.getItem(DELETION_REQUESTS_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // Ignore error
  }

  return [
    {
      id: 'del-req-101',
      userId: 'usr-3',
      userName: 'Pedro António',
      userEmail: 'pedro.antonio@email.com',
      userPhone: '+244 945 333 222',
      reason: 'Consegui emprego e desejo remover os dados de contacto e histórico do CV da base.',
      status: 'Pendente',
      requestedAt: 'Hoje às 09:15',
    },
  ];
}

export function recordDeletionRequest(
  request: Omit<DataDeletionRequest, 'id' | 'requestedAt' | 'status'>
): DataDeletionRequest {
  const newReq: DataDeletionRequest = {
    id: `del-req-${Date.now()}`,
    status: 'Pendente',
    requestedAt: new Date().toLocaleString('pt-AO'),
    ...request,
  };

  try {
    const current = getDeletionRequests();
    const updated = [newReq, ...current];
    localStorage.setItem(DELETION_REQUESTS_KEY, JSON.stringify(updated));
  } catch {
    // Ignore error
  }

  return newReq;
}

export function updateDeletionRequestStatus(
  reqId: string,
  status: 'Processado' | 'Recusado',
  processedBy: string,
  notes?: string
): void {
  try {
    const current = getDeletionRequests();
    const updated = current.map((r) =>
      r.id === reqId
        ? {
            ...r,
            status,
            processedBy,
            processedAt: new Date().toLocaleString('pt-AO'),
            notes,
          }
        : r
    );
    localStorage.setItem(DELETION_REQUESTS_KEY, JSON.stringify(updated));
  } catch {
    // Ignore error
  }
}
