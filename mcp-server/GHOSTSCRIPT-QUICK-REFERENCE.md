# Ghostscript PDF Optimization: Quick Reference Guide

**For**: Legal Document Toolkit Developers
**Updated**: January 2026
**Version**: 1.0

---

## Common Command Templates

### Template 1: High-Quality Legal Document (Best for Contracts)
```bash
gs \
  -sDEVICE=pdfwrite \
  -dCompatibilityLevel=1.5 \
  -dNOPAUSE -dBATCH -dQUIET \
  -dColorImageResolution=300 \
  -dGrayImageResolution=300 \
  -dMonoImageResolution=1200 \
  -dColorImageFilter=/LZWEncode \
  -dGrayImageFilter=/LZWEncode \
  -dColorImageDownsampleType=/Bicubic \
  -dGrayImageDownsampleType=/Bicubic \
  -dDetectDuplicateImages=true \
  -dCompressFonts=true \
  -dSubsetFonts=true \
  -dEmbedAllFonts=true \
  -sOutputFile=output.pdf \
  input.pdf
```
**Result**: ~50-60% compression, lossless, signature-safe

### Template 2: Scanned Exhibits (Best for Photos/Scans)
```bash
gs \
  -sDEVICE=pdfwrite \
  -dCompatibilityLevel=1.5 \
  -dNOPAUSE -dBATCH -dQUIET \
  -dColorImageResolution=300 \
  -dGrayImageResolution=300 \
  -dMonoImageResolution=1200 \
  -dColorImageFilter=/DCTEncode \
  -dGrayImageFilter=/DCTEncode \
  -dJPEGQ=90 \
  -dColorImageDownsampleType=/Bicubic \
  -dGrayImageDownsampleType=/Bicubic \
  -dDetectDuplicateImages=true \
  -dCompressFonts=true \
  -dSubsetFonts=true \
  -dEmbedAllFonts=true \
  -sOutputFile=output.pdf \
  input.pdf
```
**Result**: ~70-85% compression, high quality, ideal for photos

### Template 3: Mixed Content (Best for Reports)
```bash
gs \
  -sDEVICE=pdfwrite \
  -dCompatibilityLevel=1.5 \
  -dNOPAUSE -dBATCH -dQUIET \
  -dColorImageResolution=300 \
  -dGrayImageResolution=300 \
  -dMonoImageResolution=1200 \
  -dColorImageFilter=/DCTEncode \
  -dGrayImageFilter=/LZWEncode \
  -dJPEGQ=92 \
  -dColorImageDownsampleType=/Bicubic \
  -dGrayImageDownsampleType=/Bicubic \
  -dDetectDuplicateImages=true \
  -dCompressFonts=true \
  -dSubsetFonts=true \
  -dEmbedAllFonts=true \
  -sOutputFile=output.pdf \
  input.pdf
```
**Result**: ~60-75% compression, good for mixed text/images

### Template 4: Digital Archival (225 DPI, Space-Optimized)
```bash
gs \
  -sDEVICE=pdfwrite \
  -dCompatibilityLevel=1.5 \
  -dNOPAUSE -dBATCH -dQUIET \
  -dColorImageResolution=225 \
  -dGrayImageResolution=225 \
  -dMonoImageResolution=900 \
  -dColorImageFilter=/DCTEncode \
  -dGrayImageFilter=/DCTEncode \
  -dJPEGQ=90 \
  -dColorImageDownsampleType=/Bicubic \
  -dGrayImageDownsampleType=/Bicubic \
  -dDetectDuplicateImages=true \
  -dCompressFonts=true \
  -dSubsetFonts=true \
  -dEmbedAllFonts=true \
  -sOutputFile=output.pdf \
  input.pdf
```
**Result**: ~80-90% compression, 45-50% smaller than 300 DPI

