/**
 * File utilities for PDF processing
 */

import { exec } from "child_process";
import { promisify } from "util";
import * as fs from "fs/promises";
import * as path from "path";
import { glob } from "./glob.js";

const execAsync = promisify(exec);

export interface PdfFileInfo {
  name: string;
  path: string;
  size: string;
  sizeBytes: number;
  pages: number;
  modifiedAt: Date;
}

/**
 * Get page count of a PDF using pdfinfo or qpdf
 */
export async function getPdfPageCount(filePath: string): Promise<number> {
  try {
    // Try pdfinfo first (faster)
    const { stdout } = await execAsync(`pdfinfo "${filePath}" 2>/dev/null | grep Pages`);
    const match = stdout.match(/Pages:\s+(\d+)/);
    if (match) {
      return parseInt(match[1], 10);
    }
  } catch {
    // Fall back to qpdf
    try {
      const { stdout } = await execAsync(`qpdf --show-npages "${filePath}"`);
      return parseInt(stdout.trim(), 10);
    } catch {
      // If all else fails, return 0
      return 0;
    }
  }
  return 0;
}

/**
 * Format file size to human-readable string
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

/**
 * List PDF files in a directory with metadata
 */
export async function listFiles(
  directory?: string,
  pattern: string = "*.pdf",
  recursive: boolean = false
): Promise<PdfFileInfo[]> {
  const dir = directory || process.cwd();
  const searchPattern = recursive ? `**/${pattern}` : pattern;

  const files = await glob(searchPattern, { cwd: dir, absolute: true });

  const fileInfos: PdfFileInfo[] = [];

  for (const filePath of files) {
    try {
      const stats = await fs.stat(filePath);
      const pages = await getPdfPageCount(filePath);

      fileInfos.push({
        name: path.basename(filePath),
        path: filePath,
        size: formatFileSize(stats.size),
        sizeBytes: stats.size,
        pages,
        modifiedAt: stats.mtime,
      });
    } catch {
      // Skip files that can't be read
    }
  }

  // Sort by name
  return fileInfos.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Ensure directory exists
 */
export async function ensureDir(dirPath: string): Promise<void> {
  await fs.mkdir(dirPath, { recursive: true });
}

/**
 * Get file size in bytes
 */
export async function getFileSize(filePath: string): Promise<number> {
  const stats = await fs.stat(filePath);
  return stats.size;
}

/**
 * Check if file exists
 */
export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Generate unique temporary file path
 */
export function getTempPath(prefix: string = "temp", ext: string = ".pdf"): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(7);
  return path.join(process.cwd(), "temp", `${prefix}_${timestamp}_${random}${ext}`);
}
