/**
 * PDF Compression Profiles for Legal Documents
 *
 * Custom compression profiles optimized for legal document quality
 * Includes 300 DPI profiles (professional quality) and 225 DPI profiles (digital-first, cost-optimized)
 */

export type CompressionProfileName =
  // 300 DPI Profiles (Professional Quality)
  | "printer"           // Current default (300 DPI)
  | "legal-jpeg"        // JPEG-based high compression (300 DPI)
  | "legal-balanced"    // Hybrid approach JPEG + LZW (300 DPI)
  | "legal-text"        // Text-optimized with LZW (300 DPI)
  | "legal-aggressive"  // Maximum compression (300 DPI, minor quality loss)
  | "legal-archive"     // Archival quality (300 DPI)
  // 225 DPI Profiles (Digital-First, Cost-Optimized)
  | "legal-jpeg-225"        // JPEG-based high compression (225 DPI)
  | "legal-balanced-225"    // Hybrid approach JPEG + LZW (225 DPI)
  | "legal-text-225"        // Text-optimized with LZW (225 DPI)
  | "legal-aggressive-225"  // Maximum compression (225 DPI)
  | "legal-archive-225";    // Archival quality (225 DPI)

export interface CompressionProfile {
  name: CompressionProfileName;
  description: string;
  dpi: {
    color: number;
    gray: number;
    mono: number;
  };
  colorImageFilter: "DCTEncode" | "LZWEncode" | "FlateDecode";
  grayImageFilter: "DCTEncode" | "LZWEncode" | "FlateDecode";
  monoImageDownsample: "Bicubic" | "Average" | "Subsample";
  jpegQuality?: number; // 0-100, only for DCTEncode
  downsampling: "Bicubic" | "Average" | "Subsample";
  estimatedCompression: string; // Expected size reduction
  bestFor: string;
  considerGhostscriptFlags: string[];
}

/**
 * Profile 1: Current Printer Profile (Reference)
 * Safe, balanced, proven compression
 */
export const PRINTER_PROFILE: CompressionProfile = {
  name: "printer",
  description: "Original printer preset - balanced quality and compression",
  dpi: {
    color: 300,
    gray: 300,
    mono: 1200,
  },
  colorImageFilter: "FlateDecode",
  grayImageFilter: "FlateDecode",
  monoImageDownsample: "Subsample",
  downsampling: "Bicubic",
  estimatedCompression: "30-50%",
  bestFor: "Mixed content, safe default",
  considerGhostscriptFlags: [
    "-dPDFSETTINGS=/printer",
    "-dColorImageResolution=300",
    "-dGrayImageResolution=300",
    "-dMonoImageResolution=1200",
    "-dAutoFilterColorImages=true",
    "-dAutoFilterGrayImages=true",
    "-dColorImageDownsampleType=/Bicubic",
    "-dGrayImageDownsampleType=/Bicubic",
    "-dMonoImageDownsampleType=/Subsample",
  ],
};

/**
 * Profile 2: Legal JPEG (RECOMMENDED)
 * High compression using JPEG for color/grayscale images
 * Ideal for scanned legal documents
 */
export const LEGAL_JPEG_PROFILE: CompressionProfile = {
  name: "legal-jpeg",
  description:
    "JPEG compression for color/grayscale images at 300 DPI - excellent for scanned documents",
  dpi: {
    color: 300,
    gray: 300,
    mono: 1200,
  },
  colorImageFilter: "DCTEncode", // JPEG
  grayImageFilter: "DCTEncode", // JPEG
  monoImageDownsample: "Bicubic",
  jpegQuality: 90, // Imperceptible loss
  downsampling: "Bicubic",
  estimatedCompression: "70-85%",
  bestFor: "Scanned legal documents, color photos, high-volume processing",
  considerGhostscriptFlags: [
    "-dPDFSETTINGS=/printer",
    "-dColorImageResolution=300",
    "-dGrayImageResolution=300",
    "-dMonoImageResolution=1200",
    "-dEncodeColorImages=true",
    "-dColorImageFilter=/DCTEncode",
    "-dAutoFilterColorImages=false",
    "-dJPEGQ=90",
    "-dGrayImageFilter=/DCTEncode",
    "-dAutoFilterGrayImages=false",
    "-dColorImageDownsampleType=/Bicubic",
    "-dGrayImageDownsampleType=/Bicubic",
    "-dMonoImageDownsampleType=/Bicubic",
    "-dJPEGXResolution=300",
    "-dJPEGYResolution=300",
  ],
};

