# Compression Profiles Guide

## Overview

The Legal Exhibits MCP Server includes **11 compression profiles** optimized for different legal document scenarios. Each profile balances file size, quality, and use case.

**Key Statistics:**
- 6 professional-quality profiles at 300 DPI
- 5 digital-first profiles at 225 DPI (45-60% smaller files)
- Compression ranges from 30% to 92%
- All profiles maintain legal document readability

---

## Profile Categories

### 300 DPI Profiles (Professional Quality)

These profiles are suitable for documents that will be printed or require maximum professional quality.

#### 1. **printer** (Default - Safe Choice)
- **DPI**: 300 (color, grayscale), 1200 (monochrome)
- **Compression**: 30-50%
- **Best For**: Mixed content, safe default, general-purpose
- **Use When**: You're unsure which profile to use
- **Quality**: High - minimal quality loss
- **File Size Savings**: Modest

```bash
cc optimize_pdf input.pdf output.pdf --preset printer
```

#### 2. **legal-jpeg** (Recommended for Scans)
- **DPI**: 300
- **Compression**: 70-85%
- **Filter**: JPEG (DCTEncode) for color/grayscale
- **Best For**: Scanned legal documents, color photos, high-volume processing
- **Use When**: Document is primarily scanned images
- **Quality**: Very High - imperceptible loss at JPEG quality 90
- **File Size Savings**: Excellent (65-75% reduction typical)

```bash
cc optimize_pdf scanned-document.pdf output.pdf --preset legal-jpeg
```

#### 3. **legal-balanced** (Hybrid Approach)
- **DPI**: 300
- **Compression**: 60-75%
- **Filter**: JPEG (DCTEncode) for color, LZW for grayscale
- **Best For**: Mixed content (text + color images), professional documents
- **Use When**: Document has both text and images
- **Quality**: Very High - smart filtering preserves text clarity
- **File Size Savings**: Good (55-70% reduction typical)

```bash
cc optimize_pdf mixed-document.pdf output.pdf --preset legal-balanced
```

#### 4. **legal-text** (Text Optimized)
- **DPI**: 300
- **Compression**: 45-60%
- **Filter**: LZW (lossless) for both color and grayscale
- **Best For**: Contracts, forms, text-heavy documents, signature preservation
- **Use When**: Document is primarily text with minimal images
- **Quality**: Excellent - perfect text/signature preservation
- **File Size Savings**: Moderate (40-50% reduction typical)

```bash
cc optimize_pdf contract.pdf output.pdf --preset legal-text
```

#### 5. **legal-aggressive** (Maximum Compression)
- **DPI**: 300
- **Compression**: 75-85%
- **Filter**: JPEG with quality 85 (slight quality reduction)
- **Downsampling**: Average (faster but slight quality loss)
- **Best For**: Bulk archival, cloud storage, high-volume processing, cost-sensitive scenarios
- **Use When**: File size is critical
- **Quality**: Good - acceptable quality loss for bulk scenarios
- **File Size Savings**: Excellent (70-80% reduction typical)

```bash
cc optimize_pdf batch-document.pdf output.pdf --preset legal-aggressive
```

#### 6. **legal-archive** (Archival Quality)
- **DPI**: 300
- **Compression**: 55-70%
- **Filter**: LZW (lossless) - preserves everything
- **Best For**: Long-term legal storage, compliance requirements, documents with retention requirements
- **Use When**: Document needs to be preserved for decades
- **Quality**: Excellent - lossless compression
- **File Size Savings**: Good (50-65% reduction typical)

```bash
cc optimize_pdf archive-document.pdf output.pdf --preset legal-archive
```

---

### 225 DPI Profiles (Digital-First, 45-60% Smaller)

These profiles sacrifice minimal perceptible quality but achieve **45-60% smaller files** than 300 DPI equivalents. Perfect for digital distribution, cloud storage, and email.

#### 7. **legal-jpeg-225** (Digital JPEG)
- **DPI**: 225 (vs 300 in legal-jpeg)
- **Compression**: 80-90%
- **Filter**: JPEG with quality 90
- **Size Reduction vs 300 DPI**: 45-50% smaller
- **Best For**: Digital archival, cloud storage, scanned documents for digital consumption
- **Use When**: Document will only be viewed digitally
- **Quality**: Very High - imperceptible loss
- **Overall File Size Savings**: Excellent (70-85% reduction typical)

```bash
cc optimize_pdf scanned-document.pdf output.pdf --preset legal-jpeg-225
```

