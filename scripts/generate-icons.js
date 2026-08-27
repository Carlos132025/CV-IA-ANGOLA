import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

// Master Icon 1 (Document with folded corner, white circle with CV, 3 dark lines, navy background)
const iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <!-- Dark Navy Background Gradient -->
    <linearGradient id="iconBgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#050e20" />
      <stop offset="50%" stop-color="#040a18" />
      <stop offset="100%" stop-color="#02060f" />
    </linearGradient>

    <!-- Document Vibrant Blue to Turquoise Gradient -->
    <linearGradient id="iconDocGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0052cc" />
      <stop offset="30%" stop-color="#0066e6" />
      <stop offset="65%" stop-color="#00a8c6" />
      <stop offset="100%" stop-color="#00d896" />
    </linearGradient>

    <!-- Flap Cyan Gradient -->
    <linearGradient id="iconFlapGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#38ef7d" />
      <stop offset="50%" stop-color="#00f2fe" />
      <stop offset="100%" stop-color="#00b4d8" />
    </linearGradient>

    <!-- Document Drop Shadow -->
    <filter id="docShadow" x="-25%" y="-20%" width="150%" height="150%">
      <feDropShadow dx="0" dy="18" stdDeviation="22" flood-color="#000000" flood-opacity="0.8" />
      <feDropShadow dx="0" dy="4" stdDeviation="10" flood-color="#00b4d8" flood-opacity="0.3" />
    </filter>

    <!-- Circle Drop Shadow -->
    <filter id="circleShadow" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="6" stdDeviation="8" flood-color="#000000" flood-opacity="0.4" />
    </filter>
  </defs>

  <!-- Dark Navy Blue Canvas with rounded corners -->
  <rect width="512" height="512" rx="112" fill="url(#iconBgGrad)" />

  <!-- Document Silhouette -->
  <g filter="url(#docShadow)">
    <!-- Document Body with 3 rounded corners and top right angled fold cutout -->
    <path d="
      M 154 78 
      L 310 78 
      L 374 142 
      L 374 416 
      C 374 436 358 450 338 450 
      L 154 450 
      C 134 450 118 436 118 416 
      L 118 114 
      C 118 94 134 78 154 78 
      Z" 
      fill="url(#iconDocGrad)" 
    />

    <!-- Folded Flap Corner (Top Right) with Cyan Gradient and realistic shadow -->
    <path d="
      M 310 78 
      L 310 120 
      C 310 132 322 142 334 142 
      L 374 142 
      Z" 
      fill="url(#iconFlapGrad)" 
    />
    <path d="M 310 78 L 374 142" stroke="rgba(255,255,255,0.4)" stroke-width="2.5" />

    <!-- White Circular Badge with 'CV' -->
    <g filter="url(#circleShadow)">
      <circle cx="246" cy="204" r="62" fill="#ffffff" />
      <circle cx="246" cy="204" r="59" fill="none" stroke="#e0f2fe" stroke-width="2" />
    </g>

    <!-- 'CV' Bold Typography inside White Circle -->
    <text 
      x="246" 
      y="207" 
      text-anchor="middle" 
      dominant-baseline="central" 
      font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif" 
      font-weight="900" 
      font-size="52" 
      fill="#040a18" 
      letter-spacing="-1"
    >CV</text>

    <!-- 3 Dark Blue-Navy Horizontal Lines -->
    <!-- Line 1 (Longest) -->
    <rect x="170" y="296" width="152" height="14" rx="7" fill="#040a18" opacity="0.95" />
    <!-- Line 2 (Medium) -->
    <rect x="170" y="326" width="118" height="13" rx="6.5" fill="#040a18" opacity="0.95" />
    <!-- Line 3 (Shortest) -->
    <rect x="170" y="356" width="84" height="12" rx="6" fill="#040a18" opacity="0.95" />
  </g>
