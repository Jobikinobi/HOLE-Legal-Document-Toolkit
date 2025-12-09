#!/bin/bash
# Mount or unmount the R2 bucket as a local filesystem

MOUNT_POINT="$HOME/legal-exhibits-r2"
REMOTE_NAME="legal-exhibits-r2"
BUCKET_NAME="legal-exhibits"

case "$1" in
  mount)
    if mount | grep -q "$MOUNT_POINT"; then
      echo "✓ R2 bucket already mounted at $MOUNT_POINT"
      exit 0
    fi

    echo "📁 Mounting R2 bucket to $MOUNT_POINT..."

    # Ensure mount point exists
    mkdir -p "$MOUNT_POINT"

    # Mount with write caching for better performance
    rclone mount "$REMOTE_NAME:$BUCKET_NAME" "$MOUNT_POINT" \
      --daemon \
      --vfs-cache-mode writes \
      --vfs-cache-max-age 30m \
      --vfs-write-back 5s \
      --buffer-size 32M

    sleep 2

    if mount | grep -q "$MOUNT_POINT"; then
      echo "✅ Successfully mounted R2 bucket at $MOUNT_POINT"
      echo ""
      echo "You can now access R2 storage as a local directory:"
      echo "  ls $MOUNT_POINT"
      echo "  cp file.pdf $MOUNT_POINT/"
    else
      echo "❌ Failed to mount R2 bucket"
      echo "Check if rclone is configured: rclone listremotes"
      exit 1
    fi
    ;;

  unmount|umount)
    if ! mount | grep -q "$MOUNT_POINT"; then
      echo "✓ R2 bucket not currently mounted"
      exit 0
    fi

    echo "📁 Unmounting R2 bucket from $MOUNT_POINT..."
    umount "$MOUNT_POINT" || fusermount -u "$MOUNT_POINT"

    sleep 1

    if mount | grep -q "$MOUNT_POINT"; then
      echo "❌ Failed to unmount. Trying force unmount..."
      umount -f "$MOUNT_POINT" 2>/dev/null || diskutil unmount force "$MOUNT_POINT" 2>/dev/null
    else
      echo "✅ Successfully unmounted R2 bucket"
    fi
    ;;

  status)
    if mount | grep -q "$MOUNT_POINT"; then
      echo "✅ R2 bucket is mounted at $MOUNT_POINT"
      echo ""
      df -h "$MOUNT_POINT"
      echo ""
      echo "Files:"
      ls -lh "$MOUNT_POINT" | head -10
    else
      echo "❌ R2 bucket is not mounted"
      echo ""
      echo "To mount, run:"
      echo "  ./scripts/mount-r2.sh mount"
    fi
    ;;

  *)
    echo "Usage: $0 {mount|unmount|status}"
    echo ""
    echo "Commands:"
    echo "  mount    - Mount R2 bucket to $MOUNT_POINT"
    echo "  unmount  - Unmount R2 bucket"
    echo "  status   - Check mount status"
    echo ""
    echo "Examples:"
    echo "  $0 mount"
    echo "  $0 status"
    echo "  $0 unmount"
    exit 1
    ;;
esac