### Template 5: Maximum Compression (Bulk Processing)
```bash
gs \
  -sDEVICE=pdfwrite \
  -dCompatibilityLevel=1.5 \
  -dNOPAUSE -dBATCH -dQUIET \
  -dNumRenderingThreads=4 \
  -dColorImageResolution=225 \
  -dGrayImageResolution=225 \
  -dMonoImageResolution=900 \
  -dColorImageFilter=/DCTEncode \
  -dGrayImageFilter=/DCTEncode \
  -dJPEGQ=85 \
  -dColorImageDownsampleType=/Average \
  -dGrayImageDownsampleType=/Average \
  -dDetectDuplicateImages=true \
  -dCompressFonts=true \
  -dSubsetFonts=true \
  -sOutputFile=output.pdf \
  input.pdf
```
**Result**: ~85-92% compression, fastest processing, acceptable quality loss

---

## Parameter Quick Lookup

### Resolution Parameters
```
-dColorImageResolution=72      # Screen (smallest)
-dColorImageResolution=150     # E-book (medium)
-dColorImageResolution=225     # Digital archival
-dColorImageResolution=300     # Professional/printing
```

### Image Compression Methods
```
-dColorImageFilter=/FlateDecode    # Lossless, safe default (45-60% compression)
-dColorImageFilter=/LZWEncode      # Lossless, better for text (45-70% compression)
-dColorImageFilter=/DCTEncode      # Lossy JPEG (70-85% compression)
```

### JPEG Quality (Only with DCTEncode)
```
-dJPEGQ=75       # Good archival quality, good compression
-dJPEGQ=85       # Excellent quality, moderate compression
-dJPEGQ=90       # Very high quality, minimal loss (PROJECT DEFAULT)
-dJPEGQ=95       # Near-lossless, large files
-dJPEGQ=100      # Lossless (defeats compression purpose)
```

### Downsampling Algorithms
```
-dColorImageDownsampleType=/Bicubic    # Highest quality (DEFAULT for legal)
-dColorImageDownsampleType=/Average    # Balanced (used in aggressive profile)
-dColorImageDownsampleType=/Subsample  # Fastest but lowest quality
```

### Color Conversion
```
-sColorConversionStrategy=DeviceRGB         # Keep color
-sColorConversionStrategy=DeviceGray        # Convert to B&W
-sColorConversionStrategy=DeviceCMYK        # For print workflows
-sColorConversionStrategy=DeviceIndependentColor  # ICC-based
```

### Font Options
```
-dSubsetFonts=true         # Include only used glyphs (20-40% size reduction)
-dEmbedAllFonts=true       # Full font embedding (ensures rendering)
-dCompressFonts=true       # Compress font streams
-dEncodeAsciiText=false    # Binary encoding (smaller)
-dEncodeAsciiText=true     # ASCII encoding (more compatible)
```

### Preservation Flags
```
-dPreserveHalftoneInfo=true         # For professional printing
-dPreserveOPIComments=true          # For prepress workflows
-dPreserveOverprintSettings=true    # Color separation support
-dDetectDuplicateImages=true        # Reuse identical images
```

### Processing Performance
```
-dNumRenderingThreads=4    # Use 4 CPU cores (faster)
-dOptimize=true            # Enable optimization pass
-dPrinted=false            # Optimize for screen, not printing
```

### PDF Compatibility
```
-dCompatibilityLevel=1.4    # Widest compatibility
-dCompatibilityLevel=1.5    # Balanced (PROJECT DEFAULT)
-dCompatibilityLevel=1.7    # Modern features, good support (ARCHIVAL)
```

---

## Profile Decision Matrix

| Document Type | Profile | DPI | Compression | Use Case |
|---|---|---|---|---|
| Contracts, Forms | legal-text | 300 | 45-60% | Text preservation, signatures |
| Scanned Exhibits | legal-jpeg | 300 | 70-85% | Photos, color documents |
| Mixed Reports | legal-balanced | 300 | 60-75% | Default for unknown content |
| Large Scans | legal-jpeg-225 | 225 | 80-90% | Digital archival, cost savings |
| Text + Small Images | legal-text-225 | 225 | 55-65% | Digital contracts |
| Bulk Archival | legal-aggressive-225 | 225 | 85-92% | Maximum compression |
| Long-term Storage | legal-archive | 300 | 55-70% | Compliance retention |

