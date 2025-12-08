/**
 * OCR Tool for Legal Documents
 * Adds searchable text layer to scanned PDFs using ocrmypdf + Tesseract
 *
 * Features:
 * - Preserves original document appearance
 * - Adds invisible text layer for search/copy
 * - Creates PDF/A compliant documents (legal archiving)
 * - Multi-language support
 * - Handles mixed scanned/digital documents
 */

import { exec } from "child_process";
import { promisify } from "util";
import * as path from "path";
import {
  ensureDir,
  getFileSize,
  formatFileSize,
  getPdfPageCount,
  fileExists,
} from "../utils/files.js";

const execAsync = promisify(exec);

export type OcrOutputType = "pdf" | "pdfa" | "pdfa-1" | "pdfa-2" | "pdfa-3";
export type OcrOptimizeLevel = 0 | 1 | 2 | 3;

interface OcrOptions {
  inputPath: string;
  outputPath: string;
  language?: string; // e.g., "eng", "eng+spa", "eng+fra"
  deskew?: boolean; // Fix tilted scans
  clean?: boolean; // Clean up scan artifacts
  rotate?: boolean; // Auto-rotate pages
  removeBackground?: boolean; // Remove background for cleaner OCR
  forceOcr?: boolean; // OCR even if text layer exists
  skipText?: boolean; // Skip pages that already have text
  outputType?: OcrOutputType; // PDF/A version for archiving
  optimize?: OcrOptimizeLevel; // 0=off, 1=lossless, 2=lossy, 3=aggressive
  jobs?: number; // Parallel processing threads
}

interface OcrResult {
  success: boolean;
  inputFile: {
    path: string;
    size: string;
    pages: number;
  };
  outputFile: {
    path: string;
    size: string;
    pages: number;
  };
  ocr: {
    language: string;
    pagesProcessed: number;
    outputType: string;
    textExtracted: boolean;
  };
  processing: {
    deskew: boolean;
    clean: boolean;
    rotate: boolean;
    optimize: number;
  };
  message: string;
}

/**
 * Check if ocrmypdf is installed
 */
export async function checkOcrInstalled(): Promise<{
  installed: boolean;
  version?: string;
  languages?: string[];
}> {
  try {
    const { stdout: versionOutput } = await execAsync("ocrmypdf --version");
    const version = versionOutput.trim();

    // Get available languages
    const { stdout: langOutput } = await execAsync(
      "tesseract --list-langs 2>&1 || true"
    );
    const languages = langOutput
      .split("\n")
      .slice(1) // Skip header line
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    return { installed: true, version, languages };
  } catch {
    return { installed: false };
  }
}

/**
 * Build ocrmypdf command with options
 */
function buildOcrCommand(options: OcrOptions): string {
  const {
    inputPath,
    outputPath,
    language = "eng",
    deskew = true,
    clean = false,
    rotate = true,
    removeBackground = false,
    forceOcr = false,
    skipText = true,
    outputType = "pdfa-2",
    optimize = 1,
    jobs,
  } = options;

  const args: string[] = ["ocrmypdf"];

  // Language
  args.push(`--language ${language}`);

  // Output type (PDF/A for legal archiving)
  args.push(`--output-type ${outputType}`);

  // Optimization level
  args.push(`--optimize ${optimize}`);

  // Image preprocessing
  if (deskew) args.push("--deskew");
  if (clean) args.push("--clean");
  if (rotate) args.push("--rotate-pages");
  if (removeBackground) args.push("--remove-background");

  // OCR behavior
  if (forceOcr) {
    args.push("--force-ocr");
  } else if (skipText) {
    args.push("--skip-text");
  }

  // Parallel processing
  if (jobs) {
    args.push(`--jobs ${jobs}`);
  }

  // Keep original metadata
  args.push("--keep-temporary-files");

  // Input and output
  args.push(`"${inputPath}"`);
  args.push(`"${outputPath}"`);

  return args.join(" ");
}

/**
 * Perform OCR on a PDF, adding searchable text layer
 */
