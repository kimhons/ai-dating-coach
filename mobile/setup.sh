#!/bin/bash

echo "🚀 AI Dating Coach - Mobile App Setup Script"
echo "============================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Check if React Native CLI is installed globally
if ! command -v react-native &> /dev/null; then
    echo "📱 Installing React Native CLI..."
    npm install -g @react-native-community/cli
fi

# iOS Setup
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "🍎 Setting up iOS..."
    
    # Check if CocoaPods is installed
    if ! command -v pod &> /dev/null; then
        echo "Installing CocoaPods..."
        sudo gem install cocoapods
    fi
    
    # Install iOS dependencies
    echo "Installing iOS pods..."
    cd ios && pod install && cd ..
    
    echo "✅ iOS setup complete!"
    echo "Run: npx react-native run-ios"
else
    echo "ℹ️  iOS setup skipped (not on macOS)"
fi

# Android Setup
echo "🤖 Setting up Android..."

# Check if Android SDK is available
if [[ -z "$ANDROID_HOME" ]]; then
    echo "⚠️  ANDROID_HOME not set. Please install Android Studio and set ANDROID_HOME."
else
    echo "✅ Android SDK found at $ANDROID_HOME"
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. For iOS: npx react-native run-ios"
echo "2. For Android: npx react-native run-android"
echo ""
echo "📋 Check APP_STORE_DEPLOYMENT_CHECKLIST.md for full deployment guide"