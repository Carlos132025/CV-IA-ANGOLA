import { AppUser, CVTemplate, ResumeData, ReviewItem, SupportTicket, SystemSettings, Transaction } from '../types';
import classicSimplePreview from '../assets/images/classic_simple_cv_1788008018989.jpg';
import creativeTechPreview from '../assets/images/creative_tech_cv_1788008034328.jpg';
import executiveClassicPreview from '../assets/images/executive_classic_cv_1788008047573.jpg';
import luminaModernPreview from '../assets/images/lumina_modern_cv_1788008062814.jpg';

export const APP_LOGO = '/logo-full.svg';
export const APP_ICON = '/icon.svg';

export const TEMPLATE_THUMBNAILS: Record<string, string> = {
  'classic-simple': classicSimplePreview,
  'creative-tech': creativeTechPreview,
  'executive-classic': executiveClassicPreview,
  'lumina-modern': luminaModernPreview,
};

export function getTemplateThumbnail(templateOrId?: CVTemplate | string | null): string {
  if (!templateOrId) return luminaModernPreview;
  const id = typeof templateOrId === 'string' ? templateOrId : templateOrId?.id;
  const directThumbnail = typeof templateOrId === 'object' ? templateOrId?.thumbnailUrl : undefined;

  // If a valid bundled module or base64 or valid URL is present
  if (
    directThumbnail &&
    typeof directThumbnail === 'string' &&
    directThumbnail.length > 5 &&
    !directThumbnail.includes('cv_classic_simple_preview') &&
    !directThumbnail.includes('cv_creative_tech_preview') &&
    !directThumbnail.includes('cv_executive_classic_preview') &&
    !directThumbnail.includes('cv_lumina_modern_preview')
  ) {
    return directThumbnail;
  }

  return (id && TEMPLATE_THUMBNAILS[id]) || luminaModernPreview;
}

export const INITIAL_SETTINGS: SystemSettings = {
  platformName: 'CV IA Angola',
  basePriceKz: 2000,
  systemLanguage: 'pt-AO',
  supportPhone: '957 427 090',
  dataProtectionOfficer: 'CV IA Angola (Chinua Ndembo, Lda)',
  multicaixaEnabled: true,
  multicaixaPhone: '923 845 779',
  multicaixaTerminalId: '98765432',
  multicaixaPfxPassword: '••••••••',
  bankTransferEnabled: true,
  baiIban: '0040 0000 6273 9820 1010 9',
  baiAccountHolder: 'Chinua Ndembo, Lda',
  baiBankName: 'Banco Angolano de Investimentos (BAI)',
  senderEmail: 'noreply@cviaangola.ao',
  notifyNewSale: true,
  notifyNewUser: true,
  notifyAIFailure: false,
  discordWebhookUrl: '',
  notifyDiscordOnPayment: true,
};

export const INITIAL_TEMPLATES: CVTemplate[] = [
  {
    id: 'classic-simple',
    name: 'Classic Simple',
    category: 'Clássico',
    description: 'Estrutura direta em coluna única preto e branco, recomendada para concursos públicos, candidaturas formais e setor educacional.',
    thumbnailUrl: classicSimplePreview,
    isActive: true,
    popularityPercentage: 24,
    layoutStyle: 'classic',
  },
  {
    id: 'creative-tech',
    name: 'Creative Tech',
    category: 'Novo',
    description: 'Layout moderno e dinâmico para profissionais de tecnologia, engenharia, design, marketing e startups.',
    thumbnailUrl: creativeTechPreview,
    isActive: true,
    popularityPercentage: 31,
    layoutStyle: 'creative',
  },
  {
    id: 'executive-classic',
    name: 'Executive Classic',
    category: 'Premium',
    description: 'Estilo executivo sofisticado com tipografia refinada, ideal para cargos de chefia, banca, consultoria e finanças.',
    thumbnailUrl: executiveClassicPreview,
    isActive: true,
    popularityPercentage: 35,
    layoutStyle: 'executive',
  },
  {
    id: 'lumina-modern',
    name: 'Lumina Modern',
    category: 'Mais popular',
    description: 'Design contemporâneo com cabeçalho de destaque, barra lateral equilibrada e máxima legibilidade para sistemas de recrutamento.',
    thumbnailUrl: luminaModernPreview,
    isActive: true,
    popularityPercentage: 45,
    layoutStyle: 'modern',
  },
];

export const INITIAL_USERS: AppUser[] = [
  {
    id: 'usr-admin-cviaangola',
    name: 'Admin CV IA Angola',
    email: 'cv.ia.angola@gmail.com',
    phone: '+244 957 427 090',
    password: 'admin.cviaangola',
    role: 'admin',
    initials: 'CV',
    registrationDate: '01 Jan 2024',
    cvsGenerated: 0,
    status: 'Ativo',
  },
];

export const INITIAL_TRANSACTIONS: Transaction[] = [];

