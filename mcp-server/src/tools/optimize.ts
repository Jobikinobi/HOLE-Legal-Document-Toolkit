/**
 * PDF Optimization Tool
 * Optimizes PDFs for maximum compression while maintaining high quality
 * Uses Ghostscript with Adobe Acrobat-equivalent settings
 *
 * Quality presets match Adobe Acrobat's optimization levels:
 * - screen: Smallest size, optimized for screen viewing (72 dpi)
 * - ebook: Balanced quality/size for digital distribution (150 dpi)
 * - printer: High quality for office printing (300 dpi)
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

const execAsync = promisify(exec);

export type OptimizationPreset = "screen" | "ebook" | "printer" | "prepress" | "default";

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
 * Build Ghostscript command for PDF optimization
 * These settings are calibrated to match Adobe Acrobat's optimization
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

  // Preset-specific settings
  const presetSettings: Record<OptimizationPreset, string[]> = {
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
    printer: [
      "-dPDFSETTINGS=/printer",
      "-dColorImageResolution=300",
      "-dGrayImageResolution=300",
      "-dMonoImageResolution=1200",
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

  // Additional optimization flags for better compression
  const optimizationFlags = [
    "-dAutoFilterColorImages=true",
    "-dAutoFilterGrayImages=true",
    "-dColorImageDownsampleType=/Bicubic",
    "-dGrayImageDownsampleType=/Bicubic",
    "-dMonoImageDownsampleType=/Subsample",
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
    ...presetSettings[preset],
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

  const dpiMap: Record<OptimizationPreset, number> = {
    screen: 72,
    ebook: 150,
    printer: 300,
    prepress: 300,
    default: 150,
  };

  return dpiMap[preset];
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
