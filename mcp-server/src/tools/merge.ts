/**
 * PDF Merging Tool
 * Merges multiple PDFs into a single document
 * Uses qpdf for high-quality, fast merging
 */

import { exec } from "child_process";
import { promisify } from "util";
import * as path from "path";
import * as fs from "fs/promises";
import {
  ensureDir,
  getFileSize,
  formatFileSize,
  getPdfPageCount,
} from "../utils/files.js";
import { glob } from "../utils/glob.js";

const execAsync = promisify(exec);

interface MergeOptions {
  inputPaths?: string[];
  outputPath: string;
  inputDir?: string;
  pattern?: string;
}

interface MergeResult {
  success: boolean;
  inputFiles: Array<{
    path: string;
    pages: number;
    size: string;
  }>;
  outputFile: {
    path: string;
    pages: number;
    size: string;
  };
  totalInputSize: string;
  message: string;
}

/**
 * Natural sort for filenames (handles numbers correctly)
 * e.g., page_1.pdf, page_2.pdf, page_10.pdf
 */
function naturalSort(a: string, b: string): number {
  const aName = path.basename(a);
  const bName = path.basename(b);

  // Extract numbers from filenames
  const aMatch = aName.match(/(\d+)/g);
  const bMatch = bName.match(/(\d+)/g);

  if (aMatch && bMatch) {
    // Compare first number found
    const aNum = parseInt(aMatch[0], 10);
    const bNum = parseInt(bMatch[0], 10);
    if (aNum !== bNum) return aNum - bNum;
  }

  // Fall back to alphabetical
  return aName.localeCompare(bName);
}

/**
 * Merge multiple PDFs into one using qpdf
 */
export async function mergePdfs(options: MergeOptions): Promise<MergeResult> {
  const { outputPath, pattern = "*.pdf" } = options;
  let inputPaths = options.inputPaths || [];

  // If inputDir is provided, find all matching PDFs
  if (options.inputDir) {
    const files = await glob(pattern, {
      cwd: options.inputDir,
      absolute: true,
    });
    inputPaths = files.sort(naturalSort);
  }

  if (inputPaths.length === 0) {
    throw new Error("No input PDF files provided or found");
  }

  if (inputPaths.length === 1) {
    throw new Error("Need at least 2 PDFs to merge");
  }

  // Ensure output directory exists
  await ensureDir(path.dirname(outputPath));

  // Gather info about input files
  const inputFiles: Array<{ path: string; pages: number; size: string; sizeBytes: number }> = [];
  let totalInputBytes = 0;

  for (const filePath of inputPaths) {
    const pages = await getPdfPageCount(filePath);
    const sizeBytes = await getFileSize(filePath);
    totalInputBytes += sizeBytes;

    inputFiles.push({
      path: filePath,
      pages,
      size: formatFileSize(sizeBytes),
      sizeBytes,
    });
  }

  // Build qpdf merge command
  // qpdf --empty --pages input1.pdf input2.pdf ... -- output.pdf
  const quotedInputs = inputPaths.map((p) => `"${p}"`).join(" ");
  const cmd = `qpdf --empty --pages ${quotedInputs} -- "${outputPath}"`;

  try {
    await execAsync(cmd);
  } catch (error) {
    throw new Error(
      `Failed to merge PDFs: ${error instanceof Error ? error.message : String(error)}`
    );
  }

  // Get output file info
  const outputPages = await getPdfPageCount(outputPath);
  const outputSizeBytes = await getFileSize(outputPath);

  return {
    success: true,
    inputFiles: inputFiles.map(({ sizeBytes, ...rest }) => rest),
    outputFile: {
      path: outputPath,
      pages: outputPages,
      size: formatFileSize(outputSizeBytes),
    },
    totalInputSize: formatFileSize(totalInputBytes),
    message: `Successfully merged ${inputFiles.length} files (${inputFiles.reduce((sum, f) => sum + f.pages, 0)} pages) into ${path.basename(outputPath)}`,
  };
}
