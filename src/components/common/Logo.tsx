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
          viewBox="0 0 100 120"
          className="w-full h-full drop-shadow-sm"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="reactIconDocGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0052cc" />
              <stop offset="30%" stopColor="#0066e6" />
              <stop offset="65%" stopColor="#00a8c6" />
              <stop offset="100%" stopColor="#00d896" />
            </linearGradient>
            <linearGradient id="reactIconFlapGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#38ef7d" />
              <stop offset="50%" stopColor="#00f2fe" />
              <stop offset="100%" stopColor="#00b4d8" />
            </linearGradient>
          </defs>

          {/* Document Body with 3 rounded corners and 1 folded corner */}
          <path
            d="M 12 6 L 68 6 L 88 26 L 88 110 C 88 115.5 83.5 120 78 120 L 12 120 C 6.5 120 2 115.5 2 110 L 2 16 C 2 10.5 6.5 6 12 6 Z"
            fill="url(#reactIconDocGrad)"
          />

          {/* Fold at top right */}
          <path
            d="M 68 6 L 68 22 C 68 24.2 69.8 26 72 26 L 88 26 Z"
            fill="url(#reactIconFlapGrad)"
          />
          <path d="M 68 6 L 88 26" stroke="rgba(255,255,255,0.4)" strokeWidth="1" />

          {/* White Circle with CV */}
          <circle cx="45" cy="45" r="19" fill="#ffffff" />
          <text
            x="45"
            y="46"
            textAnchor="middle"
            dominantBaseline="central"
            fontFamily="system-ui, -apple-system, sans-serif"
            fontWeight="900"
            fontSize="14"
            fill="#040a18"
            letterSpacing="-0.5"
          >
            CV
          </text>

          {/* Resume Accent Bars */}
          <rect x="20" y="74" width="48" height="4" rx="2" fill="#040a18" opacity="0.9" />
          <rect x="20" y="83" width="36" height="3.5" rx="1.75" fill="#040a18" opacity="0.9" />
          <rect x="20" y="92" width="26" height="3.5" rx="1.75" fill="#040a18" opacity="0.9" />
        </svg>
      </div>
    );
  }

  // Full Logo (Document Icon on Left + Complete Typography from Image 2)
  const fullScales = {
    xs: { h: 'h-7', icon: 'w-6 h-7', title: 'text-xs', angola: 'text-[9.5px]', sub: 'text-[6.5px]', space: 'gap-1.5' },
    sm: { h: 'h-9', icon: 'w-7 h-9', title: 'text-sm', angola: 'text-[11.5px]', sub: 'text-[7.5px]', space: 'gap-2' },
    md: { h: 'h-11', icon: 'w-9 h-11', title: 'text-base sm:text-lg', angola: 'text-xs sm:text-sm', sub: 'text-[8.5px] sm:text-[9.5px]', space: 'gap-2.5' },
    lg: { h: 'h-14', icon: 'w-11 h-14', title: 'text-xl sm:text-2xl', angola: 'text-base sm:text-lg', sub: 'text-[10px] sm:text-xs', space: 'gap-3' },
    xl: { h: 'h-20', icon: 'w-16 h-20', title: 'text-3xl sm:text-4xl', angola: 'text-2xl sm:text-3xl', sub: 'text-xs sm:text-sm', space: 'gap-4' },
  }[size];

  return (
    <div className={`inline-flex items-center select-none ${fullScales.space} ${className}`}>
      {/* Document Icon */}
      <div className={`relative shrink-0 ${fullScales.icon}`}>
        <svg
          viewBox="0 0 100 120"
          className="w-full h-full drop-shadow-sm"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="reactFullDocGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0052cc" />
              <stop offset="30%" stopColor="#0066e6" />
              <stop offset="65%" stopColor="#00a8c6" />
              <stop offset="100%" stopColor="#00d896" />
            </linearGradient>
            <linearGradient id="reactFullFlapGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#38ef7d" />
              <stop offset="50%" stopColor="#00f2fe" />
              <stop offset="100%" stopColor="#00b4d8" />
            </linearGradient>
          </defs>

          {/* Document Body */}
          <path
            d="M 12 6 L 68 6 L 88 26 L 88 110 C 88 115.5 83.5 120 78 120 L 12 120 C 6.5 120 2 115.5 2 110 L 2 16 C 2 10.5 6.5 6 12 6 Z"
            fill="url(#reactFullDocGrad)"
          />

          {/* Fold */}
          <path
            d="M 68 6 L 68 22 C 68 24.2 69.8 26 72 26 L 88 26 Z"
            fill="url(#reactFullFlapGrad)"
          />
          <path d="M 68 6 L 88 26" stroke="rgba(255,255,255,0.4)" strokeWidth="1" />

          {/* White Circle with CV */}
          <circle cx="45" cy="45" r="19" fill="#ffffff" />
          <text
            x="45"
            y="46"
            textAnchor="middle"
            dominantBaseline="central"
            fontFamily="system-ui, -apple-system, sans-serif"
            fontWeight="900"
            fontSize="14"
            fill="#040a18"
            letterSpacing="-0.5"
          >
            CV
          </text>

          {/* Resume Accent Bars */}
          <rect x="20" y="74" width="48" height="4" rx="2" fill="#040a18" opacity="0.9" />
          <rect x="20" y="83" width="36" height="3.5" rx="1.75" fill="#040a18" opacity="0.9" />
          <rect x="20" y="92" width="26" height="3.5" rx="1.75" fill="#040a18" opacity="0.9" />
        </svg>
      </div>

      {/* Brand Typography (C + Checkmark V + IA / ANG + Arrow-in-O + LA) */}
      <div className="flex flex-col justify-center leading-none">
        {/* Row 1: C + Checkmark V + IA */}
        <div className="flex items-center">
          <span className={`font-black font-display tracking-tight text-slate-900 dark:text-white ${fullScales.title}`}>
            C
          </span>
          {/* Stylized Checkmark V */}
          <span className="inline-flex items-center justify-center -mx-0.5">
            <svg
              className={size === 'xl' ? 'w-8 h-8' : size === 'lg' ? 'w-6 h-6' : size === 'md' ? 'w-5 h-5' : size === 'sm' ? 'w-4 h-4' : 'w-3 h-3'}
              viewBox="0 0 40 40"
              fill="none"
            >
              <defs>
                <linearGradient id="checkVReact" x1="0%" y1="100%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#00d896" />
                  <stop offset="50%" stopColor="#00f2fe" />
                  <stop offset="100%" stopColor="#38ef7d" />
                </linearGradient>
              </defs>
              <path
                d="M 6 18 L 16 32 L 36 6 L 30 6 L 16 26 L 10 18 Z"
                fill="url(#checkVReact)"
              />
            </svg>
          </span>
          {/* IA in vibrant cyan-blue gradient */}
          <span className={`font-black font-display tracking-tight bg-gradient-to-r from-[#00b4d8] via-[#0077b6] to-[#0256c4] bg-clip-text text-transparent ${fullScales.title}`}>
            IA
          </span>
        </div>

        {/* Row 2: ANG + [Arrow-O] + LA */}
        <div className="flex items-center mt-0.5">
          <span className={`font-bold font-display tracking-wider text-slate-800 dark:text-slate-200 ${fullScales.angola}`}>
            ANG
          </span>
          {/* Circular ring with upward cyan arrow inside */}
          <span className="inline-flex items-center justify-center mx-0.5">
            <svg
              className={size === 'xl' ? 'w-5 h-5' : size === 'lg' ? 'w-4 h-4' : size === 'md' ? 'w-3.5 h-3.5' : size === 'sm' ? 'w-3 h-3' : 'w-2.5 h-2.5'}
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle cx="12" cy="12" r="10" stroke="#00b4d8" strokeWidth="2.5" />
              <path d="M 12 5 L 18 12 L 15 12 L 15 18 L 9 18 L 9 12 L 6 12 Z" fill="#00f2fe" />
            </svg>
          </span>
          <span className={`font-bold font-display tracking-wider text-slate-800 dark:text-slate-200 ${fullScales.angola}`}>
            LA
          </span>
        </div>

        {/* Row 3: Subtitle */}
        {showSubtitle && (
          <div className="mt-1 flex items-center gap-1">
            <span className={`font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 whitespace-nowrap ${fullScales.sub}`}>
              Currículo Profissional <span className="text-[#00b4d8] font-extrabold">com IA</span>
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
