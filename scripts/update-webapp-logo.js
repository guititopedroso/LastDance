import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const inputPath = path.resolve(__dirname, '../dist/logo.jpg');
const publicDir = path.resolve(__dirname, '../public');

async function main() {
  try {
    if (!fs.existsSync(inputPath)) {
      console.error(`Input file not found at ${inputPath}`);
      process.exit(1);
    }

    console.log(`Copying logo.jpg to public directory...`);
    fs.copyFileSync(inputPath, path.join(publicDir, 'logo.jpg'));

    console.log('Processing background removal (white -> transparent)...');
    const image = sharp(inputPath);
    const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });
    
    const channels = info.channels;
    const outBuffer = Buffer.alloc(info.width * info.height * 4);

    for (let i = 0, j = 0; i < data.length; i += channels, j += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      outBuffer[j] = r;
      outBuffer[j + 1] = g;
      outBuffer[j + 2] = b;
      
      // If the pixel is close to white, make it transparent
      if (r > 240 && g > 240 && b > 240) {
        outBuffer[j + 3] = 0; // transparent
      } else {
        outBuffer[j + 3] = 255; // opaque
      }
    }

    const transparentImage = sharp(outBuffer, {
      raw: {
        width: info.width,
        height: info.height,
        channels: 4
      }
    });

    console.log('Writing transparent logos...');
    
    // Save as logo.png
    await transparentImage.clone().png().toFile(path.join(publicDir, 'logo.png'));
    // Save as logo.webp
    await transparentImage.clone().webp().toFile(path.join(publicDir, 'logo.webp'));
    // Save as logo_transparent.png
    await transparentImage.clone().png().toFile(path.join(publicDir, 'logo_transparent.png'));
    // Save as logo_transparent.webp
    await transparentImage.clone().webp().toFile(path.join(publicDir, 'logo_transparent.webp'));

    console.log('Generating PWA icons...');
    // Run the existing generate-pwa-icons.js script
    const genScriptPath = path.join(__dirname, 'generate-pwa-icons.js');
    execSync(`node "${genScriptPath}"`, { stdio: 'inherit' });

    console.log('Logo update completed successfully!');
  } catch (error) {
    console.error('Error updating logo:', error);
  }
}

main();
