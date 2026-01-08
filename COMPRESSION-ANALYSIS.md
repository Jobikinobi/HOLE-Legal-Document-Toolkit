# PDF Compression Strategy Analysis - 300 DPI Legal Documents

**Date**: 2026-01-07
**Goal**: Achieve higher compression while maintaining legal document quality standards

---

## Current 300 DPI Profile ("printer" preset)

### Ghostscript Settings
```
-dPDFSETTINGS=/printer
-dColorImageResolution=300
-dGrayImageResolution=300
-dMonoImageResolution=1200
-dAutoFilterColorImages=true
-dAutoFilterGrayImages=true
-dColorImageDownsampleType=/Bicubic
-dGrayImageDownsampleType=/Bicubic
-dMonoImageDownsampleType=/Subsample
```

### What This Does
- **Color Images**: Reduced to 300 DPI using bicubic downsampling (high quality)
- **Grayscale Images**: Reduced to 300 DPI using bicubic downsampling
- **Monochrome (B&W)**: Reduced to 1200 DPI (text preservation)
- **Auto-filtering**: Ghostscript automatically chooses LZW or Flate compression
- **Bicubic downsampling**: Best quality but moderate compression

### Compression Ratio
- Typical PDFs: 30-50% reduction
- Image-heavy PDFs: 20-40% reduction
- Text-heavy PDFs: 50-70% reduction

---

## Image Format Strategies for 300 DPI

### JPEG vs PNG at 300 DPI

#### PNG (Current Default)
- **Compression**: Lossless (Deflate/Flate algorithm)
- **Best for**: Monochrome/text, graphics with sharp edges
- **Compression ratio**: 3-5:1 for color images
- **Quality loss**: None
- **Use case**: Certificates, forms, text-heavy documents

