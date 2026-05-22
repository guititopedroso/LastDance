import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const inputPath = path.resolve(__dirname, '../public/logo.png');
const outputDir = path.resolve(__dirname, '../public');

const sizes = [192, 512];
const background = { r: 5, g: 5, b: 5, alpha: 1 }; // #050505

async function generateIcons() {
  try {
    const metadata = await sharp(inputPath).metadata();
    console.log(`Input logo dimensions: ${metadata.width}x${metadata.height}`);

    for (const size of sizes) {
      // 1. Generate pwa-*.png (used for maskable icons)
      // For maskable icons, we want a safe padding around the logo so it doesn't get clipped.
      // We will place the logo inside a square container with padding and #050505 background.
      const pwaFilename = `pwa-${size}.png`;
      const pwaOutputPath = path.join(outputDir, pwaFilename);
      
      // Let's compute a size for the logo that fits comfortably within the safe area.
      // PWA maskable icons require the key artwork to be within a central safe circle (diameter of 80% of the icon).
      // So we scale the logo to be at most 70% of the target size.
      const maxLogoSize = Math.floor(size * 0.7);

      console.log(`Generating PWA icon: ${pwaFilename} (${size}x${size}) with max logo size ${maxLogoSize}`);

      // Resize the logo to fit within maxLogoSize x maxLogoSize, preserving aspect ratio,
      // then embed it on a solid background of size x size.
      await sharp(inputPath)
        .resize(maxLogoSize, maxLogoSize, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 } // transparent padding around the logo before composition
        })
        .toBuffer()
        .then(logoBuffer => {
          return sharp({
            create: {
              width: size,
              height: size,
              channels: 4,
              background: background // Solid #050505 background
            }
          })
          .composite([{ input: logoBuffer, gravity: 'center' }])
          .png()
          .toFile(pwaOutputPath);
        });

      // 2. Generate icon-*.png
      // Standard app/favicon icons. Can be transparent or contain less padding.
      const iconFilename = `icon-${size}.png`;
      const iconOutputPath = path.join(outputDir, iconFilename);

      console.log(`Generating standard icon: ${iconFilename} (${size}x${size})`);

      await sharp(inputPath)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 } // Transparent padding
        })
        .png()
        .toFile(iconOutputPath);
    }

    console.log('Successfully generated all PWA icons!');
  } catch (error) {
    console.error('Error generating icons:', error);
  }
}

generateIcons();
