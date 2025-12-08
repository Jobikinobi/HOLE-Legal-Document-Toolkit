# Legal Document PDF Converter Configuration
# This file documents the quality settings and technical specifications

# Quality Presets
# ===============

# HIGH QUALITY (Default - Recommended for Legal Documents)
# - DPI: 300 (Professional print quality)
# - JPEG Quality: 95% (Minimal compression artifacts)
# - Optimization: Enabled
# - Use Case: Legal filings, contracts, court documents
# - Expected Output: Maximum clarity, larger file sizes

# MEDIUM QUALITY
# - DPI: 200 (Good screen and print quality)
# - JPEG Quality: 85% (Balanced compression)
# - Optimization: Enabled
# - Use Case: Internal documents, email attachments
# - Expected Output: Good quality, moderate file sizes

# LOW QUALITY
# - DPI: 150 (Screen quality)
# - JPEG Quality: 75% (Higher compression)
# - Optimization: Enabled
# - Use Case: Quick reviews, drafts
# - Expected Output: Acceptable quality, smaller file sizes


# Compression Technology
# ======================
# The tool uses:
# - DCT (Discrete Cosine Transform) encoding for JPEG compression
# - Stream compression for PDF structure optimization
# - Lossless optimization of PDF metadata and structure
# - Smart image resampling when appropriate


# Supported Input Formats
# ========================
# Images:
# - JPEG/JPG (all variants)
# - PNG (including transparency)
# - TIFF/TIF (single and multi-page)
# - BMP (Windows Bitmap)
# - GIF (including animated - first frame only)

# PDFs:
# - All PDF versions (1.0 through 2.0)
# - Password-protected PDFs (requires password)
# - PDF/A (archival format)
# - Multi-page documents
# - Documents with forms and annotations


# Performance Guidelines
# =======================
# - Single page processing: < 1 second
# - 10-page document: 2-5 seconds
# - 100-page document: 20-60 seconds
# - Processing time depends on image resolution and complexity
# - Optimization provides 30-70% file size reduction typically


# Best Practices for Legal Documents
# ===================================
# 1. Always use 'high' quality setting for official submissions
# 2. Scan documents at 300 DPI or higher
# 3. Use PDF/A format for long-term archival (pikepdf supports this)
# 4. Keep original uncompressed files as backup
# 5. Verify readability of compressed documents before submission
# 6. For color documents, ensure color accuracy after compression
# 7. Test compression on sample pages before processing entire document


# Command Line Tips
# =================
# - Use wildcards for batch operations: pdf-converter convert *.jpg -o output.pdf
# - Chain commands with && for workflow: convert && merge && optimize
# - Use absolute paths to avoid ambiguity
# - Quote filenames with spaces: pdf-converter merge "my file.pdf" -o output.pdf
# - Check file sizes before and after: ls -lh *.pdf


# Troubleshooting
# ===============
# - "Out of memory" errors: Process files in smaller batches
# - "File not found" errors: Use absolute paths or check current directory
# - Slow performance: Check available disk space and RAM
# - Quality issues: Try 'high' setting or increase source image resolution
# - Corrupted output: Verify input files are valid PDFs/images


# Technical Specifications
# =========================
# - Python: 3.8+
# - Max file size: Limited by available RAM (typically 100MB+ per file)
# - Max pages: No hard limit (tested up to 1000+ pages)
# - Color space: RGB, CMYK, Grayscale supported
# - Metadata: Preserved during optimization
# - Bookmarks/TOC: Preserved during merge operations
# - Encryption: Can read encrypted PDFs, outputs unencrypted (add encryption after)