/**
 * Profile 3: Legal Balanced (HYBRID)
 * Uses JPEG for color, LZW for grayscale for balanced results
 * Smart compression without aggressive quality loss
 */
export const LEGAL_BALANCED_PROFILE: CompressionProfile = {
  name: "legal-balanced",
  description:
    "Hybrid compression: JPEG for color images, LZW for grayscale - balanced quality/compression",
  dpi: {
    color: 300,
    gray: 300,
    mono: 1200,
  },
  colorImageFilter: "DCTEncode", // JPEG for color
  grayImageFilter: "LZWEncode", // LZW for grayscale (better for mixed content)
  monoImageDownsample: "Bicubic",
  jpegQuality: 92, // Very high quality for color
  downsampling: "Bicubic",
  estimatedCompression: "60-75%",
  bestFor: "Mixed content (text + color images), professional documents",
  considerGhostscriptFlags: [
    "-dPDFSETTINGS=/printer",
    "-dColorImageResolution=300",
    "-dGrayImageResolution=300",
    "-dMonoImageResolution=1200",
    "-dEncodeColorImages=true",
    "-dColorImageFilter=/DCTEncode",
    "-dAutoFilterColorImages=false",
    "-dJPEGQ=92",
    "-dGrayImageFilter=/LZWEncode",
    "-dAutoFilterGrayImages=false",
    "-dColorImageDownsampleType=/Bicubic",
    "-dGrayImageDownsampleType=/Bicubic",
    "-dMonoImageDownsampleType=/Bicubic",
  ],
};

/**
 * Profile 4: Legal Text-Optimized
 * LZW compression optimized for text-heavy documents
 * Better for documents with minimal images
 */
export const LEGAL_TEXT_PROFILE: CompressionProfile = {
  name: "legal-text",
  description:
    "LZW compression optimized for text-heavy documents with minimal images",
  dpi: {
    color: 300,
    gray: 300,
    mono: 1200,
  },
  colorImageFilter: "LZWEncode",
  grayImageFilter: "LZWEncode",
  monoImageDownsample: "Bicubic", // Better text preservation
  downsampling: "Bicubic",
  estimatedCompression: "45-60%",
  bestFor: "Contracts, forms, text-heavy documents, signature preservation",
  considerGhostscriptFlags: [
    "-dPDFSETTINGS=/printer",
    "-dColorImageResolution=300",
    "-dGrayImageResolution=300",
    "-dMonoImageResolution=1200",
    "-dEncodeColorImages=true",
    "-dColorImageFilter=/LZWEncode",
    "-dAutoFilterColorImages=false",
    "-dGrayImageFilter=/LZWEncode",
    "-dAutoFilterGrayImages=false",
    "-dColorImageDownsampleType=/Bicubic",
    "-dGrayImageDownsampleType=/Bicubic",
    "-dMonoImageDownsampleType=/Bicubic",
    "-dSubsetFonts=true",
    "-dEmbedAllFonts=true",
    "-dCompressFonts=true",
  ],
};

/**
 * Profile 5: Legal Aggressive
 * Maximum compression with acceptable minor quality loss
 * Use when file size is critical (high-volume processing, storage)
 */
export const LEGAL_AGGRESSIVE_PROFILE: CompressionProfile = {
  name: "legal-aggressive",
  description:
    "Maximum compression with minor quality loss - for high-volume processing",
  dpi: {
    color: 300,
    gray: 300,
    mono: 1200,
  },
  colorImageFilter: "DCTEncode",
  grayImageFilter: "DCTEncode",
  monoImageDownsample: "Average", // Faster, slight quality loss
  jpegQuality: 85, // Slightly lower quality = more compression
  downsampling: "Average",
  estimatedCompression: "75-85%",
  bestFor: "Bulk archival, cloud storage, when storage cost matters",
  considerGhostscriptFlags: [
    "-dPDFSETTINGS=/printer",
    "-dColorImageResolution=300",
    "-dGrayImageResolution=300",
    "-dMonoImageResolution=1200",
    "-dEncodeColorImages=true",
    "-dColorImageFilter=/DCTEncode",
    "-dAutoFilterColorImages=false",
    "-dJPEGQ=85",
    "-dGrayImageFilter=/DCTEncode",
    "-dAutoFilterGrayImages=false",
    "-dColorImageDownsampleType=/Average",
    "-dGrayImageDownsampleType=/Average",
    "-dMonoImageDownsampleType=/Average",
    "-dDownsampleColorImages=true",
    "-dDownsampleGrayImages=true",
    "-dEncodeAsciiText=false",
  ],
};

/**
 * Profile 6: Legal Archive
 * Balanced compression with archival quality in mind
 * Suitable for long-term legal storage
 */
