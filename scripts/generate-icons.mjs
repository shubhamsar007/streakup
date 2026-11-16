/**
 * Generates PWA icons for StreakUp.
 * Requires: npm install -D sharp
 * Run: node scripts/generate-icons.mjs
 *
 * This script creates the icon PNG files needed by the web manifest.
 * If sharp is not available, the script writes SVG fallbacks instead.
 */
import { existsSync, mkdirSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, "..", "public", "icons");
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

mkdirSync(outDir, { recursive: true });

// SVG template for the StreakUp icon (zap bolt on dark background)
function iconSvg(size) {
  const pad = Math.round(size * 0.15);
  const inner = size - pad * 2;
  const r = Math.round(size * 0.12);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${r}" fill="#0B0F14"/>
  <rect x="${pad}" y="${pad}" width="${inner}" height="${inner}" rx="${Math.round(inner * 0.18)}" fill="#A3E635"/>
  <svg x="${pad}" y="${pad}" width="${inner}" height="${inner}" viewBox="0 0 24 24" fill="none" stroke="#0B0F14" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
  </svg>
</svg>`;
}

let sharpAvailable = false;
try {
  await import("sharp");
  sharpAvailable = true;
} catch {
  // sharp not installed — write SVGs as fallback
}

if (sharpAvailable) {
  const { default: sharp } = await import("sharp");
  for (const size of sizes) {
    const svg = Buffer.from(iconSvg(size));
    await sharp(svg)
      .resize(size, size)
      .png()
      .toFile(join(outDir, `icon-${size}x${size}.png`));
    console.log(`✓ icon-${size}x${size}.png`);
  }
  console.log("All icons generated successfully.");
} else {
  // Write SVG icons — browsers and most PWA validators accept SVG icons
  for (const size of sizes) {
    writeFileSync(join(outDir, `icon-${size}x${size}.svg`), iconSvg(size));
    console.log(`✓ icon-${size}x${size}.svg (SVG fallback)`);
  }
  console.log(
    "\nNote: SVG fallbacks written. For proper PNG icons, run:\n  npm install -D sharp && node scripts/generate-icons.mjs"
  );
}
