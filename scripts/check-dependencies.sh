#!/bin/bash
# Check if all required dependencies are installed

echo "🔍 Legal Exhibits Toolkit - Dependency Check"
echo "============================================="
echo ""

check_command() {
    local cmd=$1
    local name=$2
    local install_cmd=$3
    local required=$4

    if command -v $cmd &> /dev/null; then
        local version=$($cmd --version 2>&1 | head -n1)
        echo "✅ $name: $version"
        return 0
    else
        if [ "$required" == "required" ]; then
            echo "❌ $name: NOT INSTALLED (required)"
            echo "   Install with: $install_cmd"
        else
            echo "⚠️  $name: NOT INSTALLED (optional)"
            echo "   Install with: $install_cmd"
        fi
        return 1
    fi
}

echo "Required Dependencies:"
echo "----------------------"
check_command "qpdf" "qpdf" "brew install qpdf" "required"
qpdf_ok=$?

check_command "gs" "Ghostscript" "brew install gs" "required"
gs_ok=$?

echo ""
echo "Recommended Dependencies:"
echo "------------------------"
check_command "pdfinfo" "poppler (pdfinfo)" "brew install poppler" "optional"

check_command "pdfcpu" "pdfcpu" "brew install pdfcpu" "optional"

echo ""
echo "Node.js Environment:"
echo "-------------------"
check_command "node" "Node.js" "https://nodejs.org" "required"
node_ok=$?

check_command "npm" "npm" "comes with Node.js" "required"
npm_ok=$?

echo ""
echo "============================================="

if [ $qpdf_ok -eq 0 ] && [ $gs_ok -eq 0 ] && [ $node_ok -eq 0 ] && [ $npm_ok -eq 0 ]; then
    echo "✅ All required dependencies are installed!"
    echo ""
    echo "You're ready to go! Run:"
    echo "  npm install"
    echo "  npm run mcp:dev"
    exit 0
else
    echo "❌ Some required dependencies are missing."
    echo ""
    echo "Run the installer:"
    echo "  npm run install:deps"
    exit 1
fi
