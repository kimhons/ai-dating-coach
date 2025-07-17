#!/bin/bash

echo "🌐 AI Dating Coach - Web Dashboard Setup"
echo "========================================"

# Navigate to web directory
cd "$(dirname "$0")/../web"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Install dependencies
echo "📦 Installing web dependencies..."
npm install

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "⚠️  Creating .env.local from template..."
    cp ../.env.example .env.local
    echo "📝 Please edit .env.local with your actual API keys"
fi

# Build the project to verify everything works
echo "🔨 Building project to verify setup..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
else
    echo "❌ Build failed. Please check the errors above."
    exit 1
fi

echo ""
echo "✅ Web setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit .env.local with your API keys"
echo "2. Run: npm run dev"
echo "3. Open: http://localhost:5173"
echo ""
echo "🚀 For deployment: npm run build && npm run preview"