export const LEGAL_ARCHIVE_PROFILE: CompressionProfile = {
  name: "legal-archive",
  description:
    "Archival quality compression - balance compression with long-term preservation",
  dpi: {
    color: 300,
    gray: 300,
    mono: 1200,
  },
  colorImageFilter: "LZWEncode", // Lossless for archival
  grayImageFilter: "LZWEncode",
  monoImageDownsample: "Bicubic",
  downsampling: "Bicubic",
  estimatedCompression: "55-70%",
  bestFor:
    "Legal archival, compliance storage, documents with long retention requirements",
  considerGhostscriptFlags: [
    "-dPDFSETTINGS=/printer",
    "-dColorImageResolution=300",
    "-dGrayImageResolution=300",
    "-dMonoImageResolution=1200",
    "-dEncodeColorImages=true",
    "-dColorImageFilter=/LZWEncode",
    "-dAutoFilterColorImages=false",
    "-dGrayImageFilter=/LZWEncode",
    "-dAutoFilterGrayImages=false",
    "-dColorImageDownsampleType=/Bicubic",
    "-dGrayImageDownsampleType=/Bicubic",
    "-dMonoImageDownsampleType=/Bicubic",
    "-dPreserveHalftoneInfo=true",
    "-dPreserveOPIComments=true",
    "-dPreserveOverprintSettings=true",
    "-dCompatibilityLevel=1.7", // Ensure long-term compatibility
  ],
};

/**
 * Profile 7: Legal JPEG 225 DPI
 * High compression at 225 DPI for digital-first documents
 * 50-55% smaller than 300 DPI while maintaining excellent legibility
 */
export const LEGAL_JPEG_225_PROFILE: CompressionProfile = {
  name: "legal-jpeg-225",
  description:
    "JPEG compression at 225 DPI - excellent for digital archival with space savings",
  dpi: {
    color: 225,
    gray: 225,
    mono: 900,
  },
  colorImageFilter: "DCTEncode",
  grayImageFilter: "DCTEncode",
  monoImageDownsample: "Bicubic",
  jpegQuality: 90,
  downsampling: "Bicubic",
  estimatedCompression: "80-90%",
  bestFor: "Digital archival, cloud storage, scanned documents for digital consumption",
  considerGhostscriptFlags: [
    "-dPDFSETTINGS=/printer",
    "-dColorImageResolution=225",
    "-dGrayImageResolution=225",
    "-dMonoImageResolution=900",
    "-dEncodeColorImages=true",
    "-dColorImageFilter=/DCTEncode",
    "-dAutoFilterColorImages=false",
    "-dJPEGQ=90",
    "-dGrayImageFilter=/DCTEncode",
    "-dAutoFilterGrayImages=false",
    "-dColorImageDownsampleType=/Bicubic",
    "-dGrayImageDownsampleType=/Bicubic",
    "-dMonoImageDownsampleType=/Bicubic",
    "-dJPEGXResolution=225",
    "-dJPEGYResolution=225",
  ],
};

/**
 * Profile 8: Legal Balanced 225 DPI
 * Hybrid compression at 225 DPI with JPEG for color and LZW for grayscale
 */
export const LEGAL_BALANCED_225_PROFILE: CompressionProfile = {
  name: "legal-balanced-225",
  description:
    "Hybrid compression at 225 DPI: JPEG for color, LZW for grayscale - digital-first documents",
  dpi: {
    color: 225,
    gray: 225,
    mono: 900,
  },
  colorImageFilter: "DCTEncode",
  grayImageFilter: "LZWEncode",
  monoImageDownsample: "Bicubic",
  jpegQuality: 92,
  downsampling: "Bicubic",
  estimatedCompression: "70-80%",
  bestFor: "Digital-first mixed content, professional documents without print requirements",
  considerGhostscriptFlags: [
    "-dPDFSETTINGS=/printer",
    "-dColorImageResolution=225",
    "-dGrayImageResolution=225",
    "-dMonoImageResolution=900",
    "-dEncodeColorImages=true",
    "-dColorImageFilter=/DCTEncode",
    "-dAutoFilterColorImages=false",
    "-dJPEGQ=92",
    "-dGrayImageFilter=/LZWEncode",
    "-dAutoFilterGrayImages=false",
    "-dColorImageDownsampleType=/Bicubic",
    "-dGrayImageDownsampleType=/Bicubic",
    "-dMonoImageDownsampleType=/Bicubic",
  ],
};

/**
 * Profile 9: Legal Text 225 DPI
 * LZW compression at 225 DPI optimized for text-heavy documents
 */
