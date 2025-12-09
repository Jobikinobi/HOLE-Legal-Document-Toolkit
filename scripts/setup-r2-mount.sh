#!/bin/bash
# Setup R2 bucket mounting via rclone FUSE
# This allows the local MCP server to seamlessly access R2 storage as a filesystem

set -e

echo "🔧 Setting up R2 FUSE mount for Legal Exhibits..."

# Check if rclone is installed
if ! command -v rclone &> /dev/null; then
    echo "📦 Installing rclone via Homebrew..."
    brew install rclone
else
    echo "✓ rclone is already installed"
fi

# Check if macFUSE is installed
if ! [ -d "/Library/Filesystems/macfuse.fs" ]; then
    echo "⚠️  macFUSE is not installed."
    echo "Please install macFUSE from: https://osxfuse.github.io/"
    echo "Or run: brew install --cask macfuse"
    echo "Note: You may need to restart your Mac after installing macFUSE"
    exit 1
else
    echo "✓ macFUSE is installed"
fi

# Create mount point directory
MOUNT_POINT="$HOME/legal-exhibits-r2"
if [ ! -d "$MOUNT_POINT" ]; then
    mkdir -p "$MOUNT_POINT"
    echo "✓ Created mount point: $MOUNT_POINT"
else
    echo "✓ Mount point exists: $MOUNT_POINT"
fi

# Check if rclone config exists for R2
if ! rclone listremotes | grep -q "^legal-exhibits-r2:"; then
    echo ""
    echo "📝 Setting up rclone configuration for Cloudflare R2..."
    echo ""
    echo "You'll need:"
    echo "  1. Your Cloudflare Account ID: 1a25a792e801e687b9fe4932030cf6a6"
    echo "  2. R2 API Token (create at: https://dash.cloudflare.com/?to=/:account/r2/api-tokens)"
    echo "     - Permissions: Object Read & Write"
    echo "     - Bucket: legal-exhibits"
    echo ""

    rclone config create legal-exhibits-r2 s3 \
        provider Cloudflare \
        env_auth false \
        endpoint "https://1a25a792e801e687b9fe4932030cf6a6.r2.cloudflarestorage.com"

    echo "✓ rclone configuration created"
else
    echo "✓ rclone remote 'legal-exhibits-r2' already configured"
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "To mount the R2 bucket, run:"
echo "  rclone mount legal-exhibits-r2:legal-exhibits $MOUNT_POINT --daemon --vfs-cache-mode writes"
echo ""
echo "To unmount, run:"
echo "  umount $MOUNT_POINT"
echo ""
echo "Mount point: $MOUNT_POINT"