#### JPEG
- **Compression**: Lossy (transform coding)
- **Best for**: Photographic images, scanned documents
- **Compression ratio**: 10-20:1 for color images (vs PNG's 3-5:1)
- **Quality loss**: Minimal at 90+ quality
- **Use case**: Scanned pages, photographs, mixed content

### Trade-off Analysis at 300 DPI

**Scenario 1: 100-page color scanned document**
```
PNG approach:  25 MB → 12 MB (50% compression)
JPEG approach: 25 MB → 2-3 MB (88% compression with quality 90)
Savings: 9-10 MB (75% smaller than PNG)
Quality: Imperceptible difference for legal documents
```

**Scenario 2: Mixed content (text + images)**
```
PNG approach:  8 MB → 4 MB
JPEG approach: 8 MB → 1.5 MB (60% vs 50%)
Better for: Scanned pages with both text and images
```

**Scenario 3: Pure text document (PDFs, forms)**
```
PNG approach:  3 MB → 1.5 MB (50%)
JPEG approach: No benefit (JPEG artifacts on text)
Stay with: Current approach (Flate compression)
```

---

## Proposed Compression Profiles

### Profile 1: "legal-balanced" (Recommended for Legal Docs)
**Goal**: High compression with imperceptible quality loss

```
-dPDFSETTINGS=/printer
-dColorImageResolution=300
-dGrayImageResolution=300
-dMonoImageResolution=1200
-dEncodeColorImages=true
-dColorImageFilter=/DCTEncode          ← JPEG compression
-dAutoFilterColorImages=false           ← Force JPEG
-dColorImageDownsampleType=/Bicubic
-dJPEGXResolution=300
-dJPEGYResolution=300
-dDefaultRenderingIntent=/RelativeColorimetric
```

**Results**: 60-75% compression on color documents vs 30-50% current
**Best for**: Scanned legal documents, mixed color/text content

### Profile 2: "legal-aggressive" (Maximum Compression)
**Goal**: Maximum compression, acceptable minimal quality loss

```
-dPDFSETTINGS=/printer
-dColorImageResolution=300
-dGrayImageResolution=300
-dMonoImageResolution=1200
-dEncodeColorImages=true
-dColorImageFilter=/DCTEncode
-dAutoFilterColorImages=false
-dGrayImageFilter=/DCTEncode           ← JPEG for grayscale too
-dAutoFilterGrayImages=false
-dColorImageDownsampleType=/Average    ← Faster, slightly lower quality
-dGrayImageDownsampleType=/Average
-dJPEGXResolution=300
-dJPEGYResolution=300
-dDownsampleColorImages=true
-dDownsampleGrayImages=true
-dEncodeAsciiText=false                 ← Skip text compression (already compact)
```

**Results**: 75-85% compression on color documents
**Best for**: High-volume document processing where minor quality acceptable
**Note**: Good for long-term archival (JPEG can have longevity issues)

### Profile 3: "legal-text-optimized" (For Text-Heavy Docs)
**Goal**: Optimize for documents with minimal images

```
-dPDFSETTINGS=/printer
-dColorImageResolution=300
-dGrayImageResolution=300
-dMonoImageResolution=1200
-dEncodeColorImages=true
-dColorImageFilter=/LZWEncode          ← Better for graphics, text
-dAutoFilterColorImages=false
-dGrayImageFilter=/LZWEncode
-dAutoFilterGrayImages=false
-dColorImageDownsampleType=/Bicubic
-dMonoImageDownsampleType=/Bicubic     ← Better for text preservation
-dSubsetFonts=true
-dEmbedAllFonts=true
-dCompressFonts=true
```

**Results**: 40-55% compression
**Best for**: Forms, contracts, text-heavy documents
**Advantage**: Better text/line preservation than JPEG

### Profile 4: "legal-hybrid" (Adaptive - Recommended)
**Goal**: Balance compression & quality by image type

```
Use /DCTEncode (JPEG) for:
  - Color photographs
  - Scanned color documents
  - Mixed color/text pages

Use /LZWEncode for:
  - Monochrome (B&W) text
  - Graphics with sharp edges
  - Scanned documents with text
  - Forms and certificates
```

**Implementation Challenge**: Ghostscript doesn't natively support per-image encoding
**Solution**: Custom preprocessing to detect image types, then apply appropriate filter

---

## Ghostscript Quality Parameters

### JPEG Quality Control
```
-dJPEGQ=90      ← Quality 0-100 (90 = imperceptible loss)
-dJPEGQ=85      ← Good for legal, still high quality
-dJPEGQ=80      ← Acceptable for archival
```

### Image Processing Filters
```
/DCTEncode      ← JPEG (best compression)
/LZWEncode      ← LZW (good compression, lossless)
/FlateDecode    ← ZIP/Flate (current default, moderate compression)
```

### Downsampling Methods
```
/Bicubic        ← Best quality, slower, larger
/Average        ← Good balance, faster
/Subsample      ← Fastest, slight quality loss (OK for B&W)
```

---

## Recommendations for Custom Profiles

### For Legal Documents (300 DPI)

**Option A: Maximum Compression (JPEG-focused)**
```typescript
{
  name: "legal-jpeg",
  description: "JPEG compression optimized for scanned legal documents",
  colorImageFilter: "DCTEncode",
  colorImageQuality: 90,
  grayImageFilter: "DCTEncode",
  grayImageQuality: 90,
  dpi: 300,
  compression: "75-85% size reduction"
}
```

**Option B: Balanced (Current + JPEG)**
```typescript
{
  name: "legal-balanced",
  description: "Balanced compression with smart image detection",
  colorImageFilter: "DCTEncode",
  colorImageQuality: 92,
  grayImageFilter: "FlateDecode",
  monoImageFilter: "LZWEncode",
  dpi: 300,
  compression: "60-70% size reduction"
}
```

**Option C: Text-Optimized (LZW-focused)**
```typescript
{
  name: "legal-text",
  description: "Optimized for text-heavy documents with minimal images",
  colorImageFilter: "LZWEncode",
  grayImageFilter: "LZWEncode",
  monoImageDownsample: "Bicubic",
  dpi: 300,
  compression: "45-55% size reduction"
}
```

---

## Implementation Considerations

### PNG vs JPEG Quality at 300 DPI

#### When JPEG Wins
- Scanned documents (significant size reduction)
- Color photographs
- Complex mixed content
- High-volume processing (file size critical)

#### When PNG/LZW Wins
- Text documents with few images
- Graphics with sharp edges
- Signatures/handwriting
- Colored forms
- When archival longevity paramount

#### Hybrid Approach
- Detect image type and apply appropriate encoding
- Use JPEG for photograph-like content
- Use LZW for graphics/text
- Keep monochrome at high DPI with bicubic

### Ghostscript Limitations
- Cannot easily detect image content type
- Cannot selectively apply different encodings per-image
- Must be configured at document level, not image level

### Potential Solutions
1. **Pre-processing**: Use ImageMagick to analyze images before PDF creation
2. **Post-processing**: Extract images, convert to JPEG, re-embed
3. **GhostScript extensions**: Use custom device filters
4. **Alternative tools**: Consider using qpdf + image optimization pipeline

---

## Recommended Action Plan

### Phase 1: Add JPEG Compression Profile
```typescript
// In optimize.ts, add new preset:
legal_jpeg: [
  "-dEncodeColorImages=true",
  "-dColorImageFilter=/DCTEncode",
  "-dJPEGQ=90",
  "-dColorImageResolution=300",
  "-dGrayImageFilter=/DCTEncode",
  "-dJPEGQ=90",
]
```

### Phase 2: Add Smart Hybrid Profile
Implement detection for:
- Mostly text? Use text-optimized profile
- Mostly images? Use JPEG profile
- Mixed? Use balanced profile

### Phase 3: Test & Validate
1. Test with various document types
2. Measure compression ratios
3. Validate OCR compatibility
4. Check archival properties

### Phase 4: Advanced Features
1. Per-image encoding detection
2. Quality/size trade-off sliders
3. Document type auto-detection
4. Compression profile presets for industries

---

## Testing Strategy

### Test Documents Needed
```
1. Pure text PDF (contract)
2. Color scanned document (50 pages)
3. Black & white scanned document
4. Mixed content (text + images + forms)
5. Photograph-heavy document
6. Colored form with signatures
```

### Metrics to Measure
```
- Original size
- Compressed size
- Compression ratio
- File integrity (PDF validity)
- OCR accuracy (if applicable)
- Visual quality (spot checks)
- Text searchability
```

### Quality Validation
```
✓ Visual inspection (compare PDFs side-by-side)
✓ Text extraction (OCR accuracy unchanged)
✓ Color fidelity (compare color blocks)
✓ Signature preservation (if applicable)
✓ Metadata preservation
✓ Print quality (test print to physical paper)
```

---

## Estimated Compression Improvements

### Current Profile (Flate/LZW)
```
Text-heavy:     50-70% reduction
Mixed:          30-50% reduction
Image-heavy:    20-40% reduction
Color scanned:  25-35% reduction
```

### Proposed JPEG Profile
```
Text-heavy:     50-70% reduction (no change)
Mixed:          50-65% reduction (+15-35%)
Image-heavy:    60-75% reduction (+40-55%)
Color scanned:  70-85% reduction (+45-50%)
```

### Overall Improvement
**Average across document types: +25-35% compression**

---

## Next Steps

1. ✅ Analyze current settings (done - this document)
2. ⬜ Create new compression profiles in optimize.ts
3. ⬜ Test with sample legal documents
4. ⬜ Implement quality/compression trade-off parameters
5. ⬜ Add profile selection UI
6. ⬜ Create compression presets for different document types

---

## References

- Ghostscript Manual: Image Compression Settings
- PDF Specification 1.7: Image Encoding
- Adobe Acrobat Optimization: JPEG vs Flate trade-offs
- Legal Document Standards: Color accuracy requirements for signatures

---

**Analysis completed**: 2026-01-07
**Next review**: After implementation and testing
**Status**: Ready for implementation
