#!/bin/bash

# Example usage script for Legal Document PDF Converter
# This script demonstrates various ways to use the pdf-converter tool

echo "Legal Document PDF Converter - Example Usage"
echo "=============================================="
echo ""

# Create example directory structure
mkdir -p examples/sample_files
cd examples

echo "1. Example: Merge PDFs"
echo "   Command: pdf-converter merge file1.pdf file2.pdf file3.pdf -o merged.pdf"
echo ""

echo "2. Example: Convert Images to PDF (High Quality)"
echo "   Command: pdf-converter convert image1.jpg image2.png image3.jpg -o document.pdf -q high"
echo ""

echo "3. Example: Convert Images to PDF (Medium Quality)"
echo "   Command: pdf-converter convert *.jpg -o document.pdf -q medium"
echo ""

echo "4. Example: Optimize an Existing PDF"
echo "   Command: pdf-converter optimize large_document.pdf -o optimized_document.pdf -q high"
echo ""

echo "5. Example: Batch Processing"
echo "   Convert images and merge with PDFs:"
echo "   Command: pdf-converter batch scan1.jpg scan2.jpg --pdf contract.pdf --pdf addendum.pdf -o complete_package.pdf -q high"
echo ""

echo "6. Example: Legal Document Workflow"
echo "   Step 1: Convert scanned images to PDF"
echo "   Command: pdf-converter convert page1.jpg page2.jpg page3.jpg -o scanned.pdf -q high"
echo ""
echo "   Step 2: Merge with existing documents"
echo "   Command: pdf-converter merge scanned.pdf cover_letter.pdf -o complete.pdf"
echo ""
echo "   Step 3: Optimize final document"
echo "   Command: pdf-converter optimize complete.pdf -o final_submission.pdf -q high"
echo ""

echo "Quality Settings Guide:"
echo "----------------------"
echo "high   - 300 DPI, 95% quality (Recommended for legal documents)"
echo "medium - 200 DPI, 85% quality (Good balance)"
echo "low    - 150 DPI, 75% quality (Smaller files)"
echo ""

echo "For more information, run: pdf-converter --help"