</svg>`;

// Master Maskable Icon (10-15% safety margin on full bleed background)
const maskableSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="maskBgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#050e20" />
      <stop offset="50%" stop-color="#040a18" />
      <stop offset="100%" stop-color="#02060f" />
    </linearGradient>

    <linearGradient id="maskDocGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0052cc" />
      <stop offset="30%" stop-color="#0066e6" />
      <stop offset="65%" stop-color="#00a8c6" />
      <stop offset="100%" stop-color="#00d896" />
    </linearGradient>

    <linearGradient id="maskFlapGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#38ef7d" />
      <stop offset="50%" stop-color="#00f2fe" />
      <stop offset="100%" stop-color="#00b4d8" />
    </linearGradient>

    <filter id="maskShadow" x="-25%" y="-20%" width="150%" height="150%">
      <feDropShadow dx="0" dy="14" stdDeviation="18" flood-color="#000000" flood-opacity="0.8" />
      <feDropShadow dx="0" dy="4" stdDeviation="8" flood-color="#00b4d8" flood-opacity="0.3" />
    </filter>

    <filter id="maskCircleShadow" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#000000" flood-opacity="0.4" />
    </filter>
  </defs>

  <!-- Full-Bleed Dark Navy Background without corner rounding -->
  <rect width="512" height="512" fill="url(#maskBgGrad)" />

  <!-- Document scaled to fit the 12% safety margin circle -->
  <g transform="translate(256, 256) scale(0.85) translate(-246, -264)" filter="url(#maskShadow)">
    <path d="
      M 154 78 
      L 310 78 
      L 374 142 
      L 374 416 
      C 374 436 358 450 338 450 
      L 154 450 
      C 134 450 118 436 118 416 
      L 118 114 
      C 118 94 134 78 154 78 
      Z" 
      fill="url(#maskDocGrad)" 
    />

    <path d="
      M 310 78 
      L 310 120 
      C 310 132 322 142 334 142 
      L 374 142 
      Z" 
      fill="url(#maskFlapGrad)" 
    />
    <path d="M 310 78 L 374 142" stroke="rgba(255,255,255,0.4)" stroke-width="2.5" />

    <g filter="url(#maskCircleShadow)">
      <circle cx="246" cy="204" r="62" fill="#ffffff" />
      <circle cx="246" cy="204" r="59" fill="none" stroke="#e0f2fe" stroke-width="2" />
    </g>

    <text 
      x="246" 
      y="207" 
      text-anchor="middle" 
      dominant-baseline="central" 
      font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif" 
      font-weight="900" 
      font-size="52" 
      fill="#040a18" 
      letter-spacing="-1"
    >CV</text>

    <rect x="170" y="296" width="152" height="14" rx="7" fill="#040a18" opacity="0.95" />
    <rect x="170" y="326" width="118" height="13" rx="6.5" fill="#040a18" opacity="0.95" />
    <rect x="170" y="356" width="84" height="12" rx="6" fill="#040a18" opacity="0.95" />
  </g>
</svg>`;

