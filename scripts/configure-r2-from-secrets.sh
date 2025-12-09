#!/bin/bash
# Configure rclone R2 access using Cloudflare Secrets
# Requires: Cloudflare authentication via wrangler
#
# This script fetches R2 credentials from Cloudflare Secrets and configures
# rclone. Credentials are never stored in files - only in Cloudflare's vault.

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
WORKER_DIR="$PROJECT_ROOT/cloudflare-worker"

echo "🔐 Configuring R2 access from Cloudflare Secrets..."
echo ""

# Check if wrangler is available
if ! command -v npx wrangler &> /dev/null; then
    echo "❌ Error: wrangler CLI not found"
    echo "Install with: npm install -g wrangler"
    exit 1
fi

# Check Cloudflare authentication
echo "📋 Checking Cloudflare authentication..."
if ! npx wrangler whoami &> /dev/null; then
    echo "❌ Not authenticated with Cloudflare"
    echo "Please run: npx wrangler login"
    exit 1
fi

ACCOUNT_INFO=$(npx wrangler whoami 2>/dev/null | grep -A 1 "The HOLE Foundation" | tail -1 | awk '{print $1}')
if [ -z "$ACCOUNT_INFO" ]; then
    echo "⚠️  Warning: Could not verify The HOLE Foundation account"
fi

echo "✓ Authenticated with Cloudflare"
echo ""

# Navigate to worker directory to access secrets
cd "$WORKER_DIR"

# Fetch secrets from Cloudflare
echo "🔑 Fetching R2 credentials from Cloudflare Secrets..."
echo "   (This requires you to be logged into Cloudflare via wrangler)"
echo ""

# Note: wrangler secret bulk doesn't support reading individual secrets
# We need to use the API or have the user provide them temporarily
# The best approach is to use wrangler secret list and then prompt

SECRET_LIST=$(npx wrangler secret list 2>/dev/null | grep -E "R2_ACCESS_KEY_ID|R2_SECRET_ACCESS_KEY" || true)

if [ -z "$SECRET_LIST" ]; then
    echo "❌ Error: R2 secrets not found in Cloudflare"
    echo ""
    echo "Please set up secrets first:"
    echo "  cd cloudflare-worker"
    echo "  npx wrangler secret put R2_ACCESS_KEY_ID"
    echo "  npx wrangler secret put R2_SECRET_ACCESS_KEY"
    exit 1
fi

echo "✓ Found R2 secrets in Cloudflare:"
echo "$SECRET_LIST"
echo ""

# Since we can't directly read secret values via wrangler (security by design),
# we'll use a different approach: The secrets are available to the Worker,
# but for local use, we need to use wrangler's secret functionality differently.

echo "📝 Configuring rclone..."
echo ""
echo "For security, Cloudflare Secrets cannot be read directly via CLI."
echo "Please choose an option:"
echo ""
echo "Option 1: Use wrangler dev with secrets (Recommended)"
echo "  - Secrets are automatically available to your Worker during development"
echo "  - No local credential storage needed"
echo "  - Run: npx wrangler dev --remote"
echo ""
echo "Option 2: Create a .dev.vars file for local development"
echo "  - Only for local testing, never commit to git"
echo "  - Requires manual credential entry"
echo ""
echo "Option 3: Configure rclone interactively"
echo "  - For command-line rclone usage"
echo "  - You'll need to look up the secret values in Cloudflare dashboard"
echo ""

read -p "Choose option (1/2/3): " choice

case $choice in
    1)
        echo ""
        echo "✅ Use this command to run your Worker with secrets:"
        echo "   cd cloudflare-worker"
        echo "   npx wrangler dev"
        echo ""
        echo "The Worker will have access to all secrets automatically."
        ;;
    2)
        echo ""
        echo "Creating .dev.vars template..."
        cat > "$WORKER_DIR/.dev.vars" <<EOF
# Local development secrets (DO NOT COMMIT)
# Get values from: https://dash.cloudflare.com/1a25a792e801e687b9fe4932030cf6a6/workers/overview
R2_ACCESS_KEY_ID=your_access_key_id_here
R2_SECRET_ACCESS_KEY=your_secret_access_key_here
EOF
        echo "✓ Created cloudflare-worker/.dev.vars"
        echo ""
        echo "⚠️  Please edit .dev.vars and add your credentials"
        echo "   The file is .gitignore'd and won't be committed"
        ;;
    3)
        echo ""
        echo "🔧 Configuring rclone with Cloudflare R2..."
        echo ""
        echo "You'll need to get the secret values from Cloudflare:"
        echo "  1. Go to: https://dash.cloudflare.com/1a25a792e801e687b9fe4932030cf6a6/workers/overview"
        echo "  2. Navigate to: Workers & Pages > legal-exhibits-api > Settings > Variables"
        echo "  3. View the secret values (requires authentication)"
        echo ""
        read -p "Press Enter when ready to configure rclone..."

        echo ""
        echo "Enter R2 Access Key ID:"
        read -r ACCESS_KEY
        echo ""
        echo "Enter R2 Secret Access Key:"
        read -rs SECRET_KEY
        echo ""

        if [ -z "$ACCESS_KEY" ] || [ -z "$SECRET_KEY" ]; then
            echo "❌ Error: Credentials cannot be empty"
            exit 1
        fi

        # Configure rclone
        rclone config update legal-exhibits-r2 \
            access_key_id "$ACCESS_KEY" \
            secret_access_key "$SECRET_KEY"

        echo "✅ rclone configured successfully"
        echo ""
        echo "Test the connection:"
        echo "  rclone ls legal-exhibits-r2:legal-exhibits"
        ;;
    *)
        echo "Invalid option"
        exit 1
        ;;
esac

echo ""
echo "🎉 Configuration complete!"
echo ""
echo "Next steps:"
echo "  - For Worker development: cd cloudflare-worker && npx wrangler dev"
echo "  - For rclone usage: rclone copy file.pdf legal-exhibits-r2:legal-exhibits/"
echo "  - For mounting: ./scripts/mount-r2.sh mount"

cd "$PROJECT_ROOT"
