import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

async function optimizeImages() {
  console.log('--- Starting Image Compression & Optimization ---');

  // 1. Optimize Template Previews
  const imagesDir = path.resolve('src/assets/images');
  const files = fs.readdirSync(imagesDir);

  for (const file of files) {
    if (file.match(/\.(jpg|jpeg|png)$/i)) {
      const filePath = path.join(imagesDir, file);
      const originalSize = fs.statSync(filePath).size;
      const buffer = fs.readFileSync(filePath);

      // Re-encode with sharp: max width 800px (retina for 380px cards), mozjpeg compression at q:80
      const optimizedBuffer = await sharp(buffer)
        .resize({ width: 800, withoutEnlargement: true })
        .jpeg({ quality: 80, mozjpeg: true, progressive: true })
        .toBuffer();

      fs.writeFileSync(filePath, optimizedBuffer);
      const newSize = fs.statSync(filePath).size;
      console.log(`Optimized ${file}: ${(originalSize / 1024).toFixed(1)} KB -> ${(newSize / 1024).toFixed(1)} KB (${Math.round((1 - newSize / originalSize) * 100)}% saved)`);
    }
  }

  // 2. Optimize Public PNGs
  const publicDir = path.resolve('public');
  const publicFiles = ['logo-full.png', 'splash-icon.png', 'pwa-512x512.png', 'pwa-maskable-512x512.png', 'pwa-192x192.png'];

  for (const file of publicFiles) {
    const filePath = path.join(publicDir, file);
    if (fs.existsSync(filePath)) {
      const originalSize = fs.statSync(filePath).size;
      const buffer = fs.readFileSync(filePath);

      const optimizedBuffer = await sharp(buffer)
        .png({ compressionLevel: 9, adaptiveFiltering: true, palette: true, quality: 85 })
        .toBuffer();

      fs.writeFileSync(filePath, optimizedBuffer);
      const newSize = fs.statSync(filePath).size;
      console.log(`Optimized public/${file}: ${(originalSize / 1024).toFixed(1)} KB -> ${(newSize / 1024).toFixed(1)} KB (${Math.round((1 - newSize / originalSize) * 100)}% saved)`);
    }
  }

  console.log('--- All images optimized successfully! ---');
}

optimizeImages().catch(err => {
  console.error('Error optimizing images:', err);
  process.exit(1);
});