---

## Common Issues & Solutions

### Issue: File Larger Than Expected
**Solution**: Try profile with lower DPI (225 vs 300) or more aggressive compression
```bash
# Check current size
ls -lh file.pdf

# Try aggressive profile
gs -sDEVICE=pdfwrite -dColorImageResolution=225 -dJPEGQ=85 ...
```

### Issue: Text Blurry After Compression
**Solution**: Use LZWEncode or FlateDecode instead of DCTEncode
```bash
# Change from:
-dColorImageFilter=/DCTEncode

# To:
-dColorImageFilter=/LZWEncode
```

### Issue: Colors Look Wrong
**Solution**: Check if automatic color conversion is interfering
```bash
# Disable automatic filtering:
-dAutoFilterColorImages=false
-dAutoFilterGrayImages=false

# Explicitly specify filter:
-dColorImageFilter=/DCTEncode
```

### Issue: Signatures Not Rendering
**Solution**: Ensure fonts embedded and use lossless compression
```bash
# Add:
-dSubsetFonts=true
-dEmbedAllFonts=true
-dColorImageFilter=/LZWEncode
```

### Issue: Processing Very Slow
**Solution**: Enable multi-threading and use faster algorithms
```bash
# Add:
-dNumRenderingThreads=4
-dColorImageDownsampleType=/Average    # Instead of /Bicubic
-dJPEGQ=80                             # Slightly lower quality
```

### Issue: PDF Not Compatible With Old Readers
**Solution**: Use lower compatibility level
```bash
# Change from:
-dCompatibilityLevel=1.7

# To:
-dCompatibilityLevel=1.4
```

---

## Benchmarks: What to Expect

### Typical Compression by Profile (300 DPI)

| Profile | Input | Output | Compression | Time |
|---------|-------|--------|-------------|------|
| printer | 5 MB | 2.5 MB | 50% | 2-3s |
| legal-text | 5 MB | 2.5 MB | 50% | 2-3s |
| legal-balanced | 5 MB | 1.8 MB | 64% | 3-4s |
| legal-jpeg | 5 MB | 1.2 MB | 76% | 4-5s |
| legal-aggressive | 5 MB | 1 MB | 80% | 3-4s |

### 225 DPI Variants (Additional 45-50% Reduction)

| Profile | From 300 DPI | 225 DPI Variant | Additional Savings |
|---------|---|---|---|
| legal-jpeg | 1.2 MB | 0.6 MB | 50% |
| legal-text | 2.5 MB | 1.5 MB | 40% |
| legal-aggressive | 1.0 MB | 0.5 MB | 50% |

---

## Implementation in Project

### From compression-profiles.ts
Each profile specifies:
1. DPI settings (color, gray, mono)
2. Compression filter (DCTEncode, LZWEncode, FlateDecode)
3. Downsampling method (Bicubic, Average, Subsample)
4. JPEG quality (if applicable)
5. Ghostscript flags array

### From optimize.ts
```typescript
// Base flags applied to all profiles
const baseFlags = [
  "-sDEVICE=pdfwrite",
  "-dCompatibilityLevel=1.5",
  "-dNOPAUSE",
  "-dQUIET",
  "-dBATCH",
  "-dDetectDuplicateImages=true",
  "-dCompressFonts=true",
  "-dSubsetFonts=true",
  "-dEmbedAllFonts=true",
];

// Profile-specific flags added from profile object
const presetFlags = getProfile(preset).considerGhostscriptFlags;

// Optional overrides
const dpiFlags = [
  "-dColorImageResolution=225",
  "-dGrayImageResolution=225",
  "-dDownsampleColorImages=true",
];

const grayscaleFlags = [
  "-sColorConversionStrategy=Gray",
  "-dProcessColorModel=/DeviceGray",
];
```

