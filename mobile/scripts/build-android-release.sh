#!/bin/bash

# AI Dating Coach - Android Release Build Script
# This script builds the Android app for Google Play Store submission

set -e  # Exit on any error

echo "🚀 Starting Android release build for AI Dating Coach..."

# Check if we're in the mobile directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the mobile directory"
    exit 1
fi

# Check if Android project exists
if [ ! -d "android" ]; then
    echo "❌ Error: Android project directory not found"
    exit 1
fi

# Load production environment
if [ -f ".env.production" ]; then
    echo "✅ Loading production environment variables..."
    export $(cat .env.production | grep -v '^#' | xargs)
else
    echo "⚠️ Warning: .env.production not found, using default values"
fi

# Clean and install dependencies
echo "📦 Installing dependencies..."
npm ci

# Clean previous builds
echo "🧹 Cleaning previous builds..."
cd android
./gradlew clean
cd ..

# Generate React Native bundle
echo "📱 Generating React Native bundle..."
npx react-native bundle --platform android --dev false --entry-file index.js --bundle-output android/app/src/main/assets/index.android.bundle --assets-dest android/app/src/main/res/

# Build the release APK
echo "🔨 Building Android release APK..."
cd android
./gradlew assembleRelease

# Build the release AAB (Android App Bundle) - preferred format for Play Store
echo "🔨 Building Android App Bundle (AAB)..."
./gradlew bundleRelease

cd ..

echo "✅ Android release build completed successfully!"
echo ""
echo "📁 Output files:"
echo "   APK: android/app/build/outputs/apk/release/app-release.apk"
echo "   AAB: android/app/build/outputs/bundle/release/app-release.aab"
echo ""
echo "Next steps:"
echo "1. Test the APK on physical devices"
echo "2. Upload the AAB to Google Play Console"
echo "3. Complete the Play Store listing"
echo "4. Submit for Google Play review"
echo ""
echo "📊 Build information:"
ls -la android/app/build/outputs/apk/release/ 2>/dev/null || echo "APK files not found"
ls -la android/app/build/outputs/bundle/release/ 2>/dev/null || echo "AAB files not found"
echo ""
echo "🎉 Ready for Google Play Store submission!"
