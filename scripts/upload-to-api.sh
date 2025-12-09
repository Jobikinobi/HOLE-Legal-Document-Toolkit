#!/bin/bash
# Upload file to Legal Exhibits API using service token
# Usage: ./scripts/upload-to-api.sh <file.pdf>

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Load environment variables
if [ -f "$PROJECT_ROOT/.env" ]; then
    source "$PROJECT_ROOT/.env"
else
    echo "❌ Error: .env file not found"
    echo "Run: ./scripts/configure-r2-from-secrets.sh"
    exit 1
fi

# Check if file provided
if [ -z "$1" ]; then
    echo "Usage: $0 <file.pdf>"
    echo ""
    echo "Example:"
    echo "  $0 output/exhibit-a.pdf"
    exit 1
fi

FILE="$1"

# Check if file exists
if [ ! -f "$FILE" ]; then
    echo "❌ Error: File not found: $FILE"
    exit 1
fi

# Check if it's a PDF
if [[ ! "$FILE" =~ \.pdf$ ]]; then
    echo "⚠️  Warning: File does not appear to be a PDF"
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo "📤 Uploading: $FILE"
echo "🔗 To: $LEGAL_EXHIBITS_API_URL"
echo ""

# Upload with service token
RESPONSE=$(curl -s \
    -H "CF-Access-Client-Id: $CF_ACCESS_CLIENT_ID" \
    -H "CF-Access-Client-Secret: $CF_ACCESS_CLIENT_SECRET" \
    -F "file=@$FILE" \
    "$LEGAL_EXHIBITS_API_URL/upload")

# Check if successful
if echo "$RESPONSE" | jq -e '.success' > /dev/null 2>&1; then
    echo "✅ Upload successful!"
    echo ""
    echo "Response:"
    echo "$RESPONSE" | jq .
    echo ""

    # Extract file URL
    FILE_URL=$(echo "$RESPONSE" | jq -r '.url')
    if [ "$FILE_URL" != "null" ]; then
        echo "🔗 Access at: $LEGAL_EXHIBITS_API_URL$FILE_URL"
    fi
else
    echo "❌ Upload failed"
    echo ""
    echo "Response:"
    echo "$RESPONSE" | jq . || echo "$RESPONSE"
    exit 1
fi
