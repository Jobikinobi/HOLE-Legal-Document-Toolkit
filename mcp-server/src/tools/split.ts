/**
 * PDF Splitting Tool
 * Splits multi-page PDFs into individual single-page PDFs
 * Uses qpdf for high-quality splitting
 */

import { exec } from "child_process";
import { promisify } from "util";
import * as path from "path";
import {
  ensureDir,
  getPdfPageCount,
  getFileSize,
  formatFileSize,
} from "../utils/files.js";

const execAsync = promisify(exec);

interface SplitOptions {
  inputPath: string;
  outputDir?: string;
  prefix?: string;
  pageRange?: string;
}

interface SplitResult {
  success: boolean;
  inputFile: string;
  totalPages: number;
  outputFiles: Array<{
    page: number;
    path: string;
    size: string;
  }>;
  outputDir: string;
  message: string;
}

/**
 * Parse page range string into array of page numbers
 * Supports: "1-5", "1,3,5", "2-", "-5", "1-3,5,7-9"
 */
function parsePageRange(range: string, totalPages: number): number[] {
  const pages: Set<number> = new Set();

  const parts = range.split(",").map((s) => s.trim());

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
 * Split a PDF into individual pages using qpdf
 */
export async function splitPdf(options: SplitOptions): Promise<SplitResult> {
  const { inputPath, prefix = "page" } = options;
  const outputDir = options.outputDir || path.join(process.cwd(), "output");

  // Ensure output directory exists
  await ensureDir(outputDir);

  // Get total page count
  const totalPages = await getPdfPageCount(inputPath);
  if (totalPages === 0) {
    throw new Error(`Could not determine page count for: ${inputPath}`);
  }

  // Determine which pages to extract
  const pagesToExtract = options.pageRange
    ? parsePageRange(options.pageRange, totalPages)
    : Array.from({ length: totalPages }, (_, i) => i + 1);

  const outputFiles: Array<{ page: number; path: string; size: string }> = [];

  // Extract each page using qpdf
  for (const pageNum of pagesToExtract) {
    const paddedNum = String(pageNum).padStart(3, "0");
    const outputPath = path.join(outputDir, `${prefix}_${paddedNum}.pdf`);

    // Use qpdf to extract single page
    const cmd = `qpdf "${inputPath}" --pages . ${pageNum} -- "${outputPath}"`;

    try {
      await execAsync(cmd);

      const size = await getFileSize(outputPath);
      outputFiles.push({
        page: pageNum,
        path: outputPath,
        size: formatFileSize(size),
      });
    } catch (error) {
      throw new Error(
        `Failed to extract page ${pageNum}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  return {
    success: true,
    inputFile: inputPath,
    totalPages,
    outputFiles,
    outputDir,
    message: `Successfully split ${outputFiles.length} page(s) from ${path.basename(inputPath)}`,
  };
}
