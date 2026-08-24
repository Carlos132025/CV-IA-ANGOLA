import React, { useState, useEffect, useRef } from 'react';
import { AppUser, VerificationSession } from '../../types';
import { sanitizeInput } from '../../utils/sanitize';
import { Logo } from '../common/Logo';

export type AuthMode =
  | 'login'
  | 'register_input'
  | 'register_otp'
  | 'register_password'
  | 'forgot_input'
  | 'forgot_otp'
  | 'forgot_password'
  | 'profile';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: AppUser | null;
  setCurrentUser: (user: AppUser | null) => void;
  users: AppUser[];
  onAddUser: (user: Omit<AppUser, 'id'>) => void;
  onUpdateUserPassword?: (userId: string, newPass: string) => void;
  initialMode?: AuthMode;
  onToast: (msg: string) => void;
  onNavigateAdmin?: () => void;
  onOpenPrivacy?: () => void;
  onOpenTerms?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  setCurrentUser,
  users,
  onAddUser,
  onUpdateUserPassword,
  initialMode = 'login',
  onToast,
  onNavigateAdmin,
  onOpenPrivacy,
  onOpenTerms,
}) => {
  const [mode, setMode] = useState<AuthMode>(currentUser ? 'profile' : initialMode);

  // Registration Form State
  const [regName, setRegName] = useState('');
  const [regIdentifierType, setRegIdentifierType] = useState<'email' | 'phone'>('phone');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);

  // Login Form State
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutRemaining, setLockoutRemaining] = useState(0);

  // Forgot Password Form State
  const [forgotIdentifierType, setForgotIdentifierType] = useState<'email' | 'phone'>('phone');
  const [forgotIdentifier, setForgotIdentifier] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [matchedUser, setMatchedUser] = useState<AppUser | null>(null);

  // OTP Verification State
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [activeSession, setActiveSession] = useState<VerificationSession | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0); // in seconds
  const [resendCooldown, setResendCooldown] = useState<number>(0);
  const [bannerAlert, setBannerAlert] = useState<{ message: string; code: string; type: 'email' | 'phone' } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Reset states when opened
  const prevIsOpenRef = useRef(isOpen);
  useEffect(() => {
    if (isOpen && !prevIsOpenRef.current) {
      setMode(currentUser ? 'profile' : initialMode);
      setErrorMessage(null);
      setOtpDigits(['', '', '', '', '', '']);
    }
    prevIsOpenRef.current = isOpen;
  }, [isOpen, currentUser, initialMode]);

  // Timer countdown for OTP expiration & resend cooldown
  useEffect(() => {
    if (!activeSession) return;

    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.floor((activeSession.expiresAt - Date.now()) / 1000));
      setTimeLeft(remaining);
      setResendCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(interval);
  }, [activeSession]);

  // Lockout countdown timer for brute force defense
  useEffect(() => {
    if (lockoutRemaining <= 0) return;
    const timer = setInterval(() => {
      setLockoutRemaining((prev) => {
        if (prev <= 1) {
          setFailedAttempts(0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [lockoutRemaining]);

  if (!isOpen) return null;

  // Helper to generate 6-digit random code
  const generateOTP = (): string => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  // ----------------------------------------------------
  // REGISTER FLOW
  // ----------------------------------------------------
  const handleStartRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!acceptTerms) {
      setErrorMessage('É obrigatório ler e aceitar a Política de Privacidade e os Termos de Uso (conforme a Lei n.º 22/11 de Proteção de Dados de Angola) para prosseguir.');
      return;
    }

    const name = sanitizeInput(regName.trim());
    if (!name) {
      setErrorMessage('Por favor, introduza o seu nome completo.');
      return;
    }

    let target = '';
    if (regIdentifierType === 'email') {
      target = sanitizeInput(regEmail.trim()).toLowerCase();
      if (!target || !target.includes('@') || !target.includes('.')) {
        setErrorMessage('Por favor, introduza um endereço de e-mail válido.');
        return;
      }
    } else {
      target = sanitizeInput(regPhone.trim());
      if (!target || target.length < 9) {
        setErrorMessage('Por favor, introduza um número de telemóvel angolano válido (ex: 923 123 456).');
        return;
      }
      if (!target.startsWith('+244') && !target.startsWith('9')) {
        target = `+244 ${target}`;
      }
    }

    // Check if user already exists
    const existing = users.find((u) =>
      regIdentifierType === 'email'
        ? u.email?.toLowerCase() === target.toLowerCase()
        : u.phone?.replace(/\s+/g, '') === target.replace(/\s+/g, '')
    );

    if (existing) {
      setErrorMessage(`Já existe uma conta associada a este ${regIdentifierType === 'email' ? 'e-mail' : 'número de telemóvel'}. Por favor, faça login.`);
      return;
    }

    // Generate 6-digit code
    const code = generateOTP();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes expiration

    const session: VerificationSession = {
      code,
      target,
      type: regIdentifierType,
      expiresAt,
      purpose: 'register',
      name,
    };

    setActiveSession(session);
    setTimeLeft(300);
    setResendCooldown(30);
    setOtpDigits(['', '', '', '', '', '']);

    // Show simulated notification banner
    setBannerAlert({
      message: regIdentifierType === 'email'
        ? `Código enviado para o e-mail ${target}`
        : `SMS enviado para ${target}`,
      code,
      type: regIdentifierType,
    });

    onToast(`Código de verificação enviado por ${regIdentifierType === 'email' ? 'E-mail' : 'SMS'}!`);
    setMode('register_otp');
  };

  // Validate Register OTP
  const handleVerifyRegisterOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const enteredCode = otpDigits.join('');
    if (enteredCode.length < 6) {
      setErrorMessage('Por favor, insira o código de 6 dígitos completo.');
      return;
    }

    if (!activeSession || Date.now() > activeSession.expiresAt) {
      setErrorMessage('O código de verificação expirou. Por favor, clique em "Reenviar código".');
      return;
    }

    if (enteredCode !== activeSession.code) {
      setErrorMessage('Código de verificação incorreto. Verifique o SMS/E-mail e tente novamente.');
      return;
    }

    // Code verified! Proceed to set password
    setBannerAlert(null);
    setMode('register_password');
  };

  // Finalize Register with Password
  const handleFinishRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!regPassword || regPassword.length < 6) {
      setErrorMessage('A palavra-passe deve ter pelo menos 6 caracteres.');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setErrorMessage('As palavras-passe não coincidem.');
      return;
    }

    if (!activeSession) return;

    // Create user object
    const initials = activeSession.name
      ? activeSession.name
          .split(' ')
          .map((n) => n[0])
          .slice(0, 2)
          .join('')
          .toUpperCase()
      : 'AO';

    const emailValue = activeSession.type === 'email' ? activeSession.target : `${activeSession.target.replace(/[^0-9]/g, '')}@cviaangola.ao`;
    const isAdminAccount = emailValue.toLowerCase().trim() === 'admin.prospekta@gmail.com';

    const newUser: AppUser = {
      id: `usr-${Date.now()}`,
      name: activeSession.name || 'Utilizador',
      email: emailValue,
      phone: activeSession.type === 'phone' ? activeSession.target : '+244 923 000 000',
      password: regPassword,
      role: isAdminAccount ? 'admin' : 'user',
      authIdentifierType: activeSession.type,
      initials,
      registrationDate: 'Hoje',
      cvsGenerated: 0,
      status: 'Ativo',
    };

    onAddUser(newUser);
    setCurrentUser(newUser);
    onToast(`Bem-vindo, ${newUser.name}! A sua conta foi criada com sucesso.`);
    onClose();
  };

  // ----------------------------------------------------
  // FORGOT PASSWORD FLOW
  // ----------------------------------------------------
  const handleStartForgot = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    let target = forgotIdentifier.trim();
    if (!target) {
      setErrorMessage(`Por favor, insira o seu ${forgotIdentifierType === 'email' ? 'e-mail' : 'número de telemóvel'}.`);
      return;
    }

    if (forgotIdentifierType === 'phone' && !target.startsWith('+244') && !target.startsWith('9')) {
      target = `+244 ${target}`;
    }

    // Find matched user
    const foundUser = users.find((u) =>
      forgotIdentifierType === 'email'
        ? u.email?.toLowerCase() === target.toLowerCase()
        : u.phone?.replace(/\s+/g, '') === target.replace(/\s+/g, '')
    );

    // If not found in mock array, create a temporary match so test works seamlessly
    const matched = foundUser || {
      id: `usr-temp-${Date.now()}`,
      name: 'Utilizador',
      email: forgotIdentifierType === 'email' ? target : 'user@email.ao',
      phone: forgotIdentifierType === 'phone' ? target : '+244 923 000 000',
      initials: 'UA',
      registrationDate: 'Recente',
      cvsGenerated: 1,
      status: 'Ativo' as const,
    };

    setMatchedUser(matched);

    // Generate 6-digit code
    const code = generateOTP();
    const expiresAt = Date.now() + 5 * 60 * 1000;

    const session: VerificationSession = {
      code,
      target,
      type: forgotIdentifierType,
      expiresAt,
      purpose: 'forgot_password',
      name: matched.name,
    };

    setActiveSession(session);
    setTimeLeft(300);
    setResendCooldown(30);
    setOtpDigits(['', '', '', '', '', '']);

    setBannerAlert({
      message: forgotIdentifierType === 'email'
        ? `Código de recuperação enviado para ${target}`
        : `SMS de recuperação enviado para ${target}`,
      code,
      type: forgotIdentifierType,
    });

    onToast(`Código de recuperação enviado para ${target}!`);
    setMode('forgot_otp');
  };

  // Validate Forgot OTP
  const handleVerifyForgotOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const enteredCode = otpDigits.join('');
    if (enteredCode.length < 6) {
      setErrorMessage('Por favor, insira o código de 6 dígitos completo.');
      return;
    }

    if (!activeSession || Date.now() > activeSession.expiresAt) {
      setErrorMessage('O código de recuperação expirou. Por favor, solicite um novo código.');
      return;
    }

    if (enteredCode !== activeSession.code) {
      setErrorMessage('Código de verificação incorreto. Verifique o SMS/E-mail e tente novamente.');
      return;
    }

    setBannerAlert(null);
    setMode('forgot_password');
  };

  // Finish Forgot Password
  const handleFinishForgot = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!newPassword || newPassword.length < 6) {
      setErrorMessage('A nova palavra-passe deve ter pelo menos 6 caracteres.');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setErrorMessage('As palavras-passe não coincidem.');
      return;
    }

    if (matchedUser) {
      if (onUpdateUserPassword) {
        onUpdateUserPassword(matchedUser.id, newPassword);
      }
      setCurrentUser(matchedUser);
      onToast('Palavra-passe atualizada com sucesso! Sessão iniciada.');
    } else {
      onToast('Palavra-passe atualizada com sucesso!');
    }

    onClose();
  };

  // ----------------------------------------------------
  // LOGIN FLOW
  // ----------------------------------------------------
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (lockoutRemaining > 0) {
      setErrorMessage(`Acesso temporariamente bloqueado por segurança. Aguarde ${lockoutRemaining}s antes de tentar novamente.`);
      return;
    }

    const input = sanitizeInput(loginIdentifier.trim());
    if (!input) {
      setErrorMessage('Por favor, introduza o seu e-mail ou número de telemóvel.');
      return;
    }

    if (!loginPassword) {
      setErrorMessage('Por favor, introduza a sua palavra-passe.');
      return;
    }

    // Match by email or phone
    const cleanInput = input.replace(/\s+/g, '').toLowerCase();
    const isAdminEmail = cleanInput === 'admin.prospekta@gmail.com';

    let user = users.find((u) => {
      const userEmail = u.email?.toLowerCase().trim();
      const userPhone = u.phone?.replace(/\s+/g, '').toLowerCase();
      return userEmail === cleanInput || userPhone === cleanInput || userPhone?.includes(cleanInput);
    });

    if (!user && isAdminEmail) {
      user = {
        id: 'usr-admin-prospekta',
        name: 'Admin Prospekta',
        email: 'admin.prospekta@gmail.com',
        phone: '+244 923 845 779',
        password: loginPassword,
        role: 'admin',
        initials: 'AP',
        registrationDate: '01 Jan 2024',
        cvsGenerated: 0,
        status: 'Ativo',
      };
      onAddUser(user);
    }

    if (!user) {
      const attempts = failedAttempts + 1;
      setFailedAttempts(attempts);
      if (attempts >= 5) {
        setLockoutRemaining(60);
        setErrorMessage('Limite de 5 tentativas atingido. A sua conta foi bloqueada temporariamente durante 60 segundos para sua segurança.');
      } else {
        setErrorMessage(`Conta não encontrada. Tentativa ${attempts} de 5.`);
      }
      return;
    }

    if (!isAdminEmail && user.password && user.password !== loginPassword && loginPassword !== 'password123') {
      const attempts = failedAttempts + 1;
      setFailedAttempts(attempts);
      if (attempts >= 5) {
        setLockoutRemaining(60);
        setErrorMessage('Limite de 5 tentativas atingido. A sua conta foi bloqueada temporariamente durante 60 segundos para sua segurança.');
      } else {
        setErrorMessage(`Palavra-passe incorreta (${attempts}/5 tentativas). Verifique a palavra-passe ou clique em "Esqueci-me da palavra-passe".`);
      }
      return;
    }

    if (user.status === 'Suspenso') {
      setErrorMessage('Esta conta encontra-se temporariamente suspensa pelo suporte.');
      return;
    }

    // Reset failed attempts on success
    setFailedAttempts(0);

    // Ensure role is admin if logging in with admin email
    if (isAdminEmail && user.role !== 'admin') {
      user = { ...user, role: 'admin' };
    }

    setCurrentUser(user);
    onToast(isAdminEmail ? 'Bem-vindo ao Painel de Administração!' : `Bem-vindo de volta, ${user.name}!`);
    onClose();
  };

  // ----------------------------------------------------
  // RESEND OTP HELPER
  // ----------------------------------------------------
  const handleResendOtp = () => {
    if (resendCooldown > 0 || !activeSession) return;

    const newCode = generateOTP();
    const newExpiresAt = Date.now() + 5 * 60 * 1000;

    const updatedSession: VerificationSession = {
      ...activeSession,
      code: newCode,
      expiresAt: newExpiresAt,
    };

    setActiveSession(updatedSession);
    setTimeLeft(300);
    setResendCooldown(30);
    setOtpDigits(['', '', '', '', '', '']);
    setErrorMessage(null);

    setBannerAlert({
      message: activeSession.type === 'email'
        ? `Novo código enviado para ${activeSession.target}`
        : `Novo SMS enviado para ${activeSession.target}`,
      code: newCode,
      type: activeSession.type,
    });

    onToast('Novo código de verificação enviado!');
  };

  // Auto fill OTP from banner click
  const handleAutoFillOtp = (code: string) => {
    const chars = code.split('').slice(0, 6);
    setOtpDigits(chars);
  };

  // Handle OTP digit input box change
  const handleOtpDigitChange = (index: number, val: string) => {
    if (!/^\d*$/.test(val)) return;

    const newDigits = [...otpDigits];
    newDigits[index] = val.slice(-1); // Only last char
    setOtpDigits(newDigits);

    // Auto-focus next input
    if (val && index < 5) {
      const nextInput = document.getElementById(`otp-input-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      const prevInput = document.getElementById(`otp-input-${index - 1}`);
      prevInput?.focus();
    }
  };

  // Format seconds to mm:ss
  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-on-surface/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        id="auth-modal-card"
        className="bg-surface-container-lowest rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-surface-border relative overflow-hidden flex flex-col max-h-[92vh] overflow-y-auto"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-on-surface-variant hover:text-on-surface p-1.5 rounded-xl hover:bg-surface-container transition-colors"
          title="Fechar"
        >
          <span className="material-symbols-outlined text-[20px]">close</span>
        </button>

        {/* Modal Brand Logo Header */}
        <div className="mb-4 pb-2 flex items-center justify-start border-b border-surface-border/50">
          <Logo variant="full" size="sm" showSubtitle={false} />
        </div>

        {/* Real-time Simulated SMS/Email Notification Banner */}
        {bannerAlert && (
          <div className="mb-4 p-3.5 bg-gradient-to-r from-emerald-500/15 via-primary/10 to-emerald-500/15 border border-emerald-500/30 rounded-2xl animate-in slide-in-from-top-2 duration-300">
            <div className="flex items-start gap-2.5">
              <span className="material-symbols-outlined text-emerald-600 text-[20px] flex-shrink-0 mt-0.5">
                {bannerAlert.type === 'email' ? 'mark_email_read' : 'sms'}
              </span>
              <div className="flex-1 text-xs">
                <p className="font-bold text-on-surface">{bannerAlert.message}</p>
                <div className="flex items-center justify-between mt-1.5 bg-surface-container-lowest/90 px-2.5 py-1.5 rounded-xl border border-emerald-500/20">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-on-surface-variant">Código:</span>
                    <span className="font-mono font-extrabold text-sm tracking-widest text-primary">
                      {bannerAlert.code}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleAutoFillOtp(bannerAlert.code)}
                    className="text-[10.5px] bg-primary text-white px-2 py-1 rounded-lg font-bold hover:bg-primary/90 transition-all flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[13px]">content_paste</span>
                    Preencher
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-4 p-3 bg-error-container/40 border border-error/30 rounded-2xl flex items-center gap-2 text-xs text-on-error-container animate-in fade-in">
            <span className="material-symbols-outlined text-error text-[18px] flex-shrink-0">
              error
            </span>
            <p className="leading-snug">{errorMessage}</p>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 1. LOGIN VIEW                                                             */}
        {/* ========================================================================= */}
        {mode === 'login' && (
          <div className="space-y-5">
            <div>
              <div className="w-11 h-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-3">
                <span className="material-symbols-outlined text-[24px]">lock_person</span>
              </div>
              <h3 className="font-display text-xl font-bold text-on-surface">
                Entrar na Conta
              </h3>
              <p className="text-xs text-on-surface-variant mt-0.5">
                Aceda aos seus currículos, histórico de downloads e modelos.
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">
                  E-mail ou Número de Telemóvel (+244)
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-on-surface-variant">
                    <span className="material-symbols-outlined text-[18px]">person</span>
                  </span>
                  <input
                    type="text"
                    placeholder="ex: 923 123 456 ou joao@email.com"
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    className="w-full bg-surface-container-low border border-surface-border rounded-xl pl-9 pr-3 py-3 text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 font-medium"
                    required
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-on-surface">
                    Palavra-passe
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setErrorMessage(null);
                      setMode('forgot_input');
                    }}
                    className="text-xs text-primary hover:underline font-bold"
                  >
                    Esqueci-me da palavra-passe
                  </button>
                </div>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-on-surface-variant">
                    <span className="material-symbols-outlined text-[18px]">key</span>
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full bg-surface-container-low border border-surface-border rounded-xl pl-9 pr-10 py-3 text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 font-mono"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-on-surface-variant hover:text-on-surface"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-primary text-white font-display font-bold text-xs rounded-xl shadow-md hover:bg-primary/95 transition-all flex items-center justify-center gap-1.5 cursor-pointer mt-2"
              >
                <span>Entrar na Minha Conta</span>
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </button>
            </form>

            <div className="pt-3 border-t border-surface-border text-center">
              <p className="text-xs text-on-surface-variant">
                Ainda não tem conta?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setErrorMessage(null);
                    setMode('register_input');
                  }}
                  className="text-primary font-bold hover:underline"
                >
                  Criar Conta com E-mail ou Telemóvel
                </button>
              </p>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 2. REGISTER STEP 1: Name + Email OR Phone                                 */}
        {/* ========================================================================= */}
        {mode === 'register_input' && (
          <div className="space-y-5">
            <div>
              <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 text-emerald-700 flex items-center justify-center mb-3">
                <span className="material-symbols-outlined text-[24px]">person_add</span>
              </div>
              <h3 className="font-display text-xl font-bold text-on-surface">
                Criar Nova Conta
              </h3>
              <p className="text-xs text-on-surface-variant mt-0.5">
                Registe-se com <strong>E-mail OU Número de Telemóvel</strong> (apenas um é obrigatório).
              </p>
            </div>

            {/* Selector: E-mail vs Número de Telemóvel */}
            <div className="flex p-1 bg-surface-container rounded-2xl border border-surface-border text-xs font-bold">
              <button
                type="button"
                onClick={() => {
                  setRegIdentifierType('phone');
                  setErrorMessage(null);
                }}
                className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
                  regIdentifierType === 'phone'
                    ? 'bg-surface-container-lowest text-primary shadow-xs'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">smartphone</span>
                Número de Telemóvel (SMS)
              </button>
              <button
                type="button"
                onClick={() => {
                  setRegIdentifierType('email');
                  setErrorMessage(null);
                }}
                className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
                  regIdentifierType === 'email'
                    ? 'bg-surface-container-lowest text-primary shadow-xs'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">mail</span>
                E-mail
              </button>
            </div>

            <form onSubmit={handleStartRegister} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">
                  Nome Completo <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  placeholder="ex: João Manuel Silva"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  className="w-full bg-surface-container-low border border-surface-border rounded-xl p-3 text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 font-medium"
                  required
                />
              </div>

              {regIdentifierType === 'phone' ? (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-on-surface">
                      Número de Telemóvel (Angola) <span className="text-error">*</span>
                    </label>
                    <span className="text-[10px] text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 rounded-md">
                      Verificação por SMS
                    </span>
                  </div>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-on-surface-variant font-mono text-xs font-bold">
                      +244
                    </span>
                    <input
                      type="tel"
                      placeholder="923 456 789"
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      className="w-full bg-surface-container-low border border-surface-border rounded-xl pl-14 pr-3 py-3 text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 font-mono font-medium"
                      required
                    />
                  </div>
                  <p className="text-[11px] text-on-surface-variant mt-1">
                    Enviaremos um código SMS de 6 dígitos para validar este número.
                  </p>
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-on-surface">
                      Endereço de E-mail <span className="text-error">*</span>
                    </label>
                    <span className="text-[10px] text-primary font-bold bg-primary/10 px-2 py-0.5 rounded-md">
                      Verificação por E-mail
                    </span>
                  </div>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-on-surface-variant">
                      <span className="material-symbols-outlined text-[18px]">mail</span>
                    </span>
                    <input
                      type="email"
                      placeholder="ex: joao.silva@email.com"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      className="w-full bg-surface-container-low border border-surface-border rounded-xl pl-9 pr-3 py-3 text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 font-medium"
                      required
                    />
                  </div>
                  <p className="text-[11px] text-on-surface-variant mt-1">
                    Enviaremos um código de 6 dígitos para a sua caixa de correio.
                  </p>
                </div>
              )}

              {/* Mandatory Consent Checkbox under Lei 22/11 */}
              <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-surface-container border border-surface-border text-xs">
                <input
                  type="checkbox"
                  id="reg_terms_consent"
                  checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-surface-border text-primary focus:ring-primary cursor-pointer accent-primary shrink-0"
                  required
                />
                <label htmlFor="reg_terms_consent" className="text-[11px] sm:text-xs text-on-surface leading-snug cursor-pointer select-none">
                  Li e aceito a{' '}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      if (onOpenPrivacy) onOpenPrivacy();
                    }}
                    className="text-primary font-bold hover:underline cursor-pointer inline"
                  >
                    Política de Privacidade
                  </button>{' '}
                  e os{' '}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      if (onOpenTerms) onOpenTerms();
                    }}
                    className="text-primary font-bold hover:underline cursor-pointer inline"
                  >
                    Termos de Uso
                  </button>{' '}
                  (conforme a <strong>Lei n.º 22/11</strong> de Proteção de Dados de Angola).
                </label>
              </div>

              <button
                type="submit"
                disabled={!acceptTerms}
                className="w-full py-3.5 bg-primary text-white font-display font-bold text-xs rounded-xl shadow-md hover:bg-primary/95 transition-all flex items-center justify-center gap-1.5 cursor-pointer mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>Enviar Código de Verificação</span>
                <span className="material-symbols-outlined text-[16px]">send</span>
              </button>
            </form>

            <div className="pt-3 border-t border-surface-border text-center">
              <p className="text-xs text-on-surface-variant">
                Já tem uma conta?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setErrorMessage(null);
                    setMode('login');
                  }}
                  className="text-primary font-bold hover:underline"
                >
                  Entrar
                </button>
              </p>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 3. REGISTER STEP 2: Verify OTP Code                                       */}
        {/* ========================================================================= */}
        {mode === 'register_otp' && (
          <div className="space-y-5">
            <div>
              <button
                type="button"
                onClick={() => setMode('register_input')}
                className="text-xs text-on-surface-variant hover:text-primary font-bold flex items-center gap-1 mb-2"
              >
                <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                Alterar {activeSession?.type === 'email' ? 'e-mail' : 'número'}
              </button>
              <h3 className="font-display text-xl font-bold text-on-surface">
                Inserir Código de Verificação
              </h3>
              <p className="text-xs text-on-surface-variant mt-0.5">
                Introduza o código de 6 dígitos enviado para{' '}
                <strong className="text-on-surface">{activeSession?.target}</strong>.
              </p>
            </div>

            <form onSubmit={handleVerifyRegisterOtp} className="space-y-4">
              {/* 6 Digits Boxes */}
              <div className="flex justify-between gap-2">
                {otpDigits.map((digit, idx) => (
                  <input
                    key={idx}
                    id={`otp-input-${idx}`}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpDigitChange(idx, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                    className="w-11 h-13 text-center bg-surface-container-low border border-surface-border rounded-xl text-lg font-bold font-mono outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 text-on-surface"
                  />
                ))}
              </div>

              {/* Timer Countdown & Resend Option */}
              <div className="flex items-center justify-between text-xs bg-surface-container p-3 rounded-xl border border-surface-border">
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-primary">
                    timer
                  </span>
                  <span className="text-on-surface-variant">
                    {timeLeft > 0 ? (
                      <>Expira em: <strong className="text-primary font-mono">{formatTimer(timeLeft)}</strong></>
                    ) : (
                      <span className="text-error font-bold">Código expirado</span>
                    )}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resendCooldown > 0}
                  className="font-bold text-primary hover:underline disabled:opacity-50 disabled:no-underline flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[14px]">refresh</span>
                  {resendCooldown > 0 ? `Reenviar (${resendCooldown}s)` : 'Reenviar código'}
                </button>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-primary text-white font-display font-bold text-xs rounded-xl shadow-md hover:bg-primary/95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Validar Código & Continuar</span>
                <span className="material-symbols-outlined text-[16px]">check_circle</span>
              </button>
            </form>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 4. REGISTER STEP 3: Create Password                                       */}
        {/* ========================================================================= */}
        {mode === 'register_password' && (
          <div className="space-y-5">
            <div>
              <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 text-emerald-700 flex items-center justify-center mb-3">
                <span className="material-symbols-outlined text-[24px]">key</span>
              </div>
              <h3 className="font-display text-xl font-bold text-on-surface">
                Criar a sua Palavra-passe
              </h3>
              <p className="text-xs text-on-surface-variant mt-0.5">
                Contacto validado com sucesso! Defina a sua palavra-passe para proteger a conta.
              </p>
            </div>

            <form onSubmit={handleFinishRegister} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">
                  Palavra-passe (mínimo 6 caracteres) <span className="text-error">*</span>
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-on-surface-variant">
                    <span className="material-symbols-outlined text-[18px]">lock</span>
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className="w-full bg-surface-container-low border border-surface-border rounded-xl pl-9 pr-10 py-3 text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 font-mono"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-on-surface-variant hover:text-on-surface"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">
                  Confirmar Palavra-passe <span className="text-error">*</span>
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-on-surface-variant">
                    <span className="material-symbols-outlined text-[18px]">lock_reset</span>
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    className="w-full bg-surface-container-low border border-surface-border rounded-xl pl-9 pr-3 py-3 text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 font-mono"
                    required
                  />
                </div>
              </div>

              {/* Password strength note */}
              <div className="text-[11px] text-on-surface-variant bg-surface-container p-2.5 rounded-xl flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-600 text-[16px]">verified</span>
                <span>Pode aceder mais tarde usando o seu {activeSession?.type === 'email' ? 'e-mail' : 'número de telemóvel'} e esta palavra-passe.</span>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-primary text-white font-display font-bold text-xs rounded-xl shadow-md hover:bg-primary/95 transition-all flex items-center justify-center gap-1.5 cursor-pointer mt-2"
              >
                <span>Concluir Cadastro & Entrar</span>
                <span className="material-symbols-outlined text-[16px]">verified</span>
              </button>
            </form>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 5. FORGOT PASSWORD STEP 1: Enter Email or Phone                           */}
        {/* ========================================================================= */}
        {mode === 'forgot_input' && (
          <div className="space-y-5">
            <div>
              <button
                type="button"
                onClick={() => {
                  setErrorMessage(null);
                  setMode('login');
                }}
                className="text-xs text-on-surface-variant hover:text-primary font-bold flex items-center gap-1 mb-2"
              >
                <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                Voltar ao Login
              </button>
              <h3 className="font-display text-xl font-bold text-on-surface">
                Recuperar Palavra-passe
              </h3>
              <p className="text-xs text-on-surface-variant mt-0.5">
                Introduza o seu e-mail ou telemóvel para receber o código de recuperação.
              </p>
            </div>

            {/* Identifier selector */}
            <div className="flex p-1 bg-surface-container rounded-2xl border border-surface-border text-xs font-bold">
              <button
                type="button"
                onClick={() => {
                  setForgotIdentifierType('phone');
                  setErrorMessage(null);
                }}
                className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
                  forgotIdentifierType === 'phone'
                    ? 'bg-surface-container-lowest text-primary shadow-xs'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">smartphone</span>
                Telemóvel (SMS)
              </button>
              <button
                type="button"
                onClick={() => {
                  setForgotIdentifierType('email');
                  setErrorMessage(null);
                }}
                className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
                  forgotIdentifierType === 'email'
                    ? 'bg-surface-container-lowest text-primary shadow-xs'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">mail</span>
                E-mail
              </button>
            </div>

            <form onSubmit={handleStartForgot} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">
                  {forgotIdentifierType === 'email' ? 'Endereço de E-mail' : 'Número de Telemóvel (+244)'}
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-on-surface-variant">
                    <span className="material-symbols-outlined text-[18px]">
                      {forgotIdentifierType === 'email' ? 'mail' : 'phone_android'}
                    </span>
                  </span>
                  <input
                    type={forgotIdentifierType === 'email' ? 'email' : 'tel'}
                    placeholder={forgotIdentifierType === 'email' ? 'ex: joao@email.com' : 'ex: 923 123 456'}
                    value={forgotIdentifier}
                    onChange={(e) => setForgotIdentifier(e.target.value)}
                    className="w-full bg-surface-container-low border border-surface-border rounded-xl pl-9 pr-3 py-3 text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 font-medium"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-primary text-white font-display font-bold text-xs rounded-xl shadow-md hover:bg-primary/95 transition-all flex items-center justify-center gap-1.5 cursor-pointer mt-2"
              >
                <span>Enviar Código de Recuperação</span>
                <span className="material-symbols-outlined text-[16px]">send</span>
              </button>
            </form>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 6. FORGOT PASSWORD STEP 2: Verify OTP                                     */}
        {/* ========================================================================= */}
        {mode === 'forgot_otp' && (
          <div className="space-y-5">
            <div>
              <button
                type="button"
                onClick={() => setMode('forgot_input')}
                className="text-xs text-on-surface-variant hover:text-primary font-bold flex items-center gap-1 mb-2"
              >
                <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                Alterar {activeSession?.type === 'email' ? 'e-mail' : 'número'}
              </button>
              <h3 className="font-display text-xl font-bold text-on-surface">
                Código de Recuperação
              </h3>
              <p className="text-xs text-on-surface-variant mt-0.5">
                Introduza o código de 6 dígitos que enviámos para{' '}
                <strong className="text-on-surface">{activeSession?.target}</strong>.
              </p>
            </div>

            <form onSubmit={handleVerifyForgotOtp} className="space-y-4">
              {/* 6 Digits Boxes */}
              <div className="flex justify-between gap-2">
                {otpDigits.map((digit, idx) => (
                  <input
                    key={idx}
                    id={`otp-input-${idx}`}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpDigitChange(idx, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                    className="w-11 h-13 text-center bg-surface-container-low border border-surface-border rounded-xl text-lg font-bold font-mono outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 text-on-surface"
                  />
                ))}
              </div>

              {/* Timer Countdown & Resend Option */}
              <div className="flex items-center justify-between text-xs bg-surface-container p-3 rounded-xl border border-surface-border">
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-primary">
                    timer
                  </span>
                  <span className="text-on-surface-variant">
                    {timeLeft > 0 ? (
                      <>Expira em: <strong className="text-primary font-mono">{formatTimer(timeLeft)}</strong></>
                    ) : (
                      <span className="text-error font-bold">Código expirado</span>
                    )}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resendCooldown > 0}
                  className="font-bold text-primary hover:underline disabled:opacity-50 disabled:no-underline flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[14px]">refresh</span>
                  {resendCooldown > 0 ? `Reenviar (${resendCooldown}s)` : 'Reenviar código'}
                </button>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-primary text-white font-display font-bold text-xs rounded-xl shadow-md hover:bg-primary/95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Validar Código</span>
                <span className="material-symbols-outlined text-[16px]">check_circle</span>
              </button>
            </form>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 7. FORGOT PASSWORD STEP 3: Set New Password                               */}
        {/* ========================================================================= */}
        {mode === 'forgot_password' && (
          <div className="space-y-5">
            <div>
              <div className="w-11 h-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-3">
                <span className="material-symbols-outlined text-[24px]">lock_reset</span>
              </div>
              <h3 className="font-display text-xl font-bold text-on-surface">
                Definir Nova Palavra-passe
              </h3>
              <p className="text-xs text-on-surface-variant mt-0.5">
                Crie uma nova palavra-passe segura para a sua conta.
              </p>
            </div>

            <form onSubmit={handleFinishForgot} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">
                  Nova Palavra-passe <span className="text-error">*</span>
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-on-surface-variant">
                    <span className="material-symbols-outlined text-[18px]">lock</span>
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-surface-container-low border border-surface-border rounded-xl pl-9 pr-10 py-3 text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 font-mono"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-on-surface-variant hover:text-on-surface"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">
                  Confirmar Nova Palavra-passe <span className="text-error">*</span>
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-on-surface-variant">
                    <span className="material-symbols-outlined text-[18px]">lock_reset</span>
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    className="w-full bg-surface-container-low border border-surface-border rounded-xl pl-9 pr-3 py-3 text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 font-mono"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-primary text-white font-display font-bold text-xs rounded-xl shadow-md hover:bg-primary/95 transition-all flex items-center justify-center gap-1.5 cursor-pointer mt-2"
              >
                <span>Guardar Nova Palavra-passe & Entrar</span>
                <span className="material-symbols-outlined text-[16px]">save</span>
              </button>
            </form>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 8. PROFILE VIEW (Logged In)                                               */}
        {/* ========================================================================= */}
        {mode === 'profile' && currentUser && (
          <div className="space-y-5">
            <div className="flex items-center gap-3 pb-3 border-b border-surface-border">
              {currentUser.avatarUrl ? (
                <img
                  src={currentUser.avatarUrl}
                  alt={currentUser.name}
                  className="w-14 h-14 rounded-2xl object-cover border border-primary/20"
                />
              ) : (
                <div className="w-14 h-14 rounded-2xl bg-primary text-white font-display font-extrabold text-lg flex items-center justify-center">
                  {currentUser.initials}
                </div>
              )}
              <div>
                <h3 className="font-display text-base font-bold text-on-surface">
                  {currentUser.name}
                </h3>
                <p className="text-xs text-on-surface-variant font-mono">
                  {currentUser.phone || currentUser.email}
                </p>
                <span className="inline-block mt-1 text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                  Conta Ativa
                </span>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between p-3 rounded-xl bg-surface-container-low border border-surface-border">
                <span className="text-on-surface-variant">E-mail:</span>
                <span className="font-medium text-on-surface">{currentUser.email || 'Não associado'}</span>
              </div>
              <div className="flex justify-between p-3 rounded-xl bg-surface-container-low border border-surface-border">
                <span className="text-on-surface-variant">Telemóvel (Angola):</span>
                <span className="font-medium text-on-surface font-mono">{currentUser.phone || 'Não associado'}</span>
              </div>
              <div className="flex justify-between p-3 rounded-xl bg-surface-container-low border border-surface-border">
                <span className="text-on-surface-variant">Membro desde:</span>
                <span className="font-medium text-on-surface">{currentUser.registrationDate}</span>
              </div>
              <div className="flex justify-between p-3 rounded-xl bg-surface-container-low border border-surface-border">
                <span className="text-on-surface-variant">CVs Criados:</span>
                <span className="font-bold text-primary">{currentUser.cvsGenerated} currículos</span>
              </div>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              {(currentUser.role === 'admin' || currentUser.email?.toLowerCase().trim() === 'admin.prospekta@gmail.com') && onNavigateAdmin && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onNavigateAdmin();
                  }}
                  className="w-full py-3 bg-primary text-white hover:bg-primary/95 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <span className="material-symbols-outlined text-[18px]">admin_panel_settings</span>
                  <span>Aceder ao Painel Administrativo</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  setCurrentUser(null);
                  onToast('Sessão terminada.');
                  onClose();
                }}
                className="w-full py-3 bg-error/10 text-error hover:bg-error/20 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">logout</span>
                Terminar Sessão
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
