#!/bin/bash

# AI Dating Coach - iOS Release Build Script
# This script builds the iOS app for App Store submission

set -e  # Exit on any error

echo "🚀 Starting iOS release build for AI Dating Coach..."

# Check if we're in the mobile directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the mobile directory"
    exit 1
fi

# Check if iOS project exists
if [ ! -d "ios" ]; then
    echo "❌ Error: iOS project directory not found"
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

# Generate native modules
echo "🔗 Linking native modules..."
cd ios && pod install && cd ..

# Clean previous builds
echo "🧹 Cleaning previous builds..."
cd ios
xcodebuild clean -workspace AIDatingCoachMobile.xcworkspace -scheme AIDatingCoachMobile
cd ..

# Build the app for release
echo "🔨 Building iOS app for release..."
cd ios

# Archive the app
xcodebuild -workspace AIDatingCoachMobile.xcworkspace \
           -scheme AIDatingCoachMobile \
           -configuration Release \
           -destination generic/platform=iOS \
           -archivePath AIDatingCoachMobile.xcarchive \
           archive

# Export the archive to IPA
xcodebuild -exportArchive \
           -archivePath AIDatingCoachMobile.xcarchive \
           -exportOptionsPlist exportOptions.plist \
           -exportPath ./build

cd ..

echo "✅ iOS release build completed successfully!"
echo "📁 IPA file location: ios/build/AIDatingCoachMobile.ipa"
echo ""
echo "Next steps:"
echo "1. Test the IPA on a physical device"
echo "2. Upload to App Store Connect via Xcode or Application Loader"
echo "3. Submit for App Store review"
echo ""
echo "🎉 Ready for App Store submission!"