export const INITIAL_REVIEWS: ReviewItem[] = [
  {
    id: 'rev-1',
    userId: 'usr-client-1',
    userName: 'António Gaspar',
    userRole: 'Engenheiro de Software',
    userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    rating: 5,
    comment: 'Consegui ser chamado para entrevistas na banca em Luanda! As sugestões de IA adaptadas ao mercado angolano e o layout Lumina Modern deram enorme destaque ao meu perfil.',
    date: 'Há 2 dias',
    isVerifiedBuyer: true,
    templateName: 'Lumina Modern',
  },
  {
    id: 'rev-2',
    userId: 'usr-client-2',
    userName: 'Mariana Fernandes',
    userRole: 'Contabilista & Auditora',
    rating: 5,
    comment: 'Paguei 2.000 Kz por Multicaixa Express e o processo foi rápido e sem complicações. O CV ficou com uma aparência executiva impecável, pronto a imprimir e enviar.',
    date: 'Há 4 dias',
    isVerifiedBuyer: true,
    templateName: 'Executive Classic',
  },
];

export const INITIAL_RESUME: ResumeData = {
  id: 'res-empty-default',
  userId: 'usr-guest',
  title: 'Meu Currículo',
  createdAt: new Date().toLocaleDateString('pt-AO', { day: '2-digit', month: 'short', year: 'numeric' }),
  updatedAt: 'Criado agora',
  templateId: 'lumina-modern',
  accentColor: '#004ac6',
  isPaid: false,
  downloadsRemaining: 0,
  downloadCount: 0,
  paymentStatus: 'none',
  personalInfo: {
    fullName: '',
    professionalTitle: '',
    email: '',
    phone: '',
    location: 'Luanda, Angola',
    photoUrl: '',
    autoCropFace: true,
    neutralBackground: true,
    professionalSummary: '',
    linkedinUrl: '',
    nationality: 'Angolana',
    driverLicense: '',
  },
  experiences: [],
  educations: [],
  certifications: [],
  skills: [],
  languages: [
    { id: 'lang-default-1', language: 'Português', proficiency: 'Nativo' },
  ],
  references: [],
};

export const INITIAL_USER_CVS: ResumeData[] = [];

export const createNewEmptyResume = (
  userId: string,
  title?: string,
  templateId: string = 'lumina-modern',
  initialName: string = ''
): ResumeData => {
  const now = new Date();
  const day = now.getDate().toString().padStart(2, '0');
  const month = now.toLocaleString('pt-AO', { month: 'short' });
  const year = now.getFullYear();
  const dateFormatted = `${day} ${month} ${year}`;

  return {
    id: `cv-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    userId,
    title: title?.trim() || 'Novo Currículo',
    createdAt: dateFormatted,
    updatedAt: 'Criado agora',
    templateId,
    accentColor: '#004ac6',
    isPaid: false,
    downloadsRemaining: 0,
    downloadCount: 0,
    paymentStatus: 'none',
    personalInfo: {
      fullName: initialName || '',
      professionalTitle: '',
      email: '',
      phone: '',
      location: 'Luanda, Angola',
      photoUrl: '',
      autoCropFace: true,
      neutralBackground: true,
      professionalSummary: '',
      linkedinUrl: '',
      nationality: 'Angolana',
      driverLicense: '',
    },
    experiences: [],
    educations: [],
    certifications: [],
    skills: [],
    languages: [
      { id: `lang-${Date.now()}-1`, language: 'Português', proficiency: 'Fluente' },
    ],
    references: [],
  };
};

export const AI_SUMMARY_SUGGESTIONS = [
  {
    role: 'Contabilidade & Finanças',
    text: 'Contabilista certificado com 5 anos de experiência em gestão financeira e auditoria no setor bancário angolano. Especialista em conformidade fiscal (AGT), fecho de contas e relatórios de desempenho.',
  },
  {
    role: 'Atendimento & Vendas',
    text: 'Especialista em Atendimento ao Cliente com forte foco em resolução de conflitos e fidelização. Experiência comprovada em ambientes de retalho e telecomunicações de alto volume em Luanda.',
  },
  {
    role: 'Logística & Suprimentos',
    text: 'Gestor de Logística focado na otimização de cadeias de suprimentos e redução de custos operacionais. Conhecimento profundo das rotas comerciais nacionais e desalfandegamento portuário.',
  },
  {
    role: 'Engenharia & Petróleo',
    text: 'Engenheiro com sólida vivência em operações industriais e offshore em Angola. Focado em padrões rigorosos de segurança (HSE), manutenção preventiva e eficiência energética.',
  },
  {
    role: 'Recém-Licenciado / Primeiro Emprego',
    text: 'Jovem profissional recém-licenciado com sólida formação académica, perfil proativo e elevada vontade de aprender. Excelente comunicação interpessoal e domínio de ferramentas digitais.',
  },
];

export const INITIAL_TICKETS: SupportTicket[] = [];
