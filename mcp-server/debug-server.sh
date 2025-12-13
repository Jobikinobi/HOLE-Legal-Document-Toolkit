#!/bin/bash

# Debug script for Legal Exhibits MCP Server
# Runs the server in debug mode with full logging

set -e

echo "🔍 Legal Exhibits MCP Server - Debug Mode"
echo "=========================================="
echo ""

# Check if API key is set
if [ -z "$MISTRAL_API_KEY" ]; then
  echo "⚠️  MISTRAL_API_KEY not set"
  echo "   Will fall back to Tesseract OCR"
  echo ""
else
  echo "✅ MISTRAL_API_KEY: ${MISTRAL_API_KEY:0:10}...${MISTRAL_API_KEY: -4}"
  echo ""
fi

# Check if build is up to date
if [ ! -f "dist/index.js" ]; then
  echo "📦 Building server..."
  npm run build
  echo ""
fi

# Kill any existing instances
pkill -f "node dist/index.js" 2>/dev/null || true
echo "🛑 Stopped any running instances"
echo ""

# Create log directory
mkdir -p logs

# Start server with debug logging
echo "🚀 Starting server in debug mode..."
echo "📝 Logs will be written to: logs/debug-$(date +%Y%m%d-%H%M%S).log"
echo "🛑 Press Ctrl+C to stop"
echo ""
echo "=========================================="
echo ""

# Run with full debugging
DEBUG=* \
  MISTRAL_API_KEY="${MISTRAL_API_KEY}" \
  node dist/index.js 2>&1 | tee "logs/debug-$(date +%Y%m%d-%H%M%S).log"
