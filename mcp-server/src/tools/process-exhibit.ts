/**
 * Full Exhibit Processing Pipeline
 * Combines split, merge, and optimize into a single workflow
 * Perfect for processing Figma exports into final legal exhibit PDFs
 */

import * as path from "path";
import * as fs from "fs/promises";
import { splitPdf } from "./split.js";
import { mergePdfs } from "./merge.js";
import { optimizePdf, OptimizationPreset } from "./optimize.js";
import { ocrPdf, checkOcrInstalled } from "./ocr.js";
import {
  ensureDir,
  getFileSize,
  formatFileSize,
  getTempPath,
} from "../utils/files.js";

interface ProcessExhibitOptions {
  inputPath: string;
  outputPath: string;
  pages?: string;
  preset?: OptimizationPreset;
  exhibitLabel?: string;
  ocr?: boolean; // Enable OCR for scanned documents
  ocrLanguage?: string; // OCR language (default: eng)
}

interface ProcessExhibitResult {
  success: boolean;
  exhibitLabel?: string;
  pipeline: {
    split?: {
      totalPages: number;
      selectedPages: number[];
    };
    merge?: {
      filesProcessed: number;
    };
    ocr?: {
      enabled: boolean;
      language: string;
      pagesProcessed: number;
    };
    optimize: {
      preset: string;
      inputSize: string;
      outputSize: string;
      savedPercentage: string;
    };
  };
  inputFile: {
    path: string;
    size: string;
  };
  outputFile: {
    path: string;
    size: string;
    pages: number;
  };
  message: string;
}

/**
 * Parse page selection string into array of page numbers
 */
function parsePageSelection(selection: string, totalPages: number): number[] {
  const pages: Set<number> = new Set();
  const parts = selection.split(",").map((s) => s.trim());

  for (const part of parts) {
    if (part.includes("-")) {
      const [start, end] = part.split("-").map((s) => s.trim());
      const startPage = start ? parseInt(start, 10) : 1;
      const endPage = end ? parseInt(end, 10) : totalPages;

      for (let i = startPage; i <= Math.min(endPage, totalPages); i++) {
        if (i >= 1) pages.add(i);
      }
    } else {
      const page = parseInt(part, 10);
      if (page >= 1 && page <= totalPages) {
        pages.add(page);
      }
    }
  }

  return Array.from(pages).sort((a, b) => a - b);
}

/**
 * Process a Figma-exported PDF into a final legal exhibit
 *
 * Pipeline:
 * 1. If pages specified: Split PDF and extract selected pages
 * 2. Merge selected pages (if multiple)
 * 3. If OCR enabled: Add searchable text layer (for scanned documents)
 * 4. Optimize for maximum compression with high quality
 */
