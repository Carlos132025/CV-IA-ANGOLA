import React, { useState, useEffect, useCallback, Suspense, lazy } from 'react';
import { AdminTab, AppUser, CVTemplate, ResumeData, ReviewItem, SupportTicket, SystemSettings, Transaction, UserView } from './types';
import { INITIAL_RESUME, INITIAL_REVIEWS, INITIAL_SETTINGS, INITIAL_TEMPLATES, INITIAL_TICKETS, INITIAL_TRANSACTIONS, INITIAL_USERS, INITIAL_USER_CVS, createNewEmptyResume } from './data/initialData';

// Eager User Components (Initial Landing Shell)
import { UserHeader } from './components/user/UserHeader';
import { LandingView } from './components/user/LandingView';
import { LoadingFallback } from './components/common/LoadingFallback';
import { ToastNotification, ToastOptions, ToastType } from './components/common/ToastNotification';
import type { AuthMode } from './components/auth/AuthModal';

// Lazy Loaded User Sub-components
const CVBuilderWizard = lazy(() => import('./components/user/CVBuilderWizard').then(m => ({ default: m.CVBuilderWizard })));
const MyCVsView = lazy(() => import('./components/user/MyCVsView').then(m => ({ default: m.MyCVsView })));
const ReviewsView = lazy(() => import('./components/user/ReviewsView').then(m => ({ default: m.ReviewsView })));
const LegalView = lazy(() => import('./components/user/LegalView').then(m => ({ default: m.LegalView })));
const PolicyModal = lazy(() => import('./components/user/PolicyModal').then(m => ({ default: m.PolicyModal })));
const AccountModal = lazy(() => import('./components/user/AccountModal').then(m => ({ default: m.AccountModal })));
const AuthModal = lazy(() => import('./components/auth/AuthModal').then(m => ({ default: m.AuthModal })));

// Lazy Loaded Admin Components
const AdminSidebar = lazy(() => import('./components/admin/AdminSidebar').then(m => ({ default: m.AdminSidebar })));
const AdminHeader = lazy(() => import('./components/admin/AdminHeader').then(m => ({ default: m.AdminHeader })));
const DashboardView = lazy(() => import('./components/admin/DashboardView').then(m => ({ default: m.DashboardView })));
const PendingPaymentsView = lazy(() => import('./components/admin/PendingPaymentsView').then(m => ({ default: m.PendingPaymentsView })));
const RejectPaymentModal = lazy(() => import('./components/admin/RejectPaymentModal').then(m => ({ default: m.RejectPaymentModal })));
const UsersView = lazy(() => import('./components/admin/UsersView').then(m => ({ default: m.UsersView })));
const SalesView = lazy(() => import('./components/admin/SalesView').then(m => ({ default: m.SalesView })));
const TemplatesView = lazy(() => import('./components/admin/TemplatesView').then(m => ({ default: m.TemplatesView })));
const SettingsView = lazy(() => import('./components/admin/SettingsView').then(m => ({ default: m.SettingsView })));
const SupportView = lazy(() => import('./components/admin/SupportView').then(m => ({ default: m.SupportView })));
const DataPrivacyAuditView = lazy(() => import('./components/admin/DataPrivacyAuditView').then(m => ({ default: m.DataPrivacyAuditView })));

import { sendStatusUpdateDiscordNotification } from './utils/discordNotification';
import { encryptSensitiveData, decryptSensitiveData } from './utils/security';
import {
  createPaidSnapshot,
  duplicateResumeForFamily,
  reconcileCvWithTransactions,
  reconcileAllResumesWithTransactions,
} from './utils/cvHelpers';
import { testFirestoreConnection } from './firebase/config';
import {
  saveResumeToCloud,
  deleteResumeFromCloud,
  saveUserToCloud,
  saveTransactionToCloud,
  saveReviewToCloud,
  saveSettingsToCloud,
  subscribeTransactions,
  subscribeAllUsers,
  subscribeReviews,
  subscribeAllResumes,
} from './firebase/services';

