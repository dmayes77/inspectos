#!/usr/bin/env node
/**
 * Generate InspectOS branded splash screen images for iOS/Android
 *
 * Run: node scripts/generate-splash.mjs
 */

import sharp from 'sharp';
import { mkdir, writeFile } from 'fs/promises';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');

// InspectOS brand colors
const BACKGROUND_COLOR = '#09090b'; // Dark background
const PRIMARY_COLOR = '#ea580c';     // Orange
const TEXT_COLOR = '#ffffff';        // White

// Sizes needed for iOS splash screens
const SPLASH_SIZES = [
  { width: 2732, height: 2732, name: 'splash-2732x2732' },     // 1x
  { width: 2732, height: 2732, name: 'splash-2732x2732-1' },   // 2x
  { width: 2732, height: 2732, name: 'splash-2732x2732-2' },   // 3x
];

/**
 * Create SVG for splash screen with InspectOS logo centered
 */
function createSplashSvg(width, height) {
  // Logo dimensions - scale based on screen size
  const logoSize = Math.min(width, height) * 0.15; // 15% of smallest dimension
  const iconSize = logoSize;
  const cornerRadius = iconSize * 0.2;
  const fontSize = iconSize * 0.45;

  // Center position
  const centerX = width / 2;
  const centerY = height / 2;

  // Text position below icon
  const textFontSize = logoSize * 0.35;
  const textY = centerY + iconSize / 2 + textFontSize + 20;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <!-- Dark background -->
  <rect width="${width}" height="${height}" fill="${BACKGROUND_COLOR}"/>

  <!-- Logo icon (orange rounded rectangle with IO) -->
  <rect
    x="${centerX - iconSize / 2}"
    y="${centerY - iconSize / 2 - textFontSize / 2}"
    width="${iconSize}"
    height="${iconSize}"
    rx="${cornerRadius}"
    fill="${PRIMARY_COLOR}"
  />

  <!-- IO text inside icon -->
  <text
    x="${centerX}"
    y="${centerY + fontSize * 0.35 - textFontSize / 2}"
    text-anchor="middle"
    font-family="-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Helvetica Neue', sans-serif"
    font-size="${fontSize}"
    font-weight="700"
    fill="${TEXT_COLOR}"
  >IO</text>

  <!-- InspectOS text below -->
  <text
    x="${centerX}"
    y="${textY}"
    text-anchor="middle"
    font-family="-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Helvetica Neue', sans-serif"
    font-size="${textFontSize}"
    font-weight="600"
    fill="${TEXT_COLOR}"
  >InspectOS</text>
</svg>`;
}

async function generateSplashScreens() {
  const outputDir = join(projectRoot, 'ios/App/App/Assets.xcassets/Splash.imageset');

  console.log('🎨 Generating InspectOS splash screens...\n');

  for (const size of SPLASH_SIZES) {
    const svg = createSplashSvg(size.width, size.height);
    const outputPath = join(outputDir, `${size.name}.png`);

    try {
      await sharp(Buffer.from(svg))
        .png()
        .toFile(outputPath);

      console.log(`✅ Generated: ${size.name}.png (${size.width}x${size.height})`);
    } catch (error) {
      console.error(`❌ Error generating ${size.name}:`, error.message);
    }
  }

  // Also generate a version for Android
  const androidDir = join(projectRoot, 'android/app/src/main/res');
  const androidSizes = [
    { width: 480, height: 800, folder: 'drawable-mdpi' },
    { width: 800, height: 1280, folder: 'drawable-hdpi' },
    { width: 1080, height: 1920, folder: 'drawable-xhdpi' },
    { width: 1440, height: 2560, folder: 'drawable-xxhdpi' },
    { width: 1920, height: 3200, folder: 'drawable-xxxhdpi' },
  ];

  console.log('\n📱 Generating Android splash screens...\n');

  for (const size of androidSizes) {
    const svg = createSplashSvg(size.width, size.height);
    const folderPath = join(androidDir, size.folder);
    const outputPath = join(folderPath, 'splash.png');

    try {
      await mkdir(folderPath, { recursive: true });
      await sharp(Buffer.from(svg))
        .png()
        .toFile(outputPath);

      console.log(`✅ Generated: ${size.folder}/splash.png (${size.width}x${size.height})`);
    } catch (error) {
      console.error(`❌ Error generating ${size.folder}:`, error.message);
    }
  }

  console.log('\n🎉 Splash screen generation complete!');
  console.log('\nNext steps:');
  console.log('1. Run `npx cap sync` to sync assets');
  console.log('2. Rebuild your iOS/Android app');
}

generateSplashScreens().catch(console.error);
