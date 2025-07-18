#!/bin/bash

echo "🚀 AI Dating Coach - Complete Project Setup"
echo "============================================"

# Get the project root directory
PROJECT_ROOT="$(dirname "$0")/.."
cd "$PROJECT_ROOT"

echo "📍 Setting up project in: $(pwd)"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    echo "   Download from: https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js version: $(node --version)"

# Create .env from template if it doesn't exist
if [ ! -f ".env" ]; then
    echo "📄 Creating .env from template..."
    cp .env.example .env
    echo "⚠️  Please edit .env with your actual API keys!"
fi

# Setup Web Application
echo ""
echo "🌐 Setting up Web Application..."
cd web
npm install
if [ ! -f ".env.local" ]; then
    cp ../.env.example .env.local
fi
cd ..

# Setup Mobile Application
echo ""
echo "📱 Setting up Mobile Application..."
cd mobile
npm install

# iOS setup (only on macOS)
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "🍎 Setting up iOS..."
    
    if ! command -v pod &> /dev/null; then
        echo "📦 Installing CocoaPods..."
        sudo gem install cocoapods
    fi
    
    echo "📱 Installing iOS pods..."
    cd ios && pod install && cd ..
    echo "✅ iOS setup complete!"
else
    echo "ℹ️  iOS setup skipped (not on macOS)"
fi

cd ..

# Check Android setup
echo ""
echo "🤖 Checking Android setup..."
if [[ -z "$ANDROID_HOME" ]]; then
    echo "⚠️  ANDROID_HOME not set. For Android development:"
    echo "   1. Install Android Studio"
    echo "   2. Set ANDROID_HOME environment variable"
    echo "   3. Add Android SDK tools to PATH"
else
    echo "✅ Android SDK found at $ANDROID_HOME"
fi

# Install global tools if needed
echo ""
echo "🔧 Checking global tools..."

if ! command -v react-native &> /dev/null; then
    echo "📱 Installing React Native CLI..."
    npm install -g @react-native-community/cli
fi

# Summary
echo ""
echo "🎉 Setup Complete!"
echo "=================="
echo ""
echo "✅ Web application ready"
echo "✅ Mobile application dependencies installed"
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "✅ iOS setup complete"
else
    echo "⚠️  iOS setup requires macOS"
fi

if [[ -n "$ANDROID_HOME" ]]; then
    echo "✅ Android environment ready"
else
    echo "⚠️  Android requires SDK setup"
fi

echo ""
echo "🚀 Quick Start Commands:"
echo "========================"
echo ""
echo "Web Dashboard:"
echo "  cd web && npm run dev"
echo "  Open: http://localhost:5173"
echo ""
echo "Mobile App:"
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "  cd mobile && npx react-native run-ios"
fi
if [[ -n "$ANDROID_HOME" ]]; then
    echo "  cd mobile && npx react-native run-android"
fi
echo ""
echo "📋 Important:"
echo "  1. Edit .env with your API keys"
echo "  2. Check mobile/APP_STORE_DEPLOYMENT_CHECKLIST.md"
echo "  3. Review documentation in docs/ folder"
echo ""
echo "🔗 Resources:"
echo "  - Documentation: ./docs/"
echo "  - Contributing: ./CONTRIBUTING.md"
echo "  - Changelog: ./CHANGELOG.md"