export const LEGAL_TEXT_225_PROFILE: CompressionProfile = {
  name: "legal-text-225",
  description: "LZW compression at 225 DPI for text-heavy documents and e-signatures",
  dpi: {
    color: 225,
    gray: 225,
    mono: 900,
  },
  colorImageFilter: "LZWEncode",
  grayImageFilter: "LZWEncode",
  monoImageDownsample: "Bicubic",
  downsampling: "Bicubic",
  estimatedCompression: "55-65%",
  bestFor: "Digital contracts, e-signatures, forms (225 DPI acceptable)",
  considerGhostscriptFlags: [
    "-dPDFSETTINGS=/printer",
    "-dColorImageResolution=225",
    "-dGrayImageResolution=225",
    "-dMonoImageResolution=900",
    "-dEncodeColorImages=true",
    "-dColorImageFilter=/LZWEncode",
    "-dAutoFilterColorImages=false",
    "-dGrayImageFilter=/LZWEncode",
    "-dAutoFilterGrayImages=false",
    "-dColorImageDownsampleType=/Bicubic",
    "-dGrayImageDownsampleType=/Bicubic",
    "-dMonoImageDownsampleType=/Bicubic",
    "-dSubsetFonts=true",
    "-dEmbedAllFonts=true",
    "-dCompressFonts=true",
  ],
};

/**
 * Profile 10: Legal Aggressive 225 DPI
 * Maximum compression at 225 DPI for bulk processing and cost-sensitive archival
 */
export const LEGAL_AGGRESSIVE_225_PROFILE: CompressionProfile = {
  name: "legal-aggressive-225",
  description:
    "Maximum compression at 225 DPI with minor quality loss - bulk processing and cost-sensitive scenarios",
  dpi: {
    color: 225,
    gray: 225,
    mono: 900,
  },
  colorImageFilter: "DCTEncode",
  grayImageFilter: "DCTEncode",
  monoImageDownsample: "Average",
  jpegQuality: 85,
  downsampling: "Average",
  estimatedCompression: "85-92%",
  bestFor: "Bulk archival, cloud storage cost optimization, high-volume processing",
  considerGhostscriptFlags: [
    "-dPDFSETTINGS=/printer",
    "-dColorImageResolution=225",
    "-dGrayImageResolution=225",
    "-dMonoImageResolution=900",
    "-dEncodeColorImages=true",
    "-dColorImageFilter=/DCTEncode",
    "-dAutoFilterColorImages=false",
    "-dJPEGQ=85",
    "-dGrayImageFilter=/DCTEncode",
    "-dAutoFilterGrayImages=false",
    "-dColorImageDownsampleType=/Average",
    "-dGrayImageDownsampleType=/Average",
    "-dMonoImageDownsampleType=/Average",
    "-dDownsampleColorImages=true",
    "-dDownsampleGrayImages=true",
    "-dEncodeAsciiText=false",
  ],
};

/**
 * Profile 11: Legal Archive 225 DPI
 * Archival-quality lossless compression at 225 DPI
 */
export const LEGAL_ARCHIVE_225_PROFILE: CompressionProfile = {
  name: "legal-archive-225",
  description: "Archival lossless compression at 225 DPI - long-term digital storage",
  dpi: {
    color: 225,
    gray: 225,
    mono: 900,
  },
  colorImageFilter: "LZWEncode",
  grayImageFilter: "LZWEncode",
  monoImageDownsample: "Bicubic",
  downsampling: "Bicubic",
  estimatedCompression: "65-75%",
  bestFor: "Digital legal archival, compliance storage at 225 DPI",
  considerGhostscriptFlags: [
    "-dPDFSETTINGS=/printer",
    "-dColorImageResolution=225",
    "-dGrayImageResolution=225",
    "-dMonoImageResolution=900",
    "-dEncodeColorImages=true",
    "-dColorImageFilter=/LZWEncode",
    "-dAutoFilterColorImages=false",
    "-dGrayImageFilter=/LZWEncode",
    "-dAutoFilterGrayImages=false",
    "-dColorImageDownsampleType=/Bicubic",
    "-dGrayImageDownsampleType=/Bicubic",
    "-dMonoImageDownsampleType=/Bicubic",
    "-dPreserveHalftoneInfo=true",
    "-dPreserveOPIComments=true",
    "-dPreserveOverprintSettings=true",
    "-dCompatibilityLevel=1.7",
  ],
};

/**
 * Get profile by name
 */
