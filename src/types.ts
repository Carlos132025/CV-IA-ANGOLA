export type AdminTab = 'dashboard' | 'pending-payments' | 'users' | 'sales' | 'templates' | 'audit' | 'privacy-requests' | 'settings' | 'support';

export type UserView = 'home' | 'builder' | 'templates' | 'reviews' | 'privacy' | 'terms' | 'preview' | 'account' | 'my-cvs';

export type BuilderStep = 1 | 2 | 3 | 4 | 5;

export interface ReviewItem {
  id: string;
  userId: string;
  userName: string;
  userRole?: string;
  userAvatar?: string;
  rating: number; // 1 to 5
  comment: string;
  date: string;
  isVerifiedBuyer: boolean;
  templateName?: string;
}

export interface PersonalInfo {
  fullName: string;
  professionalTitle: string;
  email: string;
  phone: string;
  location: string;
  photoUrl: string;
  autoCropFace: boolean;
  neutralBackground: boolean;
  professionalSummary: string;
  linkedinUrl?: string;
  nationality?: string;
  driverLicense?: string;
}

export interface WorkExperience {
  id: string;
  role: string;
  company: string;
  location: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  description: string;
  highlights: string[];
}

export interface Education {
  id: string;
  degree: string;
  institution: string;
  location: string;
  completionYear: string;
}

export interface Certification {
  id: string;
  name: string;
  institution: string;
  year: string;
}

export interface ReferenceItem {
  id: string;
  name: string;
  role: string;
  company: string;
  phone: string;
  email?: string;
  relationship?: string;
}

export interface SkillItem {
  id: string;
  name: string;
  level?: 'Básico' | 'Intermédio' | 'Avançado' | 'Especialista';
}

export interface LanguageItem {
  id: string;
  language: string;
  proficiency: 'Básico' | 'Intermédio' | 'Avançado' | 'Fluente' | 'Nativo';
}

export interface ResumePaidSnapshot {
  personalInfo: PersonalInfo;
  experiences: WorkExperience[];
  educations: Education[];
  certifications: Certification[];
  skills: SkillItem[];
  languages: LanguageItem[];
  references?: ReferenceItem[];
  templateId: string;
  accentColor: string;
  paidAt?: string;
  txId?: string;
}

export interface ResumeData {
  id: string;
  userId?: string;
  title: string;
  targetPersonName?: string;
  createdAt?: string;
  updatedAt: string;
  templateId: string;
  accentColor: string;
  isPaid: boolean;
  downloadsRemaining: number;
  downloadCount: number;
  paymentStatus?: 'none' | 'pending' | 'approved' | 'rejected';
  pendingTransactionId?: string;
  rejectionReason?: string;
  submittedPaymentMethod?: 'Multicaixa' | 'Transferência';
  submittedReference?: string;
  paidSnapshot?: ResumePaidSnapshot;
  hasUnpaidEdits?: boolean;
  lastPaidDate?: string;
  personalInfo: PersonalInfo;
  experiences: WorkExperience[];
  educations: Education[];
  certifications: Certification[];
  skills: SkillItem[];
  languages: LanguageItem[];
  references?: ReferenceItem[];
}

export interface AppUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  password?: string;
  role?: 'admin' | 'user';
  authIdentifierType?: 'email' | 'phone';
  avatarUrl?: string;
  initials: string;
  registrationDate: string;
  cvsGenerated: number;
  status: 'Ativo' | 'Suspenso';
}

export interface VerificationSession {
  code: string;
  target: string;
  type: 'email' | 'phone';
  expiresAt: number; // timestamp in ms
  purpose: 'register' | 'forgot_password';
  name?: string;
}

export interface PaymentAuditLog {
  id: string;
  action: 'submetido' | 'aprovado' | 'rejeitado';
  by: string;
  role: string;
  timestamp: string;
  note?: string;
}

export interface Transaction {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userPhone?: string;
  userAvatar?: string;
  userInitials: string;
  amount: number;
  method: 'Multicaixa' | 'Transferência';
  date: string;
  time: string;
  timestamp?: number; // epoch ms for sorting FIFO
  status: 'Concluído' | 'Pendente' | 'Cancelado';
  cvId?: string;
  targetCvId?: string;
  receiptUrl?: string;
  receiptFileName?: string;
  receiptFileSize?: string;
  receiptMimeType?: string;
  receiptUploadedAt?: string;
  referenceCode?: string;
  senderLast4?: string; // mandatory last 4 digits for cross-verification
  senderName?: string;
  templateName?: string;
  rejectionReason?: string;
  notifiedDiscord?: boolean;
  rejectedAttemptsCount?: number;
  isSuspicious?: boolean;
  auditLogs?: PaymentAuditLog[];
  reviewedBy?: string;
  reviewedAt?: string;
}

export interface CVTemplate {
  id: string;
  name: string;
  category: 'Mais popular' | 'Premium' | 'Em manutenção' | 'Novo' | 'Clássico';
  description: string;
  thumbnailUrl: string;
  isActive: boolean;
  popularityPercentage: number;
  layoutStyle: 'modern' | 'executive' | 'creative' | 'classic' | 'minimal';
}

export interface SystemSettings {
  platformName: string;
  basePriceKz: number;
  systemLanguage: string;
  supportPhone?: string;
  dataProtectionOfficer?: string;
  multicaixaEnabled: boolean;
  multicaixaPhone: string;
  multicaixaTerminalId: string;
  multicaixaPfxPassword: string;
  bankTransferEnabled: boolean;
  baiIban: string;
  baiAccountHolder: string;
  baiBankName: string;
  senderEmail: string;
  notifyNewSale: boolean;
  notifyNewUser: boolean;
  notifyAIFailure: boolean;
  discordWebhookUrl?: string;
  notifyDiscordOnPayment?: boolean;
}

export interface SupportTicket {
  id: string;
  userName: string;
  userEmail: string;
  subject: string;
  message: string;
  status: 'Aberto' | 'Em Resolução' | 'Fechado';
  priority: 'Alta' | 'Média' | 'Baixa';
  createdAt: string;
  reply?: string;
}

export interface DataAuditLog {
  id: string;
  accessedBy: string; // e.g. cv.ia.angola@gmail.com
  actorRole: string; // e.g. Administrador de Dados (DPO)
  targetUserId: string;
  targetUserName: string;
  accessType: 'visualizacao_cv' | 'visualizacao_comprovativo' | 'edicao_dados' | 'exportacao' | 'pedido_eliminacao' | 'aprovacao_pagamento';
  details: string;
  timestamp: string;
  ip?: string;
  encrypted?: boolean;
}

export interface DataDeletionRequest {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userPhone?: string;
  reason?: string;
  status: 'Pendente' | 'Processado' | 'Recusado';
  requestedAt: string;
  processedAt?: string;
  processedBy?: string;
  notes?: string;
}

