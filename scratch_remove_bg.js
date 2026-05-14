import { Jimp } from 'jimp';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function removeBackground() {
    const imagePath = path.join(__dirname, 'public/logo.jpg');
    const outputPath = path.join(__dirname, 'public/logo_transparent.png');

    console.log('Reading image...');
    const image = await Jimp.read(imagePath);

    console.log('Processing pixels...');
    // In Jimp 1.6.1, we use image.bitmap.data directly or scan
    image.scan(0, 0, image.bitmap.width, image.bitmap.height, function(x, y, idx) {
        const r = this.bitmap.data[idx + 0];
        const g = this.bitmap.data[idx + 1];
        const b = this.bitmap.data[idx + 2];

        // If the pixel is close to white, make it transparent
        // Using a threshold to catch anti-aliasing
        if (r > 230 && g > 230 && b > 230) {
            this.bitmap.data[idx + 3] = 0;
        }
    });

    console.log('Saving image...');
    await image.write(outputPath);
    console.log('Done! Saved to ' + outputPath);
}

removeBackground().catch(console.error);