#### 8. **legal-balanced-225** (Digital Hybrid)
- **DPI**: 225
- **Compression**: 70-80%
- **Filter**: JPEG for color, LZW for grayscale
- **Size Reduction vs 300 DPI**: 45-50% smaller
- **Best For**: Digital-first mixed content, professional documents without print requirements
- **Use When**: Document is for digital sharing/archival
- **Quality**: Very High
- **Overall File Size Savings**: Good (65-75% reduction typical)

```bash
cc optimize_pdf mixed-document.pdf output.pdf --preset legal-balanced-225
```

#### 9. **legal-text-225** (Digital Text)
- **DPI**: 225
- **Compression**: 55-65%
- **Filter**: LZW (lossless)
- **Size Reduction vs 300 DPI**: 35-40% smaller
- **Best For**: Digital contracts, e-signatures, forms (225 DPI acceptable for text)
- **Use When**: Document is text-heavy and digital-only
- **Quality**: Excellent - perfect text preservation
- **Overall File Size Savings**: Good (50-60% reduction typical)

```bash
cc optimize_pdf contract.pdf output.pdf --preset legal-text-225
```

#### 10. **legal-aggressive-225** (Maximum Digital Compression)
- **DPI**: 225
- **Compression**: 85-92%
- **Filter**: JPEG with quality 85
- **Size Reduction vs 300 DPI**: 50-60% smaller
- **Best For**: Bulk archival, cloud storage cost optimization, high-volume processing
- **Use When**: Absolute minimum file size needed
- **Quality**: Good - acceptable quality loss
- **Overall File Size Savings**: Exceptional (75-85% reduction typical)

```bash
cc optimize_pdf batch-document.pdf output.pdf --preset legal-aggressive-225
```

#### 11. **legal-archive-225** (Digital Archival)
- **DPI**: 225
- **Compression**: 65-75%
- **Filter**: LZW (lossless)
- **Size Reduction vs 300 DPI**: 40-45% smaller
- **Best For**: Digital legal archival, compliance storage, long-term digital preservation
- **Use When**: Document needs long-term preservation but digital-only
- **Quality**: Excellent - lossless compression
- **Overall File Size Savings**: Good (60-70% reduction typical)

```bash
cc optimize_pdf archive-document.pdf output.pdf --preset legal-archive-225
```

---

## Quick Selection Guide

### Choose by Document Type

| Document Type | Recommended Profile | Why |
|---|---|---|
| **Scanned Contract** | legal-text | Preserves signatures, minimal images |
| **Scanned Legal Document** | legal-jpeg | Optimized for image compression |
| **Mixed Content (Text + Images)** | legal-balanced | Smart filtering for both |
| **Bulk Processing** | legal-aggressive | Maximum compression for cost savings |
| **Long-term Archival** | legal-archive | Lossless, preservation-focused |
| **Digital Email/Cloud** | legal-jpeg-225 or legal-text-225 | 45-60% smaller, excellent quality |
| **Cost-Sensitive Bulk (Digital)** | legal-aggressive-225 | Extreme compression, digital-only |

### Choose by Priority

| Priority | Profile | Compression | Quality |
|---|---|---|---|
| **Quality First** | legal-archive | 55-70% | Excellent (lossless) |
| **Balanced** | legal-balanced | 60-75% | Very High |
| **Size First (Digital)** | legal-aggressive-225 | 85-92% | Good |
| **Safe Default** | printer | 30-50% | High |

### Choose by Use Case

| Use Case | Recommended | Reasoning |
|---|---|---|
| **Will Print Later** | Use 300 DPI profiles (legal-jpeg, legal-balanced, legal-text) | Printing requires higher DPI |
| **Digital Only** | Use 225 DPI profiles (legal-jpeg-225, legal-text-225, etc.) | 45-60% smaller with minimal quality loss |
| **Email/Share** | legal-jpeg-225 or legal-text-225 | Minimal file size, excellent digital quality |
| **Cloud Storage** | legal-aggressive-225 | Maximum space savings |
| **Legal Compliance** | legal-archive or legal-archive-225 | Lossless compression ensures no data loss |
| **Bulk Processing** | legal-aggressive or legal-aggressive-225 | Cost optimization for many documents |

---

## Compression Comparison Chart

```
Profile              | Compression | Quality    | Best For                    | 225 DPI Advantage
--------------------|-------------|------------|-----------------------------|-----------------
printer              | 30-50%      | High       | Safe default                | N/A
legal-jpeg           | 70-85%      | Very High  | Scanned docs                | -50% size
legal-balanced       | 60-75%      | Very High  | Mixed content               | -45% size
legal-text           | 45-60%      | Excellent  | Text-heavy docs             | -40% size
legal-aggressive     | 75-85%      | Good       | Bulk processing             | -55% size
legal-archive        | 55-70%      | Excellent  | Long-term storage           | -45% size
--------------------|-------------|------------|-----------------------------|-----------------
legal-jpeg-225       | 80-90%      | Very High  | Digital archival            | -50% vs 300 DPI
legal-balanced-225   | 70-80%      | Very High  | Digital documents           | -45% vs 300 DPI
legal-text-225       | 55-65%      | Excellent  | Digital contracts           | -40% vs 300 DPI
legal-aggressive-225 | 85-92%      | Good       | Bulk digital archival       | -55% vs 300 DPI
legal-archive-225    | 65-75%      | Excellent  | Digital compliance storage  | -45% vs 300 DPI
```

