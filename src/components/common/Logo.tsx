import React from 'react';

interface LogoProps {
  variant?: 'full' | 'icon';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showSubtitle?: boolean;
}

export const Logo: React.FC<LogoProps> = ({
  variant = 'full',
  size = 'md',
  className = '',
  showSubtitle = true,
}) => {
  if (variant === 'icon') {
    const iconDimensions = {
      xs: 'w-6 h-6',
      sm: 'w-8 h-8',
      md: 'w-10 h-10',
      lg: 'w-12 h-12',
      xl: 'w-16 h-16',
    }[size];

    return (
      <div className={`relative inline-flex items-center justify-center shrink-0 ${iconDimensions} ${className}`}>
        <svg
          viewBox="0 0 100 130"
          className="w-full h-full drop-shadow-xs"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="logoIconGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#0256c4" />
              <stop offset="35%" stopColor="#0066d6" />
              <stop offset="70%" stopColor="#008f88" />
              <stop offset="100%" stopColor="#00ab66" />
            </linearGradient>
            <linearGradient id="logoFoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#004899" />
              <stop offset="100%" stopColor="#003570" />
            </linearGradient>
          </defs>

          {/* Document Body with 3 rounded corners and 1 folded corner */}
          <path
            d="M 12 6 L 68 6 L 88 26 L 88 118 C 88 123.5 83.5 128 78 128 L 12 128 C 6.5 128 2 123.5 2 118 L 2 16 C 2 10.5 6.5 6 12 6 Z"
            fill="url(#logoIconGrad)"
          />

          {/* Fold at top right */}
          <path
            d="M 68 6 L 68 22 C 68 24.2 69.8 26 72 26 L 88 26 Z"
            fill="url(#logoFoldGrad)"
          />
          <path d="M 68 6 L 88 26" stroke="rgba(255,255,255,0.4)" strokeWidth="1" />

          {/* AI Circle at top */}
          <circle cx="45" cy="42" r="18" fill="#f8fafc" />
          <text
            x="45"
            y="43"
            textAnchor="middle"
            dominantBaseline="central"
            fontFamily="system-ui, -apple-system, sans-serif"
            fontWeight="800"
            fontSize="12"
            fill="#0256c4"
          >
            AI
          </text>

          {/* AI Network nodes at bottom */}
          <line x1="30" y1="88" x2="40" y2="98" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="40" y1="98" x2="52" y2="84" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="30" cy="88" r="3.5" fill="#ffffff" />
          <circle cx="52" cy="84" r="4.2" fill="#ffffff" />
          <circle cx="40" cy="98" r="3" fill="#ffffff" />

          {/* Baseline */}
          <rect x="26" y="110" width="28" height="2.5" rx="1.25" fill="#ffffff" />
        </svg>
      </div>
    );
  }

  // Full Logo (Document Icon on Left + Complete Typography & Waveform on Right)
  const fullScales = {
    xs: { h: 'h-7', icon: 'w-6 h-7', title: 'text-sm', sub: 'text-[7px]', space: 'gap-2' },
    sm: { h: 'h-9', icon: 'w-7 h-9', title: 'text-base', sub: 'text-[8.5px]', space: 'gap-2.5' },
    md: { h: 'h-11', icon: 'w-9 h-11', title: 'text-xl', sub: 'text-[9.5px]', space: 'gap-3' },
    lg: { h: 'h-14', icon: 'w-11 h-14', title: 'text-2xl', sub: 'text-[11px]', space: 'gap-3.5' },
    xl: { h: 'h-20', icon: 'w-16 h-20', title: 'text-3xl sm:text-4xl', sub: 'text-xs sm:text-sm', space: 'gap-4' },
  }[size];

  return (
    <div className={`inline-flex items-center select-none ${fullScales.space} ${className}`}>
      {/* Document Icon */}
      <div className={`relative shrink-0 ${fullScales.icon}`}>
        <svg
          viewBox="0 0 100 130"
          className="w-full h-full drop-shadow-xs"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="logoFullDocGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#0256c4" />
              <stop offset="35%" stopColor="#0066d6" />
              <stop offset="70%" stopColor="#008f88" />
              <stop offset="100%" stopColor="#00ab66" />
            </linearGradient>
            <linearGradient id="logoFullFoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#004899" />
              <stop offset="100%" stopColor="#003570" />
            </linearGradient>
          </defs>

          {/* Document Body */}
          <path
            d="M 12 6 L 68 6 L 88 26 L 88 118 C 88 123.5 83.5 128 78 128 L 12 128 C 6.5 128 2 123.5 2 118 L 2 16 C 2 10.5 6.5 6 12 6 Z"
            fill="url(#logoFullDocGrad)"
          />

          {/* Fold */}
          <path
            d="M 68 6 L 68 22 C 68 24.2 69.8 26 72 26 L 88 26 Z"
            fill="url(#logoFullFoldGrad)"
          />
          <path d="M 68 6 L 88 26" stroke="rgba(255,255,255,0.4)" strokeWidth="1" />

          {/* AI Circle */}
          <circle cx="45" cy="42" r="18" fill="#f8fafc" />
          <text
            x="45"
            y="43"
            textAnchor="middle"
            dominantBaseline="central"
            fontFamily="system-ui, -apple-system, sans-serif"
            fontWeight="800"
            fontSize="12"
            fill="#0256c4"
          >
            AI
          </text>

          {/* AI Nodes */}
          <line x1="30" y1="88" x2="40" y2="98" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="40" y1="98" x2="52" y2="84" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="30" cy="88" r="3.5" fill="#ffffff" />
          <circle cx="52" cy="84" r="4.2" fill="#ffffff" />
          <circle cx="40" cy="98" r="3" fill="#ffffff" />

          {/* Baseline */}
          <rect x="26" y="110" width="28" height="2.5" rx="1.25" fill="#ffffff" />
        </svg>
      </div>

      {/* Brand Typography & Tech Wave */}
      <div className="flex flex-col justify-center leading-tight">
        {/* Row 1: CV [Pulse] IA */}
        <div className="flex items-center gap-1">
          <span className={`font-black font-display tracking-tight text-primary ${fullScales.title}`}>
            CV
          </span>
          {/* Teal Heartbeat Wave */}
          <svg className="w-5 h-3 sm:w-6 sm:h-3.5 shrink-0" viewBox="0 0 40 20" fill="none">
            <path
              d="M 2 10 L 10 10 L 14 3 L 20 17 L 26 10 L 38 10"
              stroke="#0d9488"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className={`font-black font-display tracking-tight text-primary ${fullScales.title}`}>
            IA
          </span>
        </div>

        {/* Row 2: ANG [Tech Emblem] LA */}
        <div className="flex items-center gap-0.5">
          <span className={`font-bold font-display tracking-wide text-slate-800 dark:text-slate-200 ${size === 'xl' ? 'text-2xl sm:text-3xl' : size === 'lg' ? 'text-lg sm:text-xl' : size === 'md' ? 'text-sm sm:text-base' : 'text-xs'}`}>
            ANG
          </span>
          {/* Tech Emblem for 'O' */}
          <div className="relative inline-flex items-center justify-center mx-0.5 shrink-0">
            <svg className={size === 'xl' ? 'w-6 h-6' : size === 'lg' ? 'w-5 h-5' : size === 'md' ? 'w-4 h-4' : 'w-3 h-3'} viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="9" stroke="#1e293b" strokeWidth="2" />
              <circle cx="12" cy="3" r="1.8" fill="#0d9488" />
              <circle cx="20" cy="7.5" r="1.8" fill="#0d9488" />
              <circle cx="20" cy="16.5" r="1.8" fill="#0d9488" />
              <circle cx="12" cy="21" r="1.8" fill="#0d9488" />
              <circle cx="4" cy="16.5" r="1.8" fill="#0d9488" />
              <circle cx="4" cy="7.5" r="1.8" fill="#0d9488" />
              {/* Teal Chevron House */}
              <path d="M 12 7 L 16.5 12 L 16.5 16 C 16.5 16.5 16 17 15 17 L 9 17 C 8 17 7.5 16.5 7.5 16 L 7.5 12 Z" fill="#0d9488" />
            </svg>
          </div>
          <span className={`font-bold font-display tracking-wide text-slate-800 dark:text-slate-200 ${size === 'xl' ? 'text-2xl sm:text-3xl' : size === 'lg' ? 'text-lg sm:text-xl' : size === 'md' ? 'text-sm sm:text-base' : 'text-xs'}`}>
            LA
          </span>
        </div>

        {/* Row 3: Subtitle */}
        {showSubtitle && (
          <span className={`font-bold uppercase tracking-wider text-slate-500 mt-0.5 whitespace-nowrap ${fullScales.sub}`}>
            Currículo Profissional com IA
          </span>
        )}
      </div>
    </div>
  );
};