---

## Advanced: Custom Parameters

### For Color-Critical Documents
```
-sDefaultRGBProfile=/usr/share/ghostscript/iccprofiles/sRGB.icc
-sDefaultCMYKProfile=/usr/share/ghostscript/iccprofiles/CMYK.icc
```

### For Multi-threaded Processing
```
-dNumRenderingThreads=8    # For 8-core CPU
```

### For Memory-Constrained Environments
```
-K 512000    # Limit to ~512MB RAM
```

### For Banded Processing (Very Large Files)
```
-dBandBufferSpace=500000000    # 500MB band buffer
```

### For Custom Page Rotation
```
-dAutoRotatePages=/PageByPage    # Auto-rotate if needed
-dAutoRotatePages=/None          # Don't rotate
```

---

## Validation Checklist

Before deploying optimization profile:

- [ ] File size reduced as expected (compare with benchmarks)
- [ ] Text remains crisp and readable
- [ ] Images maintain acceptable quality
- [ ] Colors accurate (check known reference)
- [ ] Signatures present and readable (if applicable)
- [ ] PDF opens in multiple readers
- [ ] Fonts subset properly (inspect with PDF viewer)
- [ ] No warnings in Ghostscript output
- [ ] Processing time acceptable for volume

---

## Performance Tuning

### For Speed (Bulk Processing)
```bash
# Use Average downsampling (faster than Bicubic)
-dColorImageDownsampleType=/Average

# Lower JPEG quality (less compression/decompression time)
-dJPEGQ=80

# Use multiple threads
-dNumRenderingThreads=4
```

### For Quality (Archival)
```bash
# Use Bicubic downsampling (slower but better)
-dColorImageDownsampleType=/Bicubic

# Higher JPEG quality (or use lossless)
-dJPEGQ=95
-dColorImageFilter=/LZWEncode

# Preserve prepress info
-dPreserveHalftoneInfo=true
```

### For Compatibility (Wider Reader Support)
```bash
# Lower compatibility level
-dCompatibilityLevel=1.4

# Disable newer features
-dSubsetFonts=false    # May increase size but better compatibility
```

---

## Useful Shell Functions

### Compress with Profile
```bash
compress_pdf() {
  local input=$1
  local profile=${2:-legal-balanced}
  local output="${input%.pdf}-${profile}.pdf"

  gs -sDEVICE=pdfwrite \
     -dCompatibilityLevel=1.5 \
     -dNOPAUSE -dBATCH -dQUIET \
     [profile-specific-flags-here] \
     -sOutputFile="$output" \
     "$input"

  echo "Compressed: $input → $output"
  ls -lh "$input" "$output"
}
```

### Compare Compression Ratios
```bash
compare_compression() {
  local input=$1
  local size_before=$(stat -f%z "$input")
  local size_after=$(stat -f%z "$input.compressed")
  local percent=$(( (size_before - size_after) * 100 / size_before ))

  echo "Original:   $(numfmt --to=iec $size_before)"
  echo "Compressed: $(numfmt --to=iec $size_after)"
  echo "Reduction:  $percent%"
}
```

---

## Additional Resources

- **Full Documentation**: `/Volumes/HOLE-RAID-DRIVE/Projects/HOLE-Legal-Document-Toolkit/mcp-server/GHOSTSCRIPT-RESEARCH.md`
- **Compression Profiles**: `/Volumes/HOLE-RAID-DRIVE/Projects/HOLE-Legal-Document-Toolkit/mcp-server/src/tools/compression-profiles.ts`
- **Optimization Tool**: `/Volumes/HOLE-RAID-DRIVE/Projects/HOLE-Legal-Document-Toolkit/mcp-server/src/tools/optimize.ts`
- **Official Ghostscript**: https://ghostscript.com/
- **Official Docs**: https://ghostscript.readthedocs.io/

---

**Quick Help**: For profile recommendations based on document type, see `pdf-analyzer.ts` which implements decision trees for automatic profile selection.