export function getProfile(name: CompressionProfileName): CompressionProfile {
  const profiles: Record<CompressionProfileName, CompressionProfile> = {
    // 300 DPI Profiles
    printer: PRINTER_PROFILE,
    "legal-jpeg": LEGAL_JPEG_PROFILE,
    "legal-balanced": LEGAL_BALANCED_PROFILE,
    "legal-text": LEGAL_TEXT_PROFILE,
    "legal-aggressive": LEGAL_AGGRESSIVE_PROFILE,
    "legal-archive": LEGAL_ARCHIVE_PROFILE,
    // 225 DPI Profiles
    "legal-jpeg-225": LEGAL_JPEG_225_PROFILE,
    "legal-balanced-225": LEGAL_BALANCED_225_PROFILE,
    "legal-text-225": LEGAL_TEXT_225_PROFILE,
    "legal-aggressive-225": LEGAL_AGGRESSIVE_225_PROFILE,
    "legal-archive-225": LEGAL_ARCHIVE_225_PROFILE,
  };

  return profiles[name];
}

/**
 * Get all available profiles
 */
export function getAllProfiles(): CompressionProfile[] {
  return [
    // 300 DPI Profiles (Professional Quality)
    PRINTER_PROFILE,
    LEGAL_JPEG_PROFILE,
    LEGAL_BALANCED_PROFILE,
    LEGAL_TEXT_PROFILE,
    LEGAL_AGGRESSIVE_PROFILE,
    LEGAL_ARCHIVE_PROFILE,
    // 225 DPI Profiles (Digital-First, Cost-Optimized)
    LEGAL_JPEG_225_PROFILE,
    LEGAL_BALANCED_225_PROFILE,
    LEGAL_TEXT_225_PROFILE,
    LEGAL_AGGRESSIVE_225_PROFILE,
    LEGAL_ARCHIVE_225_PROFILE,
  ];
}

/**
 * Get profile recommendations based on document characteristics
 */
export function recommendProfile(documentType: string): CompressionProfileName {
  const type = documentType.toLowerCase();

  if (type.includes("scan")) return "legal-jpeg"; // Scanned documents
  if (type.includes("photo")) return "legal-jpeg"; // Photography
  if (type.includes("contract")) return "legal-text"; // Text-heavy
  if (type.includes("form")) return "legal-text"; // Forms
  if (type.includes("archive") || type.includes("archiv")) return "legal-archive"; // Archival storage
  if (type.includes("high-volume") || type.includes("bulk"))
    return "legal-aggressive"; // Bulk processing

  return "legal-balanced"; // Default for mixed content
}

/**
 * Compare compression profiles
 */
export function compareProfiles(): {
  name: string;
  compression: string;
  quality: string;
  bestFor: string;
}[] {
  return [
    // 300 DPI Profiles (Professional Quality)
    {
      name: "printer",
      compression: "30-50%",
      quality: "High",
      bestFor: "Mixed content, safe default",
    },
    {
      name: "legal-jpeg",
      compression: "70-85%",
      quality: "Very High",
      bestFor: "Scanned documents, color photos",
    },
    {
      name: "legal-balanced",
      compression: "60-75%",
      quality: "Very High",
      bestFor: "Mixed content (text + images)",
    },
    {
      name: "legal-text",
      compression: "45-60%",
      quality: "Excellent",
      bestFor: "Text-heavy documents",
    },
    {
      name: "legal-aggressive",
      compression: "75-85%",
      quality: "Good",
      bestFor: "High-volume, storage critical",
    },
    {
      name: "legal-archive",
      compression: "55-70%",
      quality: "Excellent",
      bestFor: "Long-term legal storage",
    },
    // 225 DPI Profiles (Digital-First, Cost-Optimized)
    {
      name: "legal-jpeg-225",
      compression: "80-90%",
      quality: "Very High",
      bestFor: "Digital scans, cloud archival (45-50% smaller than 300 DPI)",
    },
    {
      name: "legal-balanced-225",
      compression: "70-80%",
      quality: "Very High",
      bestFor: "Mixed digital content, reduced DPI (45-50% smaller than 300 DPI)",
    },
    {
      name: "legal-text-225",
      compression: "55-65%",
      quality: "Excellent",
      bestFor: "Digital contracts, text-heavy (35-40% smaller than 300 DPI)",
    },
    {
      name: "legal-aggressive-225",
      compression: "85-92%",
      quality: "Good",
      bestFor: "Maximum compression archival (50-60% smaller than 300 DPI)",
    },
    {
      name: "legal-archive-225",
      compression: "65-75%",
      quality: "Excellent",
      bestFor: "Digital archival storage (40-45% smaller than 300 DPI)",
    },
  ];
}
