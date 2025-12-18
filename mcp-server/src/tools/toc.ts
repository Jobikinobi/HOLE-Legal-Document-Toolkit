/**
 * Table of Contents Generator
 * Create an index page for legal exhibit bundles
 *
 * Features:
 * - Auto-generate TOC from exhibit list
 * - Include Bates number ranges
 * - Add page counts
 * - Customizable formatting
 * - Insert as first page or separate document
 */

import { PDFDocument, rgb, StandardFonts, PDFPage } from "pdf-lib";
import * as fs from "fs/promises";
import * as path from "path";
import { ensureDir, getFileSize, formatFileSize, getPdfPageCount } from "../utils/files.js";

interface ExhibitEntry {
  label: string;           // e.g., "Exhibit A", "Exhibit 1"
  description: string;     // e.g., "Email dated January 5, 2024"
  batesStart?: string;     // e.g., "SMITH-0001"
  batesEnd?: string;       // e.g., "SMITH-0015"
  pageCount?: number;      // Number of pages
  filePath?: string;       // Path to the exhibit file (for auto-detection)
}

interface TocOptions {
  entries: ExhibitEntry[];
  outputPath: string;
  title?: string;                    // TOC title (default: "TABLE OF CONTENTS")
  subtitle?: string;                 // Optional subtitle (e.g., case name)
  caseCaption?: string;              // Full case caption text
  preparedBy?: string;               // "Prepared by" line
  preparedFor?: string;              // "Prepared for" line
  date?: string;                     // Date line
  pageSize?: "letter" | "legal" | "a4";
  fontSize?: {
    title?: number;
    subtitle?: number;
    header?: number;
    entry?: number;
  };
  includePageNumbers?: boolean;
  includeBatesNumbers?: boolean;
}

interface TocResult {
  success: boolean;
  outputFile: {
    path: string;
    size: string;
    pages: number;
  };
  entries: number;
  message: string;
}

// Page dimensions in points
const PAGE_SIZES = {
  letter: { width: 612, height: 792 },
  legal: { width: 612, height: 1008 },
  a4: { width: 595, height: 842 },
};

/**
 * Generate a Table of Contents PDF
 */
