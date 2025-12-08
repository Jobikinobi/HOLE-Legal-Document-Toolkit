#!/bin/bash
# Install system dependencies for Legal Exhibits Toolkit
# Requires Homebrew (macOS) or apt (Linux)

set -e

echo "🔧 Legal Exhibits Toolkit - Dependency Installer"
echo "================================================"

# Detect OS
if [[ "$OSTYPE" == "darwin"* ]]; then
    OS="macos"
    PKG_MANAGER="brew"
elif [[ -f /etc/debian_version ]]; then
    OS="debian"
    PKG_MANAGER="apt"
elif [[ -f /etc/redhat-release ]]; then
    OS="redhat"
    PKG_MANAGER="yum"
else
    echo "❌ Unsupported operating system"
    exit 1
fi

echo "Detected OS: $OS"
echo "Package manager: $PKG_MANAGER"
echo ""

# Install function for macOS (Homebrew)
install_macos() {
    echo "📦 Installing dependencies via Homebrew..."

    # Check if Homebrew is installed
    if ! command -v brew &> /dev/null; then
        echo "❌ Homebrew not found. Install it from https://brew.sh"
        exit 1
    fi

    # Update Homebrew
    echo "Updating Homebrew..."
    brew update

    # Install required tools
    echo ""
    echo "Installing qpdf (PDF manipulation)..."
    brew install qpdf || true

    echo ""
    echo "Installing Ghostscript (PDF optimization)..."
    brew install gs || true

    echo ""
    echo "Installing poppler (PDF utilities)..."
    brew install poppler || true

    echo ""
    echo "Installing pdfcpu (optional, Go-based PDF processor)..."
    brew install pdfcpu || true

    echo ""
    echo "Installing OCR tools (ocrmypdf + tesseract)..."
    brew install ocrmypdf || true
    brew install tesseract || true

    echo ""
    echo "Installing additional language packs for OCR (optional)..."
    echo "  For all languages: brew install tesseract-lang"
    echo "  For specific: brew install tesseract-lang (then configure)"
}

# Install function for Debian/Ubuntu
install_debian() {
    echo "📦 Installing dependencies via apt..."

    sudo apt update

    echo ""
    echo "Installing qpdf..."
    sudo apt install -y qpdf

    echo ""
    echo "Installing Ghostscript..."
    sudo apt install -y ghostscript

    echo ""
    echo "Installing poppler-utils..."
    sudo apt install -y poppler-utils

    echo ""
    echo "Installing OCR tools..."
    sudo apt install -y ocrmypdf tesseract-ocr tesseract-ocr-eng
}

# Install function for RHEL/CentOS
install_redhat() {
    echo "📦 Installing dependencies via yum..."

    sudo yum update -y

    echo ""
    echo "Installing qpdf..."
    sudo yum install -y qpdf

    echo ""
    echo "Installing Ghostscript..."
    sudo yum install -y ghostscript

    echo ""
    echo "Installing poppler-utils..."
    sudo yum install -y poppler-utils

    echo ""
    echo "Installing OCR tools..."
    sudo yum install -y tesseract tesseract-langpack-eng
    pip3 install ocrmypdf || true
}

# Run appropriate installer
case $OS in
    macos)
        install_macos
        ;;
    debian)
        install_debian
        ;;
    redhat)
        install_redhat
        ;;
esac

echo ""
echo "================================================"
echo "✅ System dependencies installed!"
echo ""
echo "Now install Node.js dependencies:"
echo "  npm install"
echo ""
echo "To verify installation:"
echo "  npm run check:deps"
