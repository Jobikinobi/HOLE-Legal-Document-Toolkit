/**
 * PDF Optimization Tool
 * Optimizes PDFs for maximum compression while maintaining high quality
 * Uses Ghostscript with custom compression profiles
 *
 * Compression Profiles:
 * 300 DPI (Professional Quality):
 * - printer: Default high-quality profile (30-50% compression)
 * - legal-jpeg: JPEG compression for color/grayscale (70-85% compression)
 * - legal-balanced: Hybrid JPEG+LZW approach (60-75% compression)
 * - legal-text: LZW for text-heavy documents (45-60% compression)
 * - legal-aggressive: Aggressive JPEG quality (75-85% compression)
 * - legal-archive: LZW archival profile (55-70% compression)
 *
 * 225 DPI (Digital-First, Higher Compression):
 * - legal-jpeg-225: JPEG at 225 DPI (80-90% compression, 45-50% smaller than 300 DPI)
 * - legal-balanced-225: Hybrid at 225 DPI (70-80% compression)
 * - legal-text-225: LZW at 225 DPI (55-65% compression)
 * - legal-aggressive-225: Aggressive JPEG at 225 DPI (85-92% compression)
 * - legal-archive-225: LZW at 225 DPI (65-75% compression)
 *
 * Legacy Adobe Acrobat Presets (maintained for backward compatibility):
 * - screen: Smallest size, optimized for screen viewing (72 dpi)
 * - ebook: Balanced quality/size for digital distribution (150 dpi)
 * - prepress: Maximum quality for professional printing (300 dpi, color preservation)
 * - default: Smart optimization without aggressive downsampling
 */

import { exec } from "child_process";
import { promisify } from "util";
import * as path from "path";
import {
  ensureDir,
  getFileSize,
  formatFileSize,
  getPdfPageCount,
} from "../utils/files.js";
import {
  CompressionProfileName,
  getProfile,
} from "./compression-profiles.js";

const execAsync = promisify(exec);

export type OptimizationPreset =
  // Legacy Adobe Acrobat presets
  | "screen"
  | "ebook"
  | "prepress"
  | "default"
  // New compression profiles (300 DPI)
  | "printer"
  | "legal-jpeg"
  | "legal-balanced"
  | "legal-text"
  | "legal-aggressive"
  | "legal-archive"
  // 225 DPI compression profiles
  | "legal-jpeg-225"
  | "legal-balanced-225"
  | "legal-text-225"
  | "legal-aggressive-225"
  | "legal-archive-225";

interface OptimizeOptions {
  inputPath: string;
  outputPath: string;
  preset?: OptimizationPreset;
  dpi?: number;
  grayscale?: boolean;
}

interface OptimizeResult {
  success: boolean;
  inputFile: {
    path: string;
    size: string;
    sizeBytes: number;
  };
  outputFile: {
    path: string;
    size: string;
    sizeBytes: number;
    pages: number;
  };
  compression: {
    ratio: string;
    savedBytes: number;
    savedPercentage: string;
  };
  settings: {
    preset: string;
    dpi: number;
    grayscale: boolean;
  };
  message: string;
}

/**
 * Check if preset is a legacy Adobe Acrobat preset
 */
function isLegacyPreset(preset: OptimizationPreset): boolean {
  return ["screen", "ebook", "prepress", "default"].includes(preset);
}

/**
 * Build Ghostscript command for PDF optimization
 * Uses compression profiles for most presets, legacy settings for Adobe Acrobat compatibility
 */
function buildGhostscriptCommand(
  inputPath: string,
  outputPath: string,
  preset: OptimizationPreset,
  dpi?: number,
  grayscale?: boolean
): string {
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

  // Preset-specific settings - legacy Adobe Acrobat presets
  const legacyPresetSettings: Record<string, string[]> = {
    screen: [
      "-dPDFSETTINGS=/screen",
      "-dColorImageResolution=72",
      "-dGrayImageResolution=72",
      "-dMonoImageResolution=150",
    ],
    ebook: [
      "-dPDFSETTINGS=/ebook",
      "-dColorImageResolution=150",
      "-dGrayImageResolution=150",
      "-dMonoImageResolution=300",
    ],
    prepress: [
      "-dPDFSETTINGS=/prepress",
      "-dColorImageResolution=300",
      "-dGrayImageResolution=300",
      "-dMonoImageResolution=1200",
      "-dPreserveHalftoneInfo=true",
      "-dPreserveOPIComments=true",
      "-dPreserveOverprintSettings=true",
    ],
    default: [
      "-dPDFSETTINGS=/default",
      "-dAutoRotatePages=/None",
      "-dColorImageDownsampleType=/Bicubic",
      "-dGrayImageDownsampleType=/Bicubic",
    ],
  };

  // Get preset-specific flags
  let presetFlags: string[] = [];

  if (isLegacyPreset(preset)) {
    // Use legacy preset settings for Adobe Acrobat compatibility
    presetFlags = legacyPresetSettings[preset] || [];
  } else {
    // Use compression profile settings
    try {
      const profile = getProfile(preset as CompressionProfileName);
      presetFlags = profile.considerGhostscriptFlags;
    } catch {
      // Fallback to printer preset if profile not found
      presetFlags = legacyPresetSettings["printer"];
    }
  }

  // Additional optimization flags for better compression
  const optimizationFlags = [
    "-dAutoFilterColorImages=true",
    "-dAutoFilterGrayImages=true",
    "-dOptimize=true",
    "-dPrinted=false",
  ];

  // Override DPI if specified
  const dpiFlags: string[] = [];
  if (dpi) {
    dpiFlags.push(
      `-dColorImageResolution=${dpi}`,
      `-dGrayImageResolution=${dpi}`,
      `-dDownsampleColorImages=true`,
      `-dDownsampleGrayImages=true`
    );
  }

  // Grayscale conversion
  const grayscaleFlags: string[] = [];
  if (grayscale) {
    grayscaleFlags.push(
      "-sColorConversionStrategy=Gray",
      "-dProcessColorModel=/DeviceGray"
    );
  }

  const allFlags = [
    ...baseFlags,
    ...presetFlags,
    ...optimizationFlags,
    ...dpiFlags,
    ...grayscaleFlags,
    `-sOutputFile="${outputPath}"`,
    `"${inputPath}"`,
  ];

  return `gs ${allFlags.join(" ")}`;
}