export async function ocrPdf(options: OcrOptions): Promise<OcrResult> {
  const { inputPath, outputPath, language = "eng" } = options;

  // Ensure output directory exists
  await ensureDir(path.dirname(outputPath));

  // Check if ocrmypdf is installed
  const ocrCheck = await checkOcrInstalled();
  if (!ocrCheck.installed) {
    throw new Error(
      "ocrmypdf is not installed. Install with: brew install ocrmypdf"
    );
  }

  // Get input file info
  const inputSizeBytes = await getFileSize(inputPath);
  const inputPages = await getPdfPageCount(inputPath);

  // Build and execute command
  const cmd = buildOcrCommand(options);

  try {
    await execAsync(cmd, {
      maxBuffer: 100 * 1024 * 1024, // 100MB buffer for large PDFs
      timeout: 600000, // 10 minute timeout
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);

    // Check if output was created despite warnings
    if (await fileExists(outputPath)) {
      // OCR succeeded with warnings
    } else {
      throw new Error(`OCR failed: ${errorMsg}`);
    }
  }

  // Get output file info
  const outputSizeBytes = await getFileSize(outputPath);
  const outputPages = await getPdfPageCount(outputPath);

  return {
    success: true,
    inputFile: {
      path: inputPath,
      size: formatFileSize(inputSizeBytes),
      pages: inputPages,
    },
    outputFile: {
      path: outputPath,
      size: formatFileSize(outputSizeBytes),
      pages: outputPages,
    },
    ocr: {
      language,
      pagesProcessed: outputPages,
      outputType: options.outputType || "pdfa-2",
      textExtracted: true,
    },
    processing: {
      deskew: options.deskew !== false,
      clean: options.clean || false,
      rotate: options.rotate !== false,
      optimize: options.optimize || 1,
    },
    message: `OCR completed: ${path.basename(inputPath)} → ${outputPages} pages processed, searchable text layer added`,
  };
}

/**
 * OCR with optimization - combines OCR and Ghostscript optimization
 * Best for scanned legal documents that need both searchability and compression
 */
export async function ocrAndOptimize(options: {
  inputPath: string;
  outputPath: string;
  language?: string;
  preset?: "screen" | "ebook" | "printer" | "prepress";
}): Promise<OcrResult & { optimization: { savedPercentage: string } }> {
  const { inputPath, outputPath, language = "eng", preset = "printer" } = options;

  // Map preset to ocrmypdf optimize level
  const optimizeLevel: OcrOptimizeLevel =
    preset === "screen" ? 3 : preset === "ebook" ? 2 : preset === "printer" ? 1 : 0;

  // Run OCR with optimization
  const result = await ocrPdf({
    inputPath,
    outputPath,
    language,
    optimize: optimizeLevel,
    outputType: "pdfa-2", // Legal archiving standard
    deskew: true,
    rotate: true,
    skipText: true,
  });

  // Calculate savings
  const inputSize = await getFileSize(inputPath);
  const outputSize = await getFileSize(outputPath);
  const savedPercentage =
    inputSize > outputSize
      ? (((inputSize - outputSize) / inputSize) * 100).toFixed(1)
      : "0";

  return {
    ...result,
    optimization: {
      savedPercentage: `${savedPercentage}%`,
    },
  };
}

/**
 * Extract text from a PDF (for analysis or indexing)
 */
export async function extractText(inputPath: string): Promise<string> {
  try {
    // Use pdftotext from poppler if available
    const { stdout } = await execAsync(`pdftotext "${inputPath}" -`);
    return stdout;
  } catch {
    // Fallback: try to extract with ocrmypdf sidecar
    const tempPath = `/tmp/ocr_extract_${Date.now()}.txt`;
    try {
      await execAsync(
        `ocrmypdf --sidecar "${tempPath}" --skip-text "${inputPath}" /dev/null 2>/dev/null || true`
      );
      const fs = await import("fs/promises");
      const text = await fs.readFile(tempPath, "utf-8");
      await fs.unlink(tempPath).catch(() => {});
      return text;
    } catch {
      throw new Error("Could not extract text from PDF");
    }
  }
}
