const Jimp = require('jimp');
const path = require('path');

async function removeBackground() {
    const imagePath = path.join(__dirname, 'public/logo.jpg');
    const outputPath = path.join(__dirname, 'public/logo_transparent.png');

    console.log('Reading image...');
    const image = await Jimp.read(imagePath);

    console.log('Processing pixels...');
    image.scan(0, 0, image.bitmap.width, image.bitmap.height, function(x, y, idx) {
        const r = this.bitmap.data[idx + 0];
        const g = this.bitmap.data[idx + 1];
        const b = this.bitmap.data[idx + 2];

        // If the pixel is close to white, make it transparent
        if (r > 240 && g > 240 && b > 240) {
            this.bitmap.data[idx + 3] = 0;
        }
    });

    console.log('Saving image...');
    await image.writeAsync(outputPath);
    console.log('Done! Saved to ' + outputPath);
}

removeBackground().catch(console.error);