export function App() {
  // Mode switcher: 'admin' for backoffice management, 'user' for CV creation flow
  const [appMode, setAppMode] = useState<'admin' | 'user'>('user');
  
  // Admin state
  const [adminTab, setAdminTab] = useState<AdminTab>('pending-payments');
  const [adminSearch, setAdminSearch] = useState('');
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const [txToReject, setTxToReject] = useState<Transaction | null>(null);
  const [adminMobileSidebarOpen, setAdminMobileSidebarOpen] = useState(false);

  // User state
  const [userView, setUserView] = useState<UserView>('home');
  const [currentUser, setCurrentUser] = useState<AppUser | null>(() => {
    try {
      const stored = localStorage.getItem('cv_current_user_v1');
      if (stored) {
        const decrypted = decryptSensitiveData(stored);
        const parsed = JSON.parse(decrypted);
        if (parsed && parsed.id && parsed.email) {
          return parsed;
        }
      }
    } catch {
      // Fallback
    }
    return null;
  });

  // Multi-CV Database State (Array of all user CVs)
  const [userResumes, setUserResumes] = useState<ResumeData[]>(() => {
    try {
      const encryptedAll = localStorage.getItem('cv_all_resumes_v1');
      if (encryptedAll) {
        const decrypted = decryptSensitiveData(encryptedAll);
        const parsed = JSON.parse(decrypted);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // Fallback
    }
    return JSON.parse(JSON.stringify(INITIAL_USER_CVS));
  });

  // Active CV in builder
  const [resumeData, setResumeData] = useState<ResumeData>(() => {
    try {
      const encrypted = localStorage.getItem('cv_resume_encrypted_v1');
      if (encrypted) {
        const decrypted = decryptSensitiveData(encrypted);
        return JSON.parse(decrypted);
      }
    } catch {
      // Fallback
    }
    return userResumes[0] || JSON.parse(JSON.stringify(INITIAL_RESUME));
  });

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<AuthMode>('login');
  const [showPolicyModal, setShowPolicyModal] = useState(false);
  const [policyModalTab, setPolicyModalTab] = useState<'privacy' | 'terms' | 'refund'>('privacy');
  const [showAccountModal, setShowAccountModal] = useState(false);

  // Shared platform state
  const [users, setUsers] = useState<AppUser[]>(() => {
    try {
      const stored = localStorage.getItem('cv_users_list_v1');
      if (stored) {
        const decrypted = decryptSensitiveData(stored);
        const parsed = JSON.parse(decrypted);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // Fallback
    }
    return INITIAL_USERS;
  });
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    try {
      const stored = localStorage.getItem('cv_transactions_v1');
      if (stored) {
        const decrypted = decryptSensitiveData(stored);
        const parsed = JSON.parse(decrypted);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const map = new Map(INITIAL_TRANSACTIONS.map((t) => [t.id, t]));
          parsed.forEach((t: Transaction) => map.set(t.id, { ...map.get(t.id), ...t }));
          return Array.from(map.values()).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        }
      }
    } catch {
      // Fallback
    }
    return INITIAL_TRANSACTIONS;
  });
  const [templates, setTemplates] = useState<CVTemplate[]>(INITIAL_TEMPLATES);
  const [settings, setSettings] = useState<SystemSettings>(INITIAL_SETTINGS);
  const [tickets, setTickets] = useState<SupportTicket[]>(INITIAL_TICKETS);
  const [reviews, setReviews] = useState<ReviewItem[]>(INITIAL_REVIEWS);

  // Notification & Welcome Toast State
  const [activeToast, setActiveToast] = useState<ToastOptions | null>(null);

  const showToast = useCallback((msgOrOptions: string | ToastOptions) => {
    if (typeof msgOrOptions === 'string') {
      const isWelcome = msgOrOptions.toLowerCase().includes('bem-vindo');
      const isSuccess =
        msgOrOptions.toLowerCase().includes('sucesso') ||
        msgOrOptions.toLowerCase().includes('aprovado') ||
        msgOrOptions.toLowerCase().includes('desbloqueado') ||
        msgOrOptions.toLowerCase().includes('publicada');
      const isError =
        msgOrOptions.toLowerCase().includes('erro') ||
        msgOrOptions.toLowerCase().includes('rejeitad') ||
        msgOrOptions.toLowerCase().includes('eliminad') ||
        msgOrOptions.toLowerCase().includes('recusad') ||
        msgOrOptions.toLowerCase().includes('restrito');

      const toastType: ToastType = isWelcome
        ? 'welcome'
        : isSuccess
        ? 'success'
        : isError
        ? 'error'
        : 'info';

      const toastTitle = isWelcome
        ? 'Boas-vindas'
        : isSuccess
        ? 'Operação Concluída'
        : isError
        ? 'Aviso do Sistema'
        : undefined;

      setActiveToast({
        message: msgOrOptions,
        title: toastTitle,
        type: toastType,
        duration: isWelcome ? 7000 : 5500,
      });
    } else {
      setActiveToast({
        ...msgOrOptions,
        duration: msgOrOptions.duration || 6000,
      });
    }
  }, []);

  // Initial Welcome Notification when entering the application
  useEffect(() => {
    try {
      const alreadyGreeted = sessionStorage.getItem('cv_app_welcome_greeted_v2');
      if (!alreadyGreeted) {
        sessionStorage.setItem('cv_app_welcome_greeted_v2', 'true');
        const timer = setTimeout(() => {
          if (currentUser) {
            showToast({
              type: 'welcome',
              title: `Bem-vindo de volta, ${currentUser.name}!`,
              message: 'Os seus currículos estão guardados e prontos para edição, personalização com IA ou download em PDF.',
              duration: 7000,
            });
          } else {
            showToast({
              type: 'welcome',
              title: 'Bem-vindo ao Lumina CV IA Angola!',
              message: 'Crie o seu currículo profissional adaptado às exigências das empresas em Angola com apoio de Inteligência Artificial.',
              duration: 7500,
              actionLabel: 'Criar Meu CV',
              onAction: () => {
                setUserView('builder');
              },
            });
          }
        }, 700);
        return () => clearTimeout(timer);
      }
    } catch {
      // Ignore storage errors in restricted preview sandbox
    }
  }, [currentUser, showToast]);

  // Validate connection to Firestore at initial boot and sync initial state
  useEffect(() => {
    testFirestoreConnection().then((connected) => {
      if (connected) {
        console.log('Connected to Firebase Firestore successfully.');
        // Ensure pending initial transactions (like BAI-59842) are registered in Firestore
        INITIAL_TRANSACTIONS.forEach((tx) => {
          saveTransactionToCloud(tx);
        });
        // Ensure initial CVs are registered in Firestore
        INITIAL_USER_CVS.forEach((cv) => {
          saveResumeToCloud(cv);
        });
      }
    });

    // Real-time Firestore subscriptions for transactions, resumes, reviews, and users
    const unsubTx = subscribeTransactions((cloudTxs) => {
      if (cloudTxs && cloudTxs.length > 0) {
        setTransactions((prev) => {
          const map = new Map(prev.map((t) => [t.id, t]));
          cloudTxs.forEach((t) => map.set(t.id, { ...map.get(t.id), ...t }));
          return Array.from(map.values()).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        });
      }
    });

    const unsubResumes = subscribeAllResumes((cloudResumes) => {
      if (cloudResumes && cloudResumes.length > 0) {
        setUserResumes((prev) => {
          const map = new Map(prev.map((c) => [c.id, c]));
          cloudResumes.forEach((c) => {
            const existing = map.get(c.id);
            map.set(c.id, existing ? { ...existing, ...c } : c);
          });
          return Array.from(map.values());
        });

        setResumeData((prev) => {
          const matchingCloud = cloudResumes.find((c) => c.id === prev.id);
          if (
            matchingCloud &&
            (matchingCloud.paymentStatus !== prev.paymentStatus ||
              matchingCloud.isPaid !== prev.isPaid ||
              matchingCloud.pendingTransactionId !== prev.pendingTransactionId)
          ) {
            return { ...prev, ...matchingCloud };
          }
          return prev;
        });
      }
    });

    const unsubUsers = subscribeAllUsers((cloudUsers) => {
      if (cloudUsers && cloudUsers.length > 0) {
        setUsers((prev) => {
          const map = new Map(prev.map((u) => [u.id, u]));
          cloudUsers.forEach((u) => map.set(u.id, { ...map.get(u.id), ...u }));
          return Array.from(map.values());
        });
      }
    });

    const unsubReviews = subscribeReviews((cloudReviews) => {
      if (cloudReviews && cloudReviews.length > 0) {
        setReviews((prev) => {
          const map = new Map(prev.map((r) => [r.id, r]));
          cloudReviews.forEach((r) => map.set(r.id, { ...map.get(r.id), ...r }));
          return Array.from(map.values());
        });
      }
    });

    return () => {
      unsubTx();
      unsubResumes();
      unsubUsers();
      unsubReviews();
    };
  }, []);

  // Automatic Real-Time Reconciliation: whenever transactions change, reconcile all resumes immediately
  useEffect(() => {
    if (!transactions || transactions.length === 0) return;

    setUserResumes((prev) => {
      let hasChange = false;
      const reconciled = prev.map((cv) => {
        const nextCv = reconcileCvWithTransactions(cv, transactions);
        if (
          nextCv.paymentStatus !== cv.paymentStatus ||
          nextCv.isPaid !== cv.isPaid ||
          nextCv.pendingTransactionId !== cv.pendingTransactionId ||
          Boolean(nextCv.paidSnapshot) !== Boolean(cv.paidSnapshot)
        ) {
          hasChange = true;
          saveResumeToCloud(nextCv);
          return nextCv;
        }
        return cv;
      });

      if (hasChange) {
        try {
          const serialized = JSON.stringify(reconciled);
          const encrypted = encryptSensitiveData(serialized);
          localStorage.setItem('cv_all_resumes_v1', encrypted);
        } catch {}
        return reconciled;
      }
      return prev;
    });

    setResumeData((prev) => {
      const nextCv = reconcileCvWithTransactions(prev, transactions);
      if (
        nextCv.paymentStatus !== prev.paymentStatus ||
        nextCv.isPaid !== prev.isPaid ||
        nextCv.pendingTransactionId !== prev.pendingTransactionId ||
        Boolean(nextCv.paidSnapshot) !== Boolean(prev.paidSnapshot)
      ) {
        try {
          const serialized = JSON.stringify(nextCv);
          const encrypted = encryptSensitiveData(serialized);
          localStorage.setItem('cv_resume_encrypted_v1', encrypted);
          saveResumeToCloud(nextCv);
        } catch {}
        return nextCv;
      }
      return prev;
    });
  }, [transactions]);

  // Persist currentUser session securely
  useEffect(() => {
    try {
      if (currentUser) {
        const serialized = JSON.stringify(currentUser);
        const encrypted = encryptSensitiveData(serialized);
        localStorage.setItem('cv_current_user_v1', encrypted);
        saveUserToCloud(currentUser);
      } else {
        localStorage.removeItem('cv_current_user_v1');
      }
    } catch {
      // Ignore
    }
  }, [currentUser]);

  // Persist users list securely
  useEffect(() => {
    try {
      const serialized = JSON.stringify(users);
      const encrypted = encryptSensitiveData(serialized);
      localStorage.setItem('cv_users_list_v1', encrypted);
    } catch {
      // Ignore
    }
  }, [users]);

  // Sync active CV changes to userResumes list and save encrypted at rest (Lei 22/11) + Firestore
  useEffect(() => {
    const timer = setTimeout(() => {
      setUserResumes((prev) => {
        const exists = prev.some((c) => c.id === resumeData.id);
        if (exists) {
          return prev.map((c) => (c.id === resumeData.id ? resumeData : c));
        }
        return [resumeData, ...prev];
      });

      try {
        if (resumeData && resumeData.personalInfo) {
          const serialized = JSON.stringify(resumeData);
          const encrypted = encryptSensitiveData(serialized);
          localStorage.setItem('cv_resume_encrypted_v1', encrypted);
          saveResumeToCloud(resumeData);
        }
      } catch {
        // Ignore sandbox quota errors
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [resumeData]);

  // Persist all resumes array
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        if (userResumes && userResumes.length > 0) {
          const serialized = JSON.stringify(userResumes);
          const encrypted = encryptSensitiveData(serialized);
          localStorage.setItem('cv_all_resumes_v1', encrypted);
          // Sync each resume to cloud
          userResumes.forEach((r) => saveResumeToCloud(r));
        }
      } catch {
        // Ignore
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [userResumes]);

  // Persist transactions securely + backup to encrypted localStorage
  useEffect(() => {
    try {
      if (transactions && transactions.length > 0) {
        const serialized = JSON.stringify(transactions);
        const encrypted = encryptSensitiveData(serialized);
        localStorage.setItem('cv_transactions_v1', encrypted);
      }
    } catch {
      // Ignore
    }
  }, [transactions]);

  // Strictly check if active user is the official administrator
  const isSpecificAdmin = Boolean(
    currentUser &&
    (currentUser.email?.toLowerCase().trim() === 'cv.ia.angola@gmail.com' ||
     currentUser.email?.toLowerCase().trim() === 'admin.prospekta@gmail.com') &&
    currentUser.role === 'admin'
  );

  // Check URL routes & enforce strict protection for /admin
  useEffect(() => {
    const handleUrlRoute = () => {
      const hash = window.location.hash.toLowerCase();
      const path = window.location.pathname.toLowerCase();

      if (hash === '#admin' || hash.startsWith('#/admin') || path === '/admin' || path.startsWith('/admin/')) {
        if (!isSpecificAdmin) {
          setAppMode('user');
          setUserView('home');
          window.location.hash = '';
          setAuthModalMode('login');
          setShowAuthModal(true);
          showToast('Acesso restrito ao Administrador (cv.ia.angola@gmail.com). Inicie sessão.');
        } else {
          setAppMode('admin');
        }
      } else if (hash === '#builder' || hash.startsWith('#/builder')) {
        setAppMode('user');
        setUserView('builder');
      } else if (hash === '#reviews' || hash.startsWith('#/reviews') || hash === '#avaliacoes') {
        setAppMode('user');
        setUserView('reviews');
      } else if (hash === '#privacidade' || hash === '#/politica-privacidade' || hash === '#politica-privacidade' || path === '/politica-privacidade') {
        setAppMode('user');
        setUserView('privacy');
      } else if (hash === '#termos' || hash === '#/termos-de-uso' || hash === '#termos-de-uso' || path === '/termos-de-uso') {
        setAppMode('user');
        setUserView('terms');
      }
    };

    handleUrlRoute();
    window.addEventListener('hashchange', handleUrlRoute);
    window.addEventListener('popstate', handleUrlRoute);
    return () => {
      window.removeEventListener('hashchange', handleUrlRoute);
      window.removeEventListener('popstate', handleUrlRoute);
    };
  }, [isSpecificAdmin, showToast]);

  // Handle adding user review
  const handleAddReview = (newReview: ReviewItem) => {
    setReviews((prev) => [newReview, ...prev]);
    saveReviewToCloud(newReview);
  };

  // Update user password
  const handleUpdateUserPassword = (userId: string, newPass: string) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, password: newPass } : u))
    );
    showToast('Palavra-passe atualizada com sucesso.');
  };

  const handleOpenAuth = (mode: AuthMode = 'login') => {
    if (mode === 'profile' && currentUser) {
      setShowAccountModal(true);
      return;
    }
    setAuthModalMode(mode);
    setShowAuthModal(true);
  };

  // Delete user account (under Lei 22/11 Data Deletion Rights)
  const handleDeleteUser = (userId: string) => {
    setUsers((prev) => prev.filter((u) => u.id !== userId));
    if (currentUser?.id === userId) {
      setCurrentUser(null);
      setResumeData(JSON.parse(JSON.stringify(INITIAL_RESUME)));
      setUserView('home');
      setAppMode('user');
      localStorage.removeItem('cv_resume_encrypted_v1');
    }
    showToast('Conta e dados pessoais eliminados definitivamente da base de dados.');
  };

  // Toggle user active status
  const handleToggleUserStatus = (userId: string) => {
    setUsers((prev) =>
      prev.map((u) =>
        u.id === userId
          ? { ...u, status: u.status === 'Ativo' ? 'Suspenso' : 'Ativo' }
          : u
      )
    );
    showToast('Estado do utilizador atualizado com sucesso.');
  };

  // Add new user
  const handleAddUser = (newUserData: Omit<AppUser, 'id'>) => {
    const isSpecialAdmin =
      newUserData.email?.toLowerCase().trim() === 'cv.ia.angola@gmail.com' ||
      newUserData.email?.toLowerCase().trim() === 'admin.prospekta@gmail.com';
    const newUser: AppUser = {
      ...newUserData,
      role: isSpecialAdmin ? 'admin' : (newUserData.role || 'user'),
      id: `usr-${Date.now()}`,
    };
    setUsers((prev) => [newUser, ...prev]);
    saveUserToCloud(newUser);
    showToast(`Utilizador ${newUser.name} adicionado.`);
  };

  // Multi-CV CRUD & Selection Handlers
  const handleSelectCVToEdit = (cv: ResumeData) => {
    setResumeData(cv);
    setUserView('builder');
  };

  const handleCreateNewCV = (newCV: ResumeData) => {
    setUserResumes((prev) => [newCV, ...prev]);
    setResumeData(newCV);
    saveResumeToCloud(newCV);
    setUserView('builder');
  };

  const handleDuplicateCV = (cv: ResumeData) => {
    const duplicated = duplicateResumeForFamily(cv, currentUser?.id || 'usr-guest');
    setUserResumes((prev) => [duplicated, ...prev]);
    saveResumeToCloud(duplicated);
    showToast(`Currículo duplicado como "${duplicated.title}". Cada novo CV requer pagamento individual.`);
  };

  const handleDeleteCV = (cvId: string) => {
    deleteResumeFromCloud(cvId);
    setUserResumes((prev) => {
      const filtered = prev.filter((c) => c.id !== cvId);
      if (resumeData.id === cvId) {
        if (filtered.length > 0) {
          setResumeData(filtered[0]);
        } else {
          const fresh = createNewEmptyResume(currentUser?.id || 'usr-guest', 'Meu Currículo');
          setResumeData(fresh);
          saveResumeToCloud(fresh);
          return [fresh];
        }
      }
      return filtered;
    });
    showToast('Currículo eliminado com sucesso.');
  };

  const handleUpdateCVTitle = (cvId: string, newTitle: string) => {
    setUserResumes((prev) =>
      prev.map((c) => (c.id === cvId ? { ...c, title: newTitle } : c))
    );
    if (resumeData.id === cvId) {
      setResumeData((prev) => ({ ...prev, title: newTitle }));
    }
  };

  // Flow to start CV Builder
  const handleStartBuilder = (selectedTemplateId?: string) => {
    if (selectedTemplateId) {
      setResumeData((prev) => ({ ...prev, templateId: selectedTemplateId }));
    }
    
    // Check if user is authenticated
    if (!currentUser) {
      handleOpenAuth('register_input');
      showToast('Cadastre-se ou inicie sessão para começar a criar o seu currículo.');
    } else {
      setUserView('builder');
    }
  };

  // Approve manual transaction with Discord sync & audit logs
  const handleApproveTransaction = async (txId: string) => {
    const targetTx = transactions.find((t) => t.id === txId);

    setTransactions((prev) =>
      prev.map((t) => {
        if (t.id === txId) {
          const updatedLogs = [
            ...(t.auditLogs || []),
            {
              id: `log-${Date.now()}-appr`,
              action: 'aprovado' as const,
              timestamp: new Date().toLocaleString(),
              by: currentUser?.name || 'Administrador Central',
              role: 'Administrador',
            },
          ];
          const updatedTx: Transaction = {
            ...t,
            status: 'Concluído',
            auditLogs: updatedLogs,
            reviewedAt: new Date().toLocaleString(),
            reviewedBy: currentUser?.name || 'Admin Prospekta',
          };
          saveTransactionToCloud(updatedTx);
          return updatedTx;
        }
        return t;
      })
    );

    const isCvMatching = (c: ResumeData) => {
      if (c.pendingTransactionId && c.pendingTransactionId === txId) return true;
      if (c.id === txId) return true;
      if (targetTx) {
        if (targetTx.userId && c.userId === targetTx.userId) return true;
        if (
          targetTx.userName &&
          c.personalInfo.fullName &&
          c.personalInfo.fullName.toLowerCase().trim() === targetTx.userName.toLowerCase().trim()
        ) {
          return true;
        }
        if (
          targetTx.userEmail &&
          c.personalInfo.email &&
          c.personalInfo.email.toLowerCase().trim() === targetTx.userEmail.toLowerCase().trim()
        ) {
          return true;
        }
        if (
          targetTx.userName &&
          targetTx.userName.toLowerCase().includes('test') &&
          (c.title.toLowerCase().includes('test') || c.personalInfo.fullName.toLowerCase().includes('test'))
        ) {
          return true;
        }
      }
      return (!c.isPaid && c.paymentStatus === 'pending');
    };

    const unlockCv = (c: ResumeData): ResumeData => {
      const snapshot = createPaidSnapshot(c, txId);
      return {
        ...c,
        paymentStatus: 'approved',
        isPaid: true,
        paidSnapshot: snapshot,
        hasUnpaidEdits: false,
        lastPaidDate: snapshot.paidAt,
        downloadsRemaining: 99,
        pendingTransactionId: undefined,
        rejectionReason: undefined,
      };
    };

    // Update active resumeData if it matches
    setResumeData((prev) => {
      if (isCvMatching(prev)) {
        const unlocked = unlockCv(prev);
        try {
          const serialized = JSON.stringify(unlocked);
          const encrypted = encryptSensitiveData(serialized);
          localStorage.setItem('cv_resume_encrypted_v1', encrypted);
          saveResumeToCloud(unlocked);
        } catch {}
        return unlocked;
      }
      return prev;
    });

    // Update all matching CVs in userResumes list
    setUserResumes((prev) => {
      const updatedList = prev.map((c) => {
        if (isCvMatching(c)) {
          const unlocked = unlockCv(c);
          saveResumeToCloud(unlocked);
          return unlocked;
        }
        return c;
      });
      try {
        const serialized = JSON.stringify(updatedList);
        const encrypted = encryptSensitiveData(serialized);
        localStorage.setItem('cv_all_resumes_v1', encrypted);
      } catch {}
      return updatedList;
    });

    // Notify Discord channel of approval
    if (targetTx) {
      try {
        await sendStatusUpdateDiscordNotification({
          txId: targetTx.id,
          userName: targetTx.userName,
          status: 'Aprovado',
          method: targetTx.method,
          amount: targetTx.amount,
        });
      } catch (err) {
        console.warn('Erro ao notificar status no Discord:', err);
      }
    }

    showToast(`Transação ${txId} aprovada com sucesso. CV desbloqueado.`);
  };

  // Trigger rejection modal
  const handleOpenRejectModal = (txId: string) => {
    const tx = transactions.find((t) => t.id === txId);
    if (tx) {
      setTxToReject(tx);
    }
  };

  // Reject manual transaction with Discord sync, reason, audit logs and anti-fraud counter
  const handleConfirmRejectTransaction = async (txId: string, reason: string) => {
    const targetTx = transactions.find((t) => t.id === txId);
    
    setTransactions((prev) =>
      prev.map((t) => {
        if (t.id === txId) {
          const newRejectedCount = (t.rejectedAttemptsCount || 0) + 1;
          const isSuspicious = newRejectedCount >= 3;
          const updatedLogs = [
            ...(t.auditLogs || []),
            {
              id: `log-${Date.now()}-rej`,
              action: 'rejeitado' as const,
              timestamp: new Date().toLocaleString(),
              by: currentUser?.name || 'Administrador Central',
              role: 'Administrador',
              note: reason,
            },
          ];
          const updatedTx: Transaction = {
            ...t,
            status: 'Cancelado',
            rejectionReason: reason,
            rejectedAttemptsCount: newRejectedCount,
            isSuspicious,
            auditLogs: updatedLogs,
            reviewedAt: new Date().toLocaleString(),
            reviewedBy: currentUser?.name || 'Admin Prospekta',
          };
          saveTransactionToCloud(updatedTx);
          return updatedTx;
        }
        return t;
      })
    );

    // Update user CV builder state with rejection reason
    setResumeData((prev) => {
      if (prev.pendingTransactionId === txId || prev.paymentStatus === 'pending') {
        return {
          ...prev,
          paymentStatus: 'rejected',
          rejectionReason: reason,
          isPaid: false,
          downloadsRemaining: 0,
        };
      }
      return prev;
    });

    // Update matching in userResumes
    setUserResumes((prev) =>
      prev.map((c) => {
        if (c.pendingTransactionId === txId || c.paymentStatus === 'pending') {
          return {
            ...c,
            paymentStatus: 'rejected',
            rejectionReason: reason,
            isPaid: false,
            downloadsRemaining: 0,
          };
        }
        return c;
      })
    );

    // Notify Discord channel of rejection
    if (targetTx) {
      try {
        await sendStatusUpdateDiscordNotification({
          txId: targetTx.id,
          userName: targetTx.userName,
          status: 'Rejeitado',
          method: targetTx.method,
          amount: targetTx.amount,
          rejectionReason: reason,
        });
      } catch (err) {
        console.warn('Erro ao notificar status no Discord:', err);
      }
    }

    showToast(`Transação ${txId} rejeitada. Motivo: ${reason}`);
    setTxToReject(null);
  };

  // Toggle template
  const handleToggleTemplate = (templateId: string) => {
    setTemplates((prev) =>
      prev.map((t) =>
        t.id === templateId ? { ...t, isActive: !t.isActive } : t
      )
    );
    showToast('Disponibilidade do modelo atualizada.');
  };

  // Save settings
  const handleSaveSettings = (newSettings: SystemSettings) => {
    setSettings(newSettings);
    saveSettingsToCloud(newSettings);
    showToast('Definições guardadas com sucesso.');
  };

  // Reply to ticket
  const handleReplyTicket = (ticketId: string, replyText: string) => {
    setTickets((prev) =>
      prev.map((t) =>
        t.id === ticketId ? { ...t, reply: replyText, status: 'Fechado' } : t
      )
    );
    showToast(`Resposta enviada para o ticket ${ticketId}.`);
  };

  // Handle submitted proof from user checkout
  const handleUserPaymentSubmitted = (
    data: {
      txId: string;
      method: 'Multicaixa' | 'Transferência';
      referenceCode?: string;
      senderLast4?: string;
      senderName?: string;
      receiptFileName?: string;
      receiptFileSize?: string;
      receiptMimeType?: string;
      receiptUploadedAt?: string;
      receiptUrl?: string;
    },
    targetCvId?: string
  ) => {
    const activeCv = (targetCvId ? userResumes.find((c) => c.id === targetCvId) : null) || resumeData;

    const candidateName =
      activeCv.personalInfo.fullName?.trim() ||
      data.senderName?.trim() ||
      currentUser?.name ||
      'Candidato CV IA';

    const newTx: Transaction = {
      id: data.txId,
      userId: currentUser?.id || activeCv.userId || 'usr-guest',
      userName: candidateName,
      userEmail: activeCv.personalInfo.email || currentUser?.email || 'cliente@email.ao',
      userPhone: activeCv.personalInfo.phone || '+244 923 845 779',
      userAvatar: activeCv.personalInfo.photoUrl,
      userInitials: candidateName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || 'CV',
      amount: settings.basePriceKz,
      method: data.method,
      date: 'Hoje',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      timestamp: Date.now(),
      status: 'Pendente',
      templateName: templates.find((t) => t.id === activeCv.templateId)?.name || 'Lumina Modern',
      referenceCode: data.referenceCode,
      senderLast4: data.senderLast4,
      senderName: data.senderName || candidateName,
      receiptFileName: data.receiptFileName,
      receiptFileSize: data.receiptFileSize,
      receiptMimeType: data.receiptMimeType,
      receiptUploadedAt: data.receiptUploadedAt,
      receiptUrl: data.receiptUrl,
      notifiedDiscord: true,
      rejectedAttemptsCount: 0,
      isSuspicious: false,
      auditLogs: [
        {
          id: `log-${Date.now()}-sub`,
          action: 'submetido',
          timestamp: new Date().toLocaleString(),
          by: candidateName,
          role: 'Cliente',
        },
      ],
    };

    setTransactions((prev) => [newTx, ...prev]);
    saveTransactionToCloud(newTx);

    // Update the specific CV in userResumes
    setUserResumes((prev) =>
      prev.map((c) => {
        if (c.id === activeCv.id) {
          const updated = {
            ...c,
            paymentStatus: 'pending' as const,
            pendingTransactionId: data.txId,
            submittedPaymentMethod: data.method,
            submittedReference: data.referenceCode,
            isPaid: false,
            downloadsRemaining: 0,
            rejectionReason: undefined,
          };
          saveResumeToCloud(updated);
          return updated;
        }
        return c;
      })
    );

    if (resumeData.id === activeCv.id) {
      setResumeData((prev) => ({
        ...prev,
        paymentStatus: 'pending',
        pendingTransactionId: data.txId,
        submittedPaymentMethod: data.method,
        submittedReference: data.referenceCode,
        isPaid: false,
        downloadsRemaining: 0,
        rejectionReason: undefined,
      }));
    }

    showToast('Comprovativo submetido! Notificação enviada para validação no Discord.');
  };

  // Handle immediate payment success
  const handleUserPaymentSuccess = (
    method: 'Multicaixa' | 'Transferência',
    txId: string,
    targetCvId?: string
  ) => {
    const activeCv = (targetCvId ? userResumes.find((c) => c.id === targetCvId) : null) || resumeData;

    const newTx: Transaction = {
      id: txId,
      userId: currentUser?.id || activeCv.userId || 'usr-guest',
      userName: activeCv.personalInfo.fullName || currentUser?.name || 'Candidato CV IA',
      userEmail: activeCv.personalInfo.email || currentUser?.email || 'cliente@email.ao',
      userAvatar: activeCv.personalInfo.photoUrl,
      userInitials: 'CV',
      amount: settings.basePriceKz,
      method: method,
      date: 'Hoje',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      timestamp: Date.now(),
      status: 'Concluído',
      templateName: templates.find((t) => t.id === activeCv.templateId)?.name || 'Lumina Modern',
    };

    setTransactions((prev) => [newTx, ...prev]);

    setUserResumes((prev) =>
      prev.map((c) => {
        if (c.id === activeCv.id) {
          const snapshot = createPaidSnapshot(c, txId);
          return {
            ...c,
            paymentStatus: 'approved',
            isPaid: true,
            paidSnapshot: snapshot,
            hasUnpaidEdits: false,
            lastPaidDate: snapshot.paidAt,
            downloadsRemaining: 99,
          };
        }
        return c;
      })
    );

    if (resumeData.id === activeCv.id) {
      const snapshot = createPaidSnapshot(resumeData, txId);
      setResumeData((prev) => ({
        ...prev,
        paymentStatus: 'approved',
        isPaid: true,
        paidSnapshot: snapshot,
        hasUnpaidEdits: false,
        lastPaidDate: snapshot.paidAt,
        downloadsRemaining: 99,
      }));
    }

    showToast('Pagamento validado com sucesso!');
  };

  const userCVsForCurrentAccount = userResumes.filter((c) => {
    if (!currentUser) return true;
    if (currentUser.role === 'admin') return true;
    if (c.userId && c.userId === currentUser.id) return true;
    if (
      currentUser.email &&
      c.personalInfo?.email &&
      currentUser.email.toLowerCase().trim() === c.personalInfo.email.toLowerCase().trim()
    ) {
      return true;
    }
    if (!c.userId || c.userId === 'usr-guest' || c.userId === 'guest_user') return true;
    return false;
  });

  return (
    <div className="min-h-screen bg-surface text-on-surface font-sans antialiased flex flex-col selection:bg-primary-fixed-dim selection:text-primary">
      {/* Global High-Contrast Accessible Toast Notification */}
      <ToastNotification toast={activeToast} onClose={() => setActiveToast(null)} />

      {/* Notifications Modal for Admin */}
      {showNotificationsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-on-surface/50 backdrop-blur-xs">
          <div className="bg-surface-container-lowest rounded-2xl max-w-md w-full p-6 shadow-2xl border border-surface-border animate-in fade-in duration-150">
            <div className="flex items-center justify-between border-b border-surface-border pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">
                  notifications
                </span>
                <h3 className="font-display text-base font-bold text-on-surface">
                  Notificações do Sistema
                </h3>
              </div>
              <button
                onClick={() => setShowNotificationsModal(false)}
                className="text-on-surface-variant p-1 rounded-lg hover:bg-surface-container"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="py-4 space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-error-container/30 border border-error/20 flex gap-3">
                <span className="material-symbols-outlined text-error text-[18px]">warning</span>
                <div>
                  <p className="font-bold text-on-error-container">
                    {transactions.filter((t) => t.status === 'Pendente').length} Comprovativos Pendentes
                  </p>
                  <p className="text-on-surface-variant text-[11px] mt-0.5">Transferências bancárias e Multicaixa aguardando validação manual.</p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-surface-container-low border border-surface-border flex gap-3">
                <span className="material-symbols-outlined text-emerald-600 text-[18px]">payments</span>
                <div>
                  <p className="font-bold text-on-surface">Canal de Notificações Discord</p>
                  <p className="text-on-surface-variant text-[11px] mt-0.5">Webhook sincronizado para novos comprovativos (@everyone).</p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowNotificationsModal(false)}
              className="w-full py-2.5 rounded-xl bg-surface-container-high text-xs font-bold text-on-surface hover:bg-surface-container cursor-pointer"
            >
              Fechar
            </button>
          </div>
        </div>
      )}

      {/* ADMIN MODE - Strictly accessible ONLY when authenticated as cv.ia.angola@gmail.com */}
      {appMode === 'admin' && isSpecificAdmin && (
        <Suspense fallback={<LoadingFallback message="A carregar Painel Administrativo..." minHeight="min-h-screen" />}>
          <div className="flex min-h-screen relative w-full overflow-x-hidden">
            {/* Sidebar (Overlay on Mobile, Fixed on Desktop) */}
            <AdminSidebar
              activeTab={adminTab}
              setActiveTab={(tab) => {
                setAdminTab(tab);
                setAdminMobileSidebarOpen(false);
              }}
              pendingCount={transactions.filter((t) => t.status === 'Pendente').length}
              onExitAdmin={() => {
                setAdminMobileSidebarOpen(false);
                setAppMode('user');
              }}
              onNavigateMyCVs={() => {
                setAdminMobileSidebarOpen(false);
                setAppMode('user');
                setUserView('my-cvs');
              }}
              currentUser={currentUser}
              isOpenOnMobile={adminMobileSidebarOpen}
              onCloseMobile={() => setAdminMobileSidebarOpen(false)}
            />

            {/* Main Content Area - 100% width on mobile (ml-0), offset on desktop (md:ml-72) */}
            <div className="flex-1 ml-0 md:ml-72 flex flex-col min-h-screen w-full max-w-full">
              <AdminHeader
                searchQuery={adminSearch}
                setSearchQuery={setAdminSearch}
                onOpenUserApp={() => {
                  setAdminMobileSidebarOpen(false);
                  setAppMode('user');
                }}
                onNavigateMyCVs={() => {
                  setAdminMobileSidebarOpen(false);
                  setAppMode('user');
                  setUserView('my-cvs');
                }}
                unreadCount={transactions.filter((t) => t.status === 'Pendente').length}
                onOpenNotifications={() => setShowNotificationsModal(true)}
                currentUser={currentUser}
                onToggleMobileSidebar={() => setAdminMobileSidebarOpen((prev) => !prev)}
              />

              {/* View Switching */}
              <main className="flex-1 mt-16 sm:mt-20 p-3 sm:p-5 md:p-6 pb-20 overflow-y-auto w-full">
                {adminTab === 'pending-payments' && (
                  <PendingPaymentsView
                    transactions={transactions}
                    onApproveTransaction={handleApproveTransaction}
                    onRejectTransaction={handleOpenRejectModal}
                  />
                )}

                {adminTab === 'dashboard' && (
                  <DashboardView
                    transactions={transactions}
                    onApproveTransaction={handleApproveTransaction}
                    onRejectTransaction={handleConfirmRejectTransaction}
                    onNavigateToSales={() => setAdminTab('sales')}
                    onNavigateToUsers={() => setAdminTab('users')}
                  />
                )}

                {adminTab === 'users' && (
                  <UsersView
                    users={users}
                    onToggleUserStatus={handleToggleUserStatus}
                    onAddUser={handleAddUser}
                  />
                )}

                {adminTab === 'sales' && (
                  <SalesView
                    transactions={transactions}
                    onApproveTransaction={handleApproveTransaction}
                    onRejectTransaction={handleConfirmRejectTransaction}
                  />
                )}

                {adminTab === 'templates' && (
                  <TemplatesView
                    templates={templates}
                    onToggleTemplate={handleToggleTemplate}
                    onPreviewTemplate={(tpl) => {
                      setResumeData((prev) => ({ ...prev, templateId: tpl.id }));
                      setAppMode('user');
                      setUserView('builder');
                    }}
                  />
                )}

                {adminTab === 'settings' && (
                  <SettingsView
                    settings={settings}
                    onSaveSettings={handleSaveSettings}
                    templates={templates}
                    onToggleTemplate={handleToggleTemplate}
                  />
                )}

                {adminTab === 'support' && (
                  <SupportView
                    tickets={tickets}
                    onReplyTicket={handleReplyTicket}
                  />
                )}

                {adminTab === 'audit' && (
                  <DataPrivacyAuditView
                    currentUserEmail={currentUser?.email || 'cv.ia.angola@gmail.com'}
                    onDeleteUserAccount={handleDeleteUser}
                    onToast={showToast}
                  />
                )}
              </main>
            </div>
          </div>
        </Suspense>
      )}

      {/* Reject Payment Reason Modal */}
      {txToReject && (
        <Suspense fallback={<LoadingFallback message="A abrir..." minHeight="min-h-[100px]" />}>
          <RejectPaymentModal
            transaction={txToReject}
            onConfirmReject={handleConfirmRejectTransaction}
            onClose={() => setTxToReject(null)}
          />
        </Suspense>
      )}

      {/* USER CLIENT MODE */}
      {(appMode === 'user' || !isSpecificAdmin) && (
        <div className="flex flex-col min-h-screen bg-surface">
          <UserHeader
            currentView={userView}
            setCurrentView={setUserView}
            currentUser={currentUser}
            onOpenAuth={handleOpenAuth}
            onOpenAccountModal={() => setShowAccountModal(true)}
            savedCVsCount={userCVsForCurrentAccount.length}
            onNavigateAdmin={() => setAppMode('admin')}
            isSpecificAdmin={isSpecificAdmin}
          />

          <main className="flex-1">
            {userView === 'home' && (
              <LandingView
                templates={templates.filter((t) => t.isActive)}
                onStartBuilder={handleStartBuilder}
                onSelectTemplate={(tplId) => {
                  setResumeData((prev) => ({ ...prev, templateId: tplId }));
                  handleStartBuilder(tplId);
                }}
                onOpenAuth={handleOpenAuth}
                onNavigateReviews={() => setUserView('reviews')}
                onNavigatePrivacy={() => setUserView('privacy')}
                onNavigateTerms={() => setUserView('terms')}
                onOpenPolicyModal={(tab) => {
                  setPolicyModalTab(tab);
                  setShowPolicyModal(true);
                }}
              />
            )}

            <Suspense fallback={<LoadingFallback minHeight="min-h-[400px]" />}>
              {userView === 'my-cvs' && (
                <MyCVsView
                  resumes={userCVsForCurrentAccount}
                  activeResumeId={resumeData.id}
                  templates={templates}
                  currentUser={currentUser}
                  basePriceKz={settings.basePriceKz}
                  transactions={transactions}
                  onApproveTransaction={handleApproveTransaction}
                  onSelectResume={handleSelectCVToEdit}
                  onCreateNewResume={handleCreateNewCV}
                  onDuplicateResume={handleDuplicateCV}
                  onDeleteResume={handleDeleteCV}
                  onUpdateTitle={handleUpdateCVTitle}
                  onOpenAuth={handleOpenAuth}
                  onPaymentSubmitted={handleUserPaymentSubmitted}
                  onNavigateBuilder={() => setUserView('builder')}
                  onToast={showToast}
                />
              )}

              {userView === 'reviews' && (
                <ReviewsView
                  reviews={reviews}
                  onAddReview={handleAddReview}
                  currentUser={currentUser}
                  transactions={transactions}
                  onOpenAuth={() => handleOpenAuth('login')}
                  onOpenBuilder={() => handleStartBuilder()}
                  onToast={showToast}
                />
              )}

              {userView === 'privacy' && (
                <LegalView
                  initialDoc="privacy"
                  onNavigateHome={() => setUserView('home')}
                  onNavigateBuilder={() => setUserView('builder')}
                />
              )}

              {userView === 'terms' && (
                <LegalView
                  initialDoc="terms"
                  onNavigateHome={() => setUserView('home')}
                  onNavigateBuilder={() => setUserView('builder')}
                />
              )}

              {userView === 'builder' && (
                <CVBuilderWizard
                  resume={resumeData}
                  setResume={setResumeData}
                  templates={templates}
                  currentUser={currentUser}
                  transactions={transactions}
                  onApproveTransaction={handleApproveTransaction}
                  basePriceKz={settings.basePriceKz}
                  onPaymentSuccess={handleUserPaymentSuccess}
                  onPaymentSubmitted={handleUserPaymentSubmitted}
                  onNavigateMyCVs={() => setUserView('my-cvs')}
                />
              )}
            </Suspense>
          </main>
        </div>
      )}

      {/* Authentication & Password Recovery Modal */}
      {showAuthModal && (
        <Suspense fallback={<LoadingFallback message="A carregar..." minHeight="min-h-[200px]" />}>
          <AuthModal
            isOpen={showAuthModal}
            onClose={() => setShowAuthModal(false)}
            currentUser={currentUser}
            setCurrentUser={(user) => {
              if (user) {
                const isUserAdmin =
                  (user.email?.toLowerCase().trim() === 'cv.ia.angola@gmail.com' ||
                   user.email?.toLowerCase().trim() === 'admin.prospekta@gmail.com') &&
                  user.role === 'admin';

                setCurrentUser(user);
                if (isUserAdmin) {
                  setAppMode('admin');
                } else if (userView === 'home') {
                  setUserView('builder');
                }
              } else {
                setCurrentUser(null);
                setResumeData(JSON.parse(JSON.stringify(INITIAL_RESUME)));
                setUserView('home');
                setAppMode('user');
                setShowAuthModal(false);
                setShowNotificationsModal(false);
                setTxToReject(null);
                try {
                  localStorage.removeItem('cv_resume_state');
                  localStorage.removeItem('resume_draft');
                  localStorage.removeItem('active_cv');
                  localStorage.removeItem('cv_resume_encrypted_v1');
                } catch {
                  // Ignore storage errors in sandbox
                }
                showToast('Sessão terminada. Todos os dados do currículo e referências temporárias foram apagados da tela com segurança.');
              }
            }}
            users={users}
            onAddUser={handleAddUser}
            onUpdateUserPassword={handleUpdateUserPassword}
            initialMode={authModalMode}
            onToast={showToast}
            onOpenPrivacy={() => {
              setPolicyModalTab('privacy');
              setShowPolicyModal(true);
            }}
            onOpenTerms={() => {
              setPolicyModalTab('terms');
              setShowPolicyModal(true);
            }}
            onNavigateAdmin={() => {
              if (isSpecificAdmin) {
                setAppMode('admin');
              }
            }}
          />
        </Suspense>
      )}

      {/* Legal & Privacy Policy Modal */}
      {showPolicyModal && (
        <Suspense fallback={<LoadingFallback message="A carregar documentos..." minHeight="min-h-[200px]" />}>
          <PolicyModal
            isOpen={showPolicyModal}
            onClose={() => setShowPolicyModal(false)}
            initialTab={policyModalTab}
          />
        </Suspense>
      )}

      {/* User Account & Privacy Management Modal (Lei 22/11) */}
      {showAccountModal && currentUser && (
        <Suspense fallback={<LoadingFallback message="A carregar conta..." minHeight="min-h-[200px]" />}>
          <AccountModal
            isOpen={showAccountModal}
            onClose={() => setShowAccountModal(false)}
            user={currentUser}
            savedCVsCount={userCVsForCurrentAccount.length}
            onNavigateMyCVs={() => {
              setShowAccountModal(false);
              setUserView('my-cvs');
            }}
            onNavigateAdmin={() => {
              setShowAccountModal(false);
              setAppMode('admin');
            }}
            onLogout={() => {
              setCurrentUser(null);
              setResumeData(JSON.parse(JSON.stringify(INITIAL_RESUME)));
              setUserView('home');
              setAppMode('user');
              setShowAccountModal(false);
              try {
                localStorage.removeItem('cv_resume_state');
                localStorage.removeItem('resume_draft');
                localStorage.removeItem('active_cv');
                localStorage.removeItem('cv_resume_encrypted_v1');
              } catch {
                // Ignore
              }
              showToast('Sessão terminada. Todos os dados do currículo foram removidos da tela com segurança.');
            }}
            onToast={showToast}
            onDeleteAccount={() => {
              if (currentUser) {
                handleDeleteUser(currentUser.id);
              }
              setShowAccountModal(false);
            }}
            onOpenPrivacyPolicy={() => {
              setShowAccountModal(false);
              setPolicyModalTab('privacy');
              setShowPolicyModal(true);
            }}
            onOpenTerms={() => {
              setShowAccountModal(false);
              setPolicyModalTab('terms');
              setShowPolicyModal(true);
            }}
          />
        </Suspense>
      )}
    </div>
  );
}
export default App;
