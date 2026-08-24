import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

async function generateIcons() {
  const iconSvgPath = path.resolve('public/icon.svg');
  const maskableSvgPath = path.resolve('public/pwa-maskable.svg');
  const logoFullSvgPath = path.resolve('public/logo-full.svg');

  const iconSvgBuffer = fs.readFileSync(iconSvgPath);
  const maskableSvgBuffer = fs.readFileSync(maskableSvgPath);
  const logoFullSvgBuffer = fs.readFileSync(logoFullSvgPath);

  console.log('Generating PNG icons from SVGs...');

  // 16x16 Favicon PNG
  await sharp(iconSvgBuffer)
    .resize(16, 16)
    .png()
    .toFile('public/favicon-16x16.png');

  // 32x32 Favicon PNG
  await sharp(iconSvgBuffer)
    .resize(32, 32)
    .png()
    .toFile('public/favicon-32x32.png');

  // 48x48 Favicon PNG
  await sharp(iconSvgBuffer)
    .resize(48, 48)
    .png()
    .toFile('public/favicon-48x48.png');

  // 180x180 Apple Touch Icon
  await sharp(iconSvgBuffer)
    .resize(180, 180)
    .png()
    .toFile('public/apple-touch-icon.png');

  // 192x192 PWA Icon
  await sharp(iconSvgBuffer)
    .resize(192, 192)
    .png()
    .toFile('public/pwa-192x192.png');

  // 512x512 PWA Icon
  await sharp(iconSvgBuffer)
    .resize(512, 512)
    .png()
    .toFile('public/pwa-512x512.png');

  // 512x512 PWA Maskable Icon (with safe padding margin)
  await sharp(maskableSvgBuffer)
    .resize(512, 512)
    .png()
    .toFile('public/pwa-maskable-512x512.png');

  // Full Logo PNG (high resolution raster)
  await sharp(logoFullSvgBuffer)
    .resize(1080, 480)
    .png()
    .toFile('public/logo-full.png');

  // Splash Screen Background PNG (e.g. 512x512 with document centered)
  await sharp(iconSvgBuffer)
    .resize(512, 512)
    .png()
    .toFile('public/splash-icon.png');

  console.log('All icons generated successfully!');
}

generateIcons().catch(err => {
  console.error('Error generating icons:', err);
  process.exit(1);
});