/**
 * Get DPI value for preset
 */
function getPresetDpi(preset: OptimizationPreset, customDpi?: number): number {
  if (customDpi) return customDpi;

  // Legacy Adobe Acrobat presets
  const legacyDpiMap: Record<string, number> = {
    screen: 72,
    ebook: 150,
    prepress: 300,
    default: 150,
  };

  // Compression profile DPI mapping
  const profileDpiMap: Record<string, number> = {
    printer: 300,
    "legal-jpeg": 300,
    "legal-balanced": 300,
    "legal-text": 300,
    "legal-aggressive": 300,
    "legal-archive": 300,
    "legal-jpeg-225": 225,
    "legal-balanced-225": 225,
    "legal-text-225": 225,
    "legal-aggressive-225": 225,
    "legal-archive-225": 225,
  };

  return profileDpiMap[preset] || legacyDpiMap[preset] || 150;
}

/**
 * Optimize a PDF using Ghostscript
 */
export async function optimizePdf(options: OptimizeOptions): Promise<OptimizeResult> {
  const {
    inputPath,
    outputPath,
    preset = "printer",
    dpi,
    grayscale = false,
  } = options;

  // Ensure output directory exists
  await ensureDir(path.dirname(outputPath));

  // Get input file info
  const inputSizeBytes = await getFileSize(inputPath);

  // Build and execute Ghostscript command
  const cmd = buildGhostscriptCommand(inputPath, outputPath, preset, dpi, grayscale);

  try {
    await execAsync(cmd, { maxBuffer: 50 * 1024 * 1024 }); // 50MB buffer for large PDFs
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);

    // Check if it's just a warning (Ghostscript often outputs warnings to stderr)
    try {
      await getFileSize(outputPath);
      // File exists, so optimization succeeded despite warnings
    } catch {
      throw new Error(`PDF optimization failed: ${errorMsg}`);
    }
  }

  // Get output file info
  const outputSizeBytes = await getFileSize(outputPath);
  const outputPages = await getPdfPageCount(outputPath);

  // Calculate compression stats
  const savedBytes = inputSizeBytes - outputSizeBytes;
  const savedPercentage = ((savedBytes / inputSizeBytes) * 100).toFixed(1);
  const compressionRatio = (inputSizeBytes / outputSizeBytes).toFixed(2);

  const effectiveDpi = getPresetDpi(preset, dpi);

  return {
    success: true,
    inputFile: {
      path: inputPath,
      size: formatFileSize(inputSizeBytes),
      sizeBytes: inputSizeBytes,
    },
    outputFile: {
      path: outputPath,
      size: formatFileSize(outputSizeBytes),
      sizeBytes: outputSizeBytes,
      pages: outputPages,
    },
    compression: {
      ratio: `${compressionRatio}:1`,
      savedBytes,
      savedPercentage: `${savedPercentage}%`,
    },
    settings: {
      preset,
      dpi: effectiveDpi,
      grayscale,
    },
    message: savedBytes > 0
      ? `Optimized ${path.basename(inputPath)}: ${formatFileSize(inputSizeBytes)} → ${formatFileSize(outputSizeBytes)} (${savedPercentage}% smaller)`
      : `Optimized ${path.basename(inputPath)}: File was already well-optimized`,
  };
}

/**
 * Optimize with QPDF as a fallback/alternative
 * QPDF optimization is faster but less aggressive than Ghostscript
 */
export async function optimizeWithQpdf(
  inputPath: string,
  outputPath: string
): Promise<void> {
  const cmd = `qpdf --compress-streams=y --object-streams=generate --optimize-images "${inputPath}" "${outputPath}"`;
  await execAsync(cmd);
}
