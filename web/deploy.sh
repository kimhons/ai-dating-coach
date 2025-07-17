#!/bin/bash

# AI Dating Coach Web Dashboard - Deployment Script
# This script handles the complete deployment process to Vercel

set -e

echo "🚀 Starting AI Dating Coach Web Dashboard deployment..."

# Check if required environment variables are set
if [ -z "$VITE_SUPABASE_URL" ] || [ -z "$VITE_SUPABASE_ANON_KEY" ]; then
    echo "❌ Error: Required environment variables not set"
    echo "Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY"
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm ci

# Run linting
echo "🔍 Running linting..."
npm run lint

# Run type checking
echo "🔧 Running TypeScript type checking..."
npx tsc --noEmit

# Build the application
echo "🏗️ Building application for production..."
npm run build

# Check if build was successful
if [ ! -d "dist" ]; then
    echo "❌ Build failed - dist directory not found"
    exit 1
fi

echo "✅ Build completed successfully!"

# Optional: Deploy to Vercel (if Vercel CLI is available)
if command -v vercel &> /dev/null; then
    echo "🌐 Deploying to Vercel..."
    vercel --prod
    echo "✅ Deployment completed!"
else
    echo "ℹ️ Vercel CLI not found. Please deploy manually or install Vercel CLI."
    echo "📁 Built files are ready in the 'dist' directory"
fi

echo "🎉 Deployment process completed!"

