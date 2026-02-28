import sharp from 'sharp';
import { readFileSync, writeFileSync } from 'fs';

const svg = readFileSync('public/pwa-192x192.svg');

// Generate 192x192 PNG
await sharp(svg).resize(192, 192).png().toFile('public/pwa-192x192.png');
console.log('Created pwa-192x192.png');

// Generate 512x512 PNG
await sharp(svg).resize(512, 512).png().toFile('public/pwa-512x512.png');
console.log('Created pwa-512x512.png');

// Also create a favicon.png for browsers that don't support SVG favicons
await sharp(svg).resize(32, 32).png().toFile('public/favicon.png');
console.log('Created favicon.png');

console.log('Done!');