// Master Full Logo (Left: Document Icon, Right: CVIA with checkmark V + ANGOLA with arrow in O + Subtitle)
const fullLogoSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 680 280" width="680" height="280">
  <defs>
    <!-- Background Gradient for standalone rendering -->
    <linearGradient id="fullBgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#050e20" />
      <stop offset="50%" stop-color="#040a18" />
      <stop offset="100%" stop-color="#02060f" />
    </linearGradient>

    <!-- Document Vibrant Blue to Turquoise Gradient -->
    <linearGradient id="fullDocGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0052cc" />
      <stop offset="30%" stop-color="#0066e6" />
      <stop offset="65%" stop-color="#00a8c6" />
      <stop offset="100%" stop-color="#00d896" />
    </linearGradient>

    <!-- Flap Cyan Gradient -->
    <linearGradient id="fullFlapGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#38ef7d" />
      <stop offset="50%" stop-color="#00f2fe" />
      <stop offset="100%" stop-color="#00b4d8" />
    </linearGradient>

    <!-- Checkmark V Gradient -->
    <linearGradient id="checkVGrad" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#00d896" />
      <stop offset="60%" stop-color="#00f2fe" />
      <stop offset="100%" stop-color="#38ef7d" />
    </linearGradient>

    <!-- IA Gradient -->
    <linearGradient id="iaGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#00b4d8" />
      <stop offset="50%" stop-color="#0077b6" />
      <stop offset="100%" stop-color="#0256c4" />
    </linearGradient>

    <!-- O Circle Glow & Ring Gradient -->
    <linearGradient id="oRingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#00b4d8" />
      <stop offset="100%" stop-color="#0052cc" />
    </linearGradient>

    <!-- Arrow Inside O Gradient -->
    <linearGradient id="oArrowGrad" x1="0%" y1="100%" x2="0%" y2="0%">
      <stop offset="0%" stop-color="#00b4d8" />
      <stop offset="100%" stop-color="#00f2fe" />
    </linearGradient>

    <!-- Divider Line Glow -->
    <linearGradient id="dividerGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#00f2fe" stop-opacity="0" />
      <stop offset="45%" stop-color="#00f2fe" stop-opacity="0.8" />
      <stop offset="50%" stop-color="#ffffff" stop-opacity="1" />
      <stop offset="55%" stop-color="#00f2fe" stop-opacity="0.8" />
      <stop offset="100%" stop-color="#00f2fe" stop-opacity="0" />
    </linearGradient>

    <filter id="fullDocShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#000000" flood-opacity="0.6" />
      <feDropShadow dx="0" dy="2" stdDeviation="6" flood-color="#00b4d8" flood-opacity="0.35" />
    </filter>

    <filter id="glowEffect" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="0" stdDeviation="6" flood-color="#00f2fe" flood-opacity="0.45" />
    </filter>
  </defs>

  <!-- Left: Document Icon (1:1 with Image 2) -->
  <g transform="translate(30, 32) scale(0.42)" filter="url(#fullDocShadow)">
    <path d="
      M 154 78 
      L 310 78 
      L 374 142 
      L 374 416 
      C 374 436 358 450 338 450 
      L 154 450 
      C 134 450 118 436 118 416 
      L 118 114 
      C 118 94 134 78 154 78 
      Z" 
      fill="url(#fullDocGrad)" 
    />

    <path d="
      M 310 78 
      L 310 120 
      C 310 132 322 142 334 142 
      L 374 142 
      Z" 
      fill="url(#fullFlapGrad)" 
    />
    <path d="M 310 78 L 374 142" stroke="rgba(255,255,255,0.4)" stroke-width="2.5" />

    <!-- White Circle with 'CV' or 'AI' -->
    <circle cx="246" cy="204" r="62" fill="#ffffff" />
    <text 
      x="246" 
      y="207" 
      text-anchor="middle" 
      dominant-baseline="central" 
      font-family="system-ui, -apple-system, sans-serif" 
      font-weight="900" 
      font-size="48" 
      fill="#040a18" 
      letter-spacing="-1"
    >CV</text>

    <!-- 3 Horizontal Lines -->
    <rect x="170" y="296" width="152" height="14" rx="7" fill="#040a18" opacity="0.95" />
    <rect x="170" y="326" width="118" height="13" rx="6.5" fill="#040a18" opacity="0.95" />
    <rect x="170" y="356" width="84" height="12" rx="6" fill="#040a18" opacity="0.95" />
  </g>

  <!-- Right: Typography -->
  <!-- Top Line: CVIA -->
  <g transform="translate(230, 96)">
    <!-- Letter 'C' in bold white -->
    <text x="0" y="0" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="900" font-size="78" fill="#ffffff" letter-spacing="-2">C</text>

    <!-- Stylized Checkmark 'V' in vibrant turquoise/cyan gradient -->
    <path d="M 54 -18 L 84 10 L 140 -56 L 126 -56 L 82 -2 L 64 -18 Z" fill="url(#checkVGrad)" filter="url(#glowEffect)" />

    <!-- 'IA' in electric cyan-to-blue gradient -->
    <text x="146" y="0" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="900" font-size="78" fill="url(#iaGrad)" letter-spacing="-2">IA</text>
  </g>

  <!-- Bottom Line: ANGOLA -->
  <g transform="translate(230, 168)">
    <!-- 'ANG' in bold white -->
    <text x="0" y="0" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="900" font-size="54" fill="#ffffff" letter-spacing="1">ANG</text>

    <!-- 'O' with blue glowing ring and upward cyan arrow -->
    <g transform="translate(142, -18)">
      <!-- Outer Glowing Ring -->
      <circle cx="24" cy="0" r="23" fill="none" stroke="url(#oRingGrad)" stroke-width="4.5" filter="url(#glowEffect)" />
      <!-- House / Arrow Icon inside -->
      <path d="M 24 -12 L 35 0 L 30 0 L 30 11 L 18 11 L 18 0 L 13 0 Z" fill="url(#oArrowGrad)" />
    </g>

    <!-- 'LA' in bold white -->
    <text x="198" y="0" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="900" font-size="54" fill="#ffffff" letter-spacing="1">LA</text>
  </g>

  <!-- Sleek Glowing Divider Line -->
  <line x1="230" y1="196" x2="620" y2="196" stroke="url(#dividerGrad)" stroke-width="1.8" />
  <polygon points="425,193 429,196 425,199 421,196" fill="#ffffff" filter="url(#glowEffect)" />

  <!-- Subtitle: CURRÍCULO PROFISSIONAL COM IA -->
  <text 
    x="425" 
    y="226" 
    text-anchor="middle" 
    font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" 
    font-weight="800" 
    font-size="15" 
    fill="#ffffff" 
    letter-spacing="5.5"
  >
    CURRÍCULO PROFISSIONAL <tspan fill="#00f2fe">COM IA</tspan>
  </text>