---

## Advanced Options

### Custom DPI Override

Override the profile's DPI setting:

```bash
cc optimize_pdf input.pdf output.pdf --preset legal-jpeg --dpi 150
```

### Grayscale Conversion

Convert to grayscale for additional 10-20% size reduction:

```bash
cc optimize_pdf input.pdf output.pdf --preset legal-jpeg --grayscale
```

Combine for maximum compression:

```bash
cc optimize_pdf input.pdf output.pdf --preset legal-aggressive-225 --grayscale
```

---

## Real-World Examples

### Example 1: Scanned Contract for Archive
```bash
# Original: 15 MB scanned contract
# Requirements: Long-term preservation, will print later
cc optimize_pdf contract.pdf archive-contract.pdf --preset legal-archive
# Result: ~5-6 MB (60-70% compression, lossless)
```

### Example 2: Bulk Scans for Cloud Storage
```bash
# Original: 500 scanned documents, 7.5 GB total
# Requirements: Cost-optimized cloud storage
cc optimize_pdf batch.pdf batch-cloud.pdf --preset legal-aggressive-225
# Result: ~750 MB-1.2 GB total (80% size reduction!)
```

### Example 3: Digital Sharing via Email
```bash
# Original: 25 MB mixed content document
# Requirements: Email-friendly, no printing
cc optimize_pdf report.pdf report-email.pdf --preset legal-balanced-225
# Result: ~2-3 MB (85% reduction, excellent digital quality)
```

### Example 4: Exhibit with OCR and Optimization
```bash
cc process_exhibit scanned-exhibit.pdf final-exhibit.pdf \
  --preset legal-text \
  --ocr true \
  --exhibit_label "Exhibit A" \
  --pages "1-10"
# Result: Searchable, optimized, labeled exhibit
```

---

## Technical Details

### DPI Breakdown

| Profile | Color DPI | Gray DPI | Mono DPI | Impact |
|---|---|---|---|---|
| printer | 300 | 300 | 1200 | Professional quality |
| legal-jpeg | 300 | 300 | 1200 | High quality JPEG |
| legal-text | 300 | 300 | 1200 | Text preservation |
| legal-* (225) | 225 | 225 | 900 | Digital-first, compact |

### Image Filters

| Filter | Type | Compression | Quality | Use Case |
|---|---|---|---|---|
| DCTEncode | JPEG | Excellent | Very High | Photos, color scans |
| LZWEncode | Lossless | Good | Excellent | Text, signatures, archival |
| FlateDecode | Deflate | Modest | High | Generic (legacy) |

### Downsampling Methods

| Method | Speed | Quality | Use Case |
|---|---|---|---|
| Bicubic | Slower | Best | Legal documents, text |
| Average | Faster | Good | Bulk processing |
| Subsample | Fastest | Fair | Low-quality needs |

---

## Troubleshooting

### File Size Didn't Reduce Much
**Solution**: Try a more aggressive profile
- Upgrade: legal-balanced → legal-jpeg
- Upgrade: legal-jpeg → legal-aggressive
- Upgrade: legal-balanced-225 → legal-aggressive-225

### Quality Looks Degraded
**Solution**: Use a less aggressive profile
- Downgrade: legal-aggressive → legal-balanced
- Downgrade: legal-jpeg → legal-text
- Use 300 DPI instead of 225 DPI

### Document Won't Print Well
**Solution**: Use 300 DPI profiles (not 225 DPI)
- Change: legal-jpeg-225 → legal-jpeg
- Change: legal-balanced-225 → legal-balanced
- Add: --dpi 300 to override

---

## Summary

- **Start with**: `legal-balanced` (safe, good compression)
- **For Scans**: `legal-jpeg` (best compression for images)
- **For Text**: `legal-text` (perfect for contracts/forms)
- **For Digital**: Add `-225` to any profile (45-60% smaller)
- **For Archival**: `legal-archive` or `legal-archive-225` (lossless)
- **For Bulk**: `legal-aggressive-225` (maximum compression)

All profiles maintain excellent legal document readability while optimizing for their specific use cases.