export async function processExhibit(
  options: ProcessExhibitOptions
): Promise<ProcessExhibitResult> {
  const {
    inputPath,
    outputPath,
    pages,
    preset = "printer",
    exhibitLabel,
    ocr = false,
    ocrLanguage = "eng",
  } = options;

  // Create temp directory for intermediate files
  const tempDir = path.join(process.cwd(), "temp", `exhibit_${Date.now()}`);
  await ensureDir(tempDir);

  // Ensure output directory exists
  await ensureDir(path.dirname(outputPath));

  // Get input file info
  const inputSizeBytes = await getFileSize(inputPath);

  const pipelineResult: ProcessExhibitResult["pipeline"] = {
    optimize: {
      preset,
      inputSize: "",
      outputSize: "",
      savedPercentage: "",
    },
  };

  let currentInputPath = inputPath;
  let selectedPageNumbers: number[] = [];

  try {
    // Step 1: Split if page selection is specified
    if (pages) {
      const splitResult = await splitPdf({
        inputPath,
        outputDir: tempDir,
        prefix: "page",
        pageRange: pages,
      });

      selectedPageNumbers = splitResult.outputFiles.map((f) => f.page);

      pipelineResult.split = {
        totalPages: splitResult.totalPages,
        selectedPages: selectedPageNumbers,
      };

      // Step 2: Merge if multiple pages were selected
      if (splitResult.outputFiles.length > 1) {
        const mergedPath = path.join(tempDir, "merged.pdf");
        await mergePdfs({
          inputPaths: splitResult.outputFiles.map((f) => f.path),
          outputPath: mergedPath,
        });

        currentInputPath = mergedPath;
        pipelineResult.merge = {
          filesProcessed: splitResult.outputFiles.length,
        };
      } else if (splitResult.outputFiles.length === 1) {
        currentInputPath = splitResult.outputFiles[0].path;
      }
    }

    // Step 3: OCR if enabled (for scanned documents)
    if (ocr) {
      const ocrCheck = await checkOcrInstalled();
      if (!ocrCheck.installed) {
        throw new Error(
          "OCR requested but ocrmypdf is not installed. Install with: brew install ocrmypdf"
        );
      }

      const ocrOutputPath = path.join(tempDir, "ocr_output.pdf");
      const ocrResult = await ocrPdf({
        inputPath: currentInputPath,
        outputPath: ocrOutputPath,
        language: ocrLanguage,
        deskew: true,
        rotate: true,
        skipText: true,
        outputType: "pdfa-2",
        optimize: 1,
      });

      currentInputPath = ocrOutputPath;
      pipelineResult.ocr = {
        enabled: true,
        language: ocrLanguage,
        pagesProcessed: ocrResult.ocr.pagesProcessed,
      };
    }

    // Step 4: Optimize the final PDF
    const optimizeResult = await optimizePdf({
      inputPath: currentInputPath,
      outputPath,
      preset,
    });

    pipelineResult.optimize = {
      preset,
      inputSize: optimizeResult.inputFile.size,
      outputSize: optimizeResult.outputFile.size,
      savedPercentage: optimizeResult.compression.savedPercentage,
    };

    // Build success message
    let message = `Successfully processed ${path.basename(inputPath)}`;
    if (exhibitLabel) {
      message = `${exhibitLabel}: ${message}`;
    }
    message += ` → ${formatFileSize(inputSizeBytes)} to ${optimizeResult.outputFile.size}`;

    if (selectedPageNumbers.length > 0) {
      message += ` (pages: ${selectedPageNumbers.join(", ")})`;
    }

    return {
      success: true,
      exhibitLabel,
      pipeline: pipelineResult,
      inputFile: {
        path: inputPath,
        size: formatFileSize(inputSizeBytes),
      },
      outputFile: {
        path: outputPath,
        size: optimizeResult.outputFile.size,
        pages: optimizeResult.outputFile.pages,
      },
      message,
    };
  } finally {
    // Clean up temp directory
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  }
}

/**
 * Batch process multiple exhibits
 */
export async function processExhibitBatch(
  exhibits: Array<{
    inputPath: string;
    outputPath: string;
    pages?: string;
    label?: string;
  }>,
  preset: OptimizationPreset = "printer"
): Promise<{
  success: boolean;
  results: ProcessExhibitResult[];
  summary: {
    total: number;
    succeeded: number;
    failed: number;
    totalInputSize: string;
    totalOutputSize: string;
    totalSaved: string;
  };
}> {
  const results: ProcessExhibitResult[] = [];
  let totalInputBytes = 0;
  let totalOutputBytes = 0;
  let succeeded = 0;
  let failed = 0;

  for (const exhibit of exhibits) {
    try {
      const result = await processExhibit({
        inputPath: exhibit.inputPath,
        outputPath: exhibit.outputPath,
        pages: exhibit.pages,
        preset,
        exhibitLabel: exhibit.label,
      });

      results.push(result);
      totalInputBytes += await getFileSize(exhibit.inputPath);
      totalOutputBytes += await getFileSize(exhibit.outputPath);
      succeeded++;
    } catch (error) {
      failed++;
      results.push({
        success: false,
        pipeline: {
          optimize: {
            preset,
            inputSize: "N/A",
            outputSize: "N/A",
            savedPercentage: "N/A",
          },
        },
        inputFile: {
          path: exhibit.inputPath,
          size: "N/A",
        },
        outputFile: {
          path: exhibit.outputPath,
          size: "N/A",
          pages: 0,
        },
        message: `Failed: ${error instanceof Error ? error.message : String(error)}`,
      });
    }
  }

  const savedBytes = totalInputBytes - totalOutputBytes;
  const savedPercentage =
    totalInputBytes > 0 ? ((savedBytes / totalInputBytes) * 100).toFixed(1) : "0";

  return {
    success: failed === 0,
    results,
    summary: {
      total: exhibits.length,
      succeeded,
      failed,
      totalInputSize: formatFileSize(totalInputBytes),
      totalOutputSize: formatFileSize(totalOutputBytes),
      totalSaved: `${savedPercentage}%`,
    },
  };
}