export async function generateToc(options: TocOptions): Promise<TocResult> {
  const {
    entries,
    outputPath,
    title = "TABLE OF CONTENTS",
    subtitle,
    caseCaption,
    preparedBy,
    preparedFor,
    date,
    pageSize = "letter",
    fontSize = {},
    includePageNumbers = true,
    includeBatesNumbers = true,
  } = options;

  const {
    title: titleSize = 18,
    subtitle: subtitleSize = 14,
    header: headerSize = 11,
    entry: entrySize = 10,
  } = fontSize;

  await ensureDir(path.dirname(outputPath));

  // Create new PDF document
  const pdfDoc = await PDFDocument.create();
  const dimensions = PAGE_SIZES[pageSize];

  // Embed fonts
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

  // Page margins
  const margin = {
    top: 72,
    bottom: 72,
    left: 72,
    right: 72,
  };

  const contentWidth = dimensions.width - margin.left - margin.right;

  // Create first page
  let page = pdfDoc.addPage([dimensions.width, dimensions.height]);
  let y = dimensions.height - margin.top;

  // Draw title
  const titleWidth = fontBold.widthOfTextAtSize(title, titleSize);
  page.drawText(title, {
    x: (dimensions.width - titleWidth) / 2,
    y,
    size: titleSize,
    font: fontBold,
    color: rgb(0, 0, 0),
  });
  y -= titleSize + 10;

  // Draw subtitle if provided
  if (subtitle) {
    const subtitleWidth = fontRegular.widthOfTextAtSize(subtitle, subtitleSize);
    page.drawText(subtitle, {
      x: (dimensions.width - subtitleWidth) / 2,
      y,
      size: subtitleSize,
      font: fontRegular,
      color: rgb(0.3, 0.3, 0.3),
    });
    y -= subtitleSize + 10;
  }

  // Draw case caption if provided
  if (caseCaption) {
    const captionLines = caseCaption.split("\n");
    for (const line of captionLines) {
      const lineWidth = fontRegular.widthOfTextAtSize(line, 10);
      page.drawText(line, {
        x: (dimensions.width - lineWidth) / 2,
        y,
        size: 10,
        font: fontRegular,
        color: rgb(0, 0, 0),
      });
      y -= 14;
    }
    y -= 10;
  }

  // Draw prepared by/for/date
  if (preparedBy || preparedFor || date) {
    y -= 10;
    if (preparedFor) {
      page.drawText(`Prepared for: ${preparedFor}`, {
        x: margin.left,
        y,
        size: 10,
        font: fontRegular,
      });
      y -= 14;
    }
    if (preparedBy) {
      page.drawText(`Prepared by: ${preparedBy}`, {
        x: margin.left,
        y,
        size: 10,
        font: fontRegular,
      });
      y -= 14;
    }
    if (date) {
      page.drawText(`Date: ${date}`, {
        x: margin.left,
        y,
        size: 10,
        font: fontRegular,
      });
      y -= 14;
    }
    y -= 20;
  }

  // Draw horizontal line
  y -= 10;
  page.drawLine({
    start: { x: margin.left, y },
    end: { x: dimensions.width - margin.right, y },
    thickness: 1,
    color: rgb(0, 0, 0),
  });
  y -= 20;

  // Draw column headers
  const colWidths = {
    exhibit: 80,
    description: includeBatesNumbers ? 220 : 320,
    bates: includeBatesNumbers ? 120 : 0,
    pages: includePageNumbers ? 50 : 0,
  };

  let x = margin.left;

  page.drawText("EXHIBIT", {
    x,
    y,
    size: headerSize,
    font: fontBold,
  });
  x += colWidths.exhibit;

  page.drawText("DESCRIPTION", {
    x,
    y,
    size: headerSize,
    font: fontBold,
  });
  x += colWidths.description;

  if (includeBatesNumbers) {
    page.drawText("BATES RANGE", {
      x,
      y,
      size: headerSize,
      font: fontBold,
    });
    x += colWidths.bates;
  }

  if (includePageNumbers) {
    page.drawText("PAGES", {
      x,
      y,
      size: headerSize,
      font: fontBold,
    });
  }

  y -= headerSize + 5;

  // Draw line under headers
  page.drawLine({
    start: { x: margin.left, y },
    end: { x: dimensions.width - margin.right, y },
    thickness: 0.5,
    color: rgb(0.5, 0.5, 0.5),
  });
  y -= 15;

  // Draw entries
  const lineHeight = entrySize + 8;

  for (const entry of entries) {
    // Check if we need a new page
    if (y < margin.bottom + lineHeight) {
      page = pdfDoc.addPage([dimensions.width, dimensions.height]);
      y = dimensions.height - margin.top;
    }

    x = margin.left;

    // Exhibit label
    page.drawText(entry.label, {
      x,
      y,
      size: entrySize,
      font: fontBold,
    });
    x += colWidths.exhibit;

    // Description (truncate if too long)
    let description = entry.description;
    const maxDescWidth = colWidths.description - 10;
    while (fontRegular.widthOfTextAtSize(description, entrySize) > maxDescWidth) {
      description = description.slice(0, -4) + "...";
    }
    page.drawText(description, {
      x,
      y,
      size: entrySize,
      font: fontRegular,
    });
    x += colWidths.description;

    // Bates range
    if (includeBatesNumbers && (entry.batesStart || entry.batesEnd)) {
      const batesText = entry.batesStart === entry.batesEnd
        ? entry.batesStart || ""
        : `${entry.batesStart || "?"} - ${entry.batesEnd || "?"}`;
      page.drawText(batesText, {
        x,
        y,
        size: entrySize,
        font: fontRegular,
      });
      x += colWidths.bates;
    } else if (includeBatesNumbers) {
      x += colWidths.bates;
    }

    // Page count
    if (includePageNumbers && entry.pageCount !== undefined) {
      page.drawText(String(entry.pageCount), {
        x,
        y,
        size: entrySize,
        font: fontRegular,
      });
    }

    y -= lineHeight;
  }

  // Save the PDF
  const pdfBytes = await pdfDoc.save();
  await fs.writeFile(outputPath, pdfBytes);

  const outputSize = await getFileSize(outputPath);

  return {
    success: true,
    outputFile: {
      path: outputPath,
      size: formatFileSize(outputSize),
      pages: pdfDoc.getPageCount(),
    },
    entries: entries.length,
    message: `Generated table of contents with ${entries.length} exhibit entries`,
  };
}

/**
 * Create exhibit entries from a list of PDF files
 * Auto-detects page counts from the files
 */
export async function createEntriesFromFiles(
  files: Array<{
    path: string;
    label: string;
    description: string;
    batesPrefix?: string;
    batesStart?: number;
  }>
): Promise<ExhibitEntry[]> {
  const entries: ExhibitEntry[] = [];
  let currentBates = 1;

  for (const file of files) {
    const pageCount = await getPdfPageCount(file.path);
    const batesStart = file.batesStart || currentBates;
    const batesEnd = batesStart + pageCount - 1;

    const batesPrefix = file.batesPrefix || "";
    const digits = 4;

    entries.push({
      label: file.label,
      description: file.description,
      batesStart: batesPrefix + String(batesStart).padStart(digits, "0"),
      batesEnd: batesPrefix + String(batesEnd).padStart(digits, "0"),
      pageCount,
      filePath: file.path,
    });

    currentBates = batesEnd + 1;
  }

  return entries;
}
