import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

async function generateIcons() {
  const svgPath = path.resolve('public/icon.svg');
  const svgBuffer = fs.readFileSync(svgPath);

  const targets = [
    { name: 'pwa-192x192.png', size: 192, pad: 0 },
    { name: 'pwa-512x512.png', size: 512, pad: 0 },
    { name: 'apple-touch-icon.png', size: 180, pad: 0 },
    { name: 'pwa-maskable-512x512.png', size: 512, pad: 40 },
  ];

  for (const t of targets) {
    const outPath = path.resolve('public', t.name);
    if (t.pad > 0) {
      // Create maskable with safe-zone margin
      const innerSize = t.size - (t.pad * 2);
      const innerBuffer = await sharp(svgBuffer)
        .resize(innerSize, innerSize)
        .toBuffer();

      await sharp({
        create: {
          width: t.size,
          height: t.size,
          channels: 4,
          background: { r: 7, g: 11, b: 20, alpha: 1 }
        }
      })
      .composite([{ input: innerBuffer, top: t.pad, left: t.pad }])
      .png()
      .toFile(outPath);
    } else {
      await sharp(svgBuffer)
        .resize(t.size, t.size)
        .png()
        .toFile(outPath);
    }
    console.log(`Generated ${t.name}`);
  }

  // Also create favicon.ico from 32x32 png
  await sharp(svgBuffer)
    .resize(32, 32)
    .png()
    .toFile(path.resolve('public/favicon.ico'));

  console.log('All PWA icons generated successfully!');
}

generateIcons().catch(console.error);
