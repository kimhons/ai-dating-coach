#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// App icon SVG template with AI Dating Coach branding
const APP_ICON_SVG = `
<svg width="1024" height="1024" viewBox="0 0 1024 1024" fill="none" xmlns="http://www.w3.org/2000/svg">
  <!-- Background gradient -->
  <defs>
    <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#FCE4EC;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#F8BBD9;stop-opacity:1" />
    </linearGradient>
    <linearGradient id="heartGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#E91E63;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#AD1457;stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <!-- Background -->
  <rect width="1024" height="1024" rx="180" fill="url(#bgGradient)"/>
  
  <!-- Heart shape with AI circuit pattern -->
  <g transform="translate(512, 450)">
    <!-- Main heart -->
    <path d="M0 -120 C-66 -120 -120 -66 -120 0 C-120 40 -80 80 0 160 C80 80 120 40 120 0 C120 -66 66 -120 0 -120 Z" 
          fill="url(#heartGradient)" />
    
    <!-- AI circuit lines -->
    <g stroke="white" stroke-width="8" fill="none" opacity="0.3">
      <path d="M-40 -60 L-40 -40 L-20 -40" />
      <path d="M40 -60 L40 -40 L20 -40" />
      <path d="M-60 0 L-40 0 L-40 20" />
      <path d="M60 0 L40 0 L40 20" />
      <circle cx="-40" cy="-60" r="8" fill="white" />
      <circle cx="40" cy="-60" r="8" fill="white" />
      <circle cx="-60" cy="0" r="8" fill="white" />
      <circle cx="60" cy="0" r="8" fill="white" />
    </g>
    
    <!-- AI sparkles -->
    <g fill="white" opacity="0.8">
      <circle cx="-30" cy="-30" r="12" />
      <circle cx="30" cy="-30" r="12" />
      <circle cx="0" cy="20" r="12" />
    </g>
  </g>
  
  <!-- Text -->
  <text x="512" y="720" font-family="Inter, Arial, sans-serif" font-size="120" font-weight="700" 
        text-anchor="middle" fill="#AD1457">AI Coach</text>
</svg>
`;

// Icon sizes configuration
const ICON_SIZES = {
  ios: [
    { size: 20, scale: 1, name: 'icon-20.png' },
    { size: 20, scale: 2, name: 'icon-20@2x.png' },
    { size: 20, scale: 3, name: 'icon-20@3x.png' },
    { size: 29, scale: 1, name: 'icon-29.png' },
    { size: 29, scale: 2, name: 'icon-29@2x.png' },
    { size: 29, scale: 3, name: 'icon-29@3x.png' },
    { size: 40, scale: 1, name: 'icon-40.png' },
    { size: 40, scale: 2, name: 'icon-40@2x.png' },
    { size: 40, scale: 3, name: 'icon-40@3x.png' },
    { size: 60, scale: 2, name: 'icon-60@2x.png' },
    { size: 60, scale: 3, name: 'icon-60@3x.png' },
    { size: 76, scale: 1, name: 'icon-76.png' },
    { size: 76, scale: 2, name: 'icon-76@2x.png' },
    { size: 83.5, scale: 2, name: 'icon-83.5@2x.png' },
    { size: 1024, scale: 1, name: 'icon-1024.png' }
  ],
  android: [
    { size: 48, folder: 'mipmap-mdpi', name: 'ic_launcher.png' },
    { size: 72, folder: 'mipmap-hdpi', name: 'ic_launcher.png' },
    { size: 96, folder: 'mipmap-xhdpi', name: 'ic_launcher.png' },
    { size: 144, folder: 'mipmap-xxhdpi', name: 'ic_launcher.png' },
    { size: 192, folder: 'mipmap-xxxhdpi', name: 'ic_launcher.png' },
    { size: 512, folder: '../', name: 'playstore-icon.png' }
  ]
};

// Create base icon SVG file
const svgPath = path.join(__dirname, 'app-icon.svg');
fs.writeFileSync(svgPath, APP_ICON_SVG);

console.log('🎨 AI Dating Coach - App Icon Generator');
console.log('=====================================');
console.log('✅ Created base SVG icon');

// Generate iOS icons
console.log('\n📱 Generating iOS icons...');
const iosIconPath = path.join(__dirname, '../ios/AIDatingCoachMobile/Images.xcassets/AppIcon.appiconset');

ICON_SIZES.ios.forEach(({ size, scale, name }) => {
  const actualSize = size * scale;
  console.log(`  - ${name} (${actualSize}x${actualSize}px)`);
  
  // Create placeholder file (in production, use sharp or similar library)
  const placeholderContent = `iOS Icon: ${name} - ${actualSize}x${actualSize}px`;
  fs.writeFileSync(path.join(iosIconPath, name), placeholderContent);
});

// Generate Android icons
console.log('\n🤖 Generating Android icons...');
const androidResPath = path.join(__dirname, '../android/app/src/main/res');

ICON_SIZES.android.forEach(({ size, folder, name }) => {
  const iconPath = path.join(androidResPath, folder, name);
  console.log(`  - ${folder}/${name} (${size}x${size}px)`);
  
  // Create directory if it doesn't exist
  const dir = path.dirname(iconPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  // Create placeholder file (in production, use sharp or similar library)
  const placeholderContent = `Android Icon: ${folder}/${name} - ${size}x${size}px`;
  fs.writeFileSync(iconPath, placeholderContent);
});

console.log('\n✅ Icon generation complete!');
console.log('\n📝 Note: This script creates placeholder icons.');
console.log('For production, install sharp or jimp to generate actual PNG files from the SVG.');
console.log('\nTo install sharp: npm install sharp');
console.log('Then update this script to use sharp for SVG to PNG conversion.');