</svg>`;

async function buildVisualAssets() {
  const publicDir = path.join(process.cwd(), 'public');

  console.log('Writing vector files...');
  fs.writeFileSync(path.join(publicDir, 'icon.svg'), iconSvg);
  fs.writeFileSync(path.join(publicDir, 'pwa-maskable.svg'), maskableSvg);
  fs.writeFileSync(path.join(publicDir, 'logo-full.svg'), fullLogoSvg);

  const iconBuffer = Buffer.from(iconSvg);
  const maskableBuffer = Buffer.from(maskableSvg);
  const fullLogoBuffer = Buffer.from(fullLogoSvg);

  console.log('Generating PNG raster files via Sharp...');
  // 1. PWA & Mobile App Icons
  await sharp(iconBuffer).resize(512, 512).png().toFile(path.join(publicDir, 'pwa-512x512.png'));
  await sharp(iconBuffer).resize(192, 192).png().toFile(path.join(publicDir, 'pwa-192x192.png'));
  await sharp(maskableBuffer).resize(512, 512).png().toFile(path.join(publicDir, 'pwa-maskable-512x512.png'));
  await sharp(iconBuffer).resize(512, 512).png().toFile(path.join(publicDir, 'splash-icon.png'));

  // 2. Apple Touch Icon (180x180)
  await sharp(maskableBuffer).resize(180, 180).png().toFile(path.join(publicDir, 'apple-touch-icon.png'));

  // 3. Favicon formats
  await sharp(iconBuffer).resize(48, 48).png().toFile(path.join(publicDir, 'favicon-48x48.png'));
  await sharp(iconBuffer).resize(32, 32).png().toFile(path.join(publicDir, 'favicon-32x32.png'));
  await sharp(iconBuffer).resize(16, 16).png().toFile(path.join(publicDir, 'favicon-16x16.png'));
  await sharp(iconBuffer).resize(32, 32).png().toFile(path.join(publicDir, 'favicon.ico'));

  // 4. Full Logo PNG
  await sharp(fullLogoBuffer).resize(1360, 560).png().toFile(path.join(publicDir, 'logo-full.png'));

  console.log('All visual assets updated successfully!');
}

buildVisualAssets().catch((err) => {
  console.error('Error building assets:', err);
  process.exit(1);
});
