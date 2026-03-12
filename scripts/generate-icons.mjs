#!/usr/bin/env node
/**
 * Generate PWA icon PNGs from SVG sources using sharp.
 * Run: node scripts/generate-icons.mjs
 */
import sharp from 'sharp';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, '..', 'public');

const iconSvg = readFileSync(join(publicDir, 'icon.svg'));
const maskableSvg = readFileSync(join(publicDir, 'icon-maskable.svg'));

const sizes = [
  // Standard PWA icons
  { name: 'icon-192.png', size: 192, svg: iconSvg },
  { name: 'icon-512.png', size: 512, svg: iconSvg },
  // Maskable icons (opaque bg, safe zone content)
  { name: 'icon-maskable-192.png', size: 192, svg: maskableSvg },
  { name: 'icon-maskable-512.png', size: 512, svg: maskableSvg },
  // Apple touch icon
  { name: 'apple-touch-icon.png', size: 180, svg: maskableSvg },
  // Favicon
  { name: 'favicon-32.png', size: 32, svg: iconSvg },
  { name: 'favicon-16.png', size: 16, svg: iconSvg },
];

for (const { name, size, svg } of sizes) {
  await sharp(svg, { density: 300 })
    .resize(size, size)
    .png()
    .toFile(join(publicDir, name));
  console.log(`Generated ${name} (${size}x${size})`);
}

// Also generate favicon.ico from 32px PNG
console.log('\nAll icons generated in public/');
