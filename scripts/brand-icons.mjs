import sharp from 'sharp';
import { fileURLToPath } from 'node:url';

const assets = new URL('../client/public/assets/', import.meta.url);
const source = fileURLToPath(new URL('logo.svg', assets));
const icons = [
  ['favicon-16x16.png', 16],
  ['favicon-32x32.png', 32],
  ['apple-touch-icon-180x180.png', 180],
  ['icon-192x192.png', 192],
  ['maskable-icon.png', 512],
];

for (const [name, size] of icons) {
  await sharp(source)
    .resize(size, size)
    .png()
    .toFile(fileURLToPath(new URL(name, assets)));
  console.log(`${name}: ${size} × ${size}`);
}
