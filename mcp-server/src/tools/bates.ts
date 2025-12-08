/**
 * Bates Numbering Tool
 * Add sequential page numbers (Bates stamps) to legal documents
 *
 * Features:
 * - Customizable prefix (e.g., "EXHIBIT A-", "SMITH-")
 * - Zero-padded sequential numbers
 * - Configurable position (header/footer, left/center/right)
 * - Font size and style options
 * - Supports starting number offset
 */

import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import * as fs from "fs/promises";
import * as path from "path";
import { ensureDir, getFileSize, formatFileSize, getPdfPageCount } from "../utils/files.js";

export type BatesPosition =
  | "top-left" | "top-center" | "top-right"
  | "bottom-left" | "bottom-center" | "bottom-right";

interface BatesOptions {
  inputPath: string;
  outputPath: string;
  prefix?: string;           // e.g., "EXHIBIT A-", "DOC-"
  suffix?: string;           // e.g., "-CONFIDENTIAL"
  startNumber?: number;      // Starting number (default: 1)
  digits?: number;           // Zero-padding (default: 4, e.g., 0001)
  position?: BatesPosition;  // Where to place the stamp
  fontSize?: number;         // Font size in points (default: 10)
  marginX?: number;          // Horizontal margin from edge (default: 50)
  marginY?: number;          // Vertical margin from edge (default: 30)
  color?: { r: number; g: number; b: number }; // RGB color (0-1)
}

interface BatesResult {
  success: boolean;
  inputFile: {
    path: string;
    pages: number;
  };
  outputFile: {
    path: string;
    size: string;
  };
  batesRange: {
    prefix: string;
    suffix: string;
    start: string;
    end: string;
    format: string;
  };
  message: string;
}

/**
 * Format a Bates number with prefix, padding, and suffix
 */
function formatBatesNumber(
  pageNum: number,
  prefix: string,
  suffix: string,
  digits: number
): string {
  const paddedNum = String(pageNum).padStart(digits, "0");
  return `${prefix}${paddedNum}${suffix}`;
}

/**
 * Calculate position coordinates based on page dimensions and position setting
 */
function calculatePosition(
  position: BatesPosition,
  pageWidth: number,
  pageHeight: number,
  textWidth: number,
  marginX: number,
  marginY: number
): { x: number; y: number } {
  let x: number;
  let y: number;

  // Horizontal position
  if (position.includes("left")) {
    x = marginX;
  } else if (position.includes("right")) {
    x = pageWidth - marginX - textWidth;
  } else {
    // center
    x = (pageWidth - textWidth) / 2;
  }

  // Vertical position
  if (position.includes("top")) {
    y = pageHeight - marginY;
  } else {
    // bottom
    y = marginY;
  }

  return { x, y };
}

/**
 * Add Bates numbers to a PDF
 */
export async function addBatesNumbers(options: BatesOptions): Promise<BatesResult> {
  const {
    inputPath,
    outputPath,
    prefix = "",
    suffix = "",
    startNumber = 1,
    digits = 4,
    position = "bottom-right",
    fontSize = 10,
    marginX = 50,
    marginY = 30,
    color = { r: 0, g: 0, b: 0 }, // Black
  } = options;

  // Ensure output directory exists
  await ensureDir(path.dirname(outputPath));

  // Load the PDF
  const pdfBytes = await fs.readFile(inputPath);
  const pdfDoc = await PDFDocument.load(pdfBytes);

  // Get font
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const pages = pdfDoc.getPages();
  const totalPages = pages.length;

  // Add Bates numbers to each page
  for (let i = 0; i < totalPages; i++) {
    const page = pages[i];
    const pageNum = startNumber + i;
    const batesText = formatBatesNumber(pageNum, prefix, suffix, digits);

    // Get page dimensions
    const { width, height } = page.getSize();

    // Calculate text width for positioning
    const textWidth = font.widthOfTextAtSize(batesText, fontSize);

    // Calculate position
    const { x, y } = calculatePosition(
      position,
      width,
      height,
      textWidth,
      marginX,
      marginY
    );

    // Draw the Bates number
    page.drawText(batesText, {
      x,
      y,
      size: fontSize,
      font,
      color: rgb(color.r, color.g, color.b),
    });
  }

  // Save the modified PDF
  const modifiedPdfBytes = await pdfDoc.save();
  await fs.writeFile(outputPath, modifiedPdfBytes);

  // Get output file size
  const outputSize = await getFileSize(outputPath);

  const startBates = formatBatesNumber(startNumber, prefix, suffix, digits);
  const endBates = formatBatesNumber(startNumber + totalPages - 1, prefix, suffix, digits);

  return {
    success: true,
    inputFile: {
      path: inputPath,
      pages: totalPages,
    },
    outputFile: {
      path: outputPath,
      size: formatFileSize(outputSize),
    },
    batesRange: {
      prefix,
      suffix,
      start: startBates,
      end: endBates,
      format: `${prefix}${"X".repeat(digits)}${suffix}`,
    },
    message: `Bates numbered ${totalPages} pages: ${startBates} through ${endBates}`,
  };
}

/**
 * Calculate the next Bates number for continuing a sequence
 */
export function getNextBatesNumber(lastBates: string, prefix: string): number {
  const numPart = lastBates.replace(prefix, "").replace(/\D/g, "");
  return parseInt(numPart, 10) + 1;
}
