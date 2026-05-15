import sharp from 'sharp';
import { readdir, stat, rename } from 'fs/promises';
import { join, extname, basename } from 'path';

const PUBLIC_DIR = './public';

// Config: max width for each image (mobile-first, retina 2x)
const IMAGE_CONFIG = {
  'hero-bg.png':           { width: 1920, quality: 82 }, // full-width hero
  'bg-ballroom.png':       { width: 1920, quality: 80 },
  'bg-dance.png':          { width: 1920, quality: 80 },
  'bg-outdoor-prom.png':   { width: 1920, quality: 80 },
  'bg-venue.png':          { width: 1920, quality: 80 },
  'logo.png':              { width: 400,  quality: 90 },
  'logo_transparent.png':  { width: 400,  quality: 90 },
  'logo.jpg':              { width: 400,  quality: 90 },
};

async function getFileSize(path) {
  const s = await stat(path);
  return (s.size / 1024).toFixed(1) + ' KB';
}

async function optimizeImage(filename, config) {
  const inputPath = join(PUBLIC_DIR, filename);
  const outputName = filename.replace(/\.(png|jpg|jpeg)$/i, '.webp');
  const outputPath = join(PUBLIC_DIR, outputName);

  const beforeSize = await getFileSize(inputPath);

  await sharp(inputPath)
    .resize({ width: config.width, withoutEnlargement: true })
    .webp({ quality: config.quality, effort: 6 })
    .toFile(outputPath);

  const afterSize = await getFileSize(outputPath);
  console.log(`✅ ${filename} → ${outputName}`);
  console.log(`   ${beforeSize} → ${afterSize}`);
}

async function main() {
  console.log('🖼️  Optimizing images for mobile performance...\n');

  for (const [filename, config] of Object.entries(IMAGE_CONFIG)) {
    const inputPath = join(PUBLIC_DIR, filename);
    try {
      await stat(inputPath);
      await optimizeImage(filename, config);
    } catch {
      console.log(`⚠️  Skipping ${filename} (not found)`);
    }
  }

  console.log('\n✨ Done! Update your components to use .webp versions.');
  console.log('   (original files kept as backup — delete manually if needed)');
}

main().catch(console.error);
