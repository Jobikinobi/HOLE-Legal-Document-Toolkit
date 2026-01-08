/**
 * PDF Document Analyzer
 * Detects document characteristics to help recommend compression profiles
 */

import { exec } from "child_process";
import { promisify } from "util";
import * as fs from "fs";
import * as path from "path";
import { getPdfPageCount, getFileSize } from "./files.js";

const execAsync = promisify(exec);

export interface PDFAnalysisResult {
  fileName: string;
  fileSizeBytes: number;
  fileSizeMB: number;
  pageCount: number;
  hasImages: boolean;
  imagePercentage: number; // 0-100
  hasColor: boolean;
  hasText: boolean;
  hasSignatures: boolean;
  confidence: number; // 0-100, how confident the analysis is
  recommendations: {
    bestProfile: string;
    alternativeProfiles: string[];
    reasoning: string;
  };
}

/**
 * Analyze a PDF to detect characteristics
 * This helps recommend the best compression profile
 */
export async function analyzePdf(filePath: string): Promise<PDFAnalysisResult> {
  const fileSize = await getFileSize(filePath);
  const pageCount = await getPdfPageCount(filePath);
  const fileName = path.basename(filePath);

  // Get PDF info using pdfinfo
  let hasImages = false;
  let hasColor = false;
  let hasText = false;
  let hasSignatures = false;
  let confidence = 50; // Base confidence

  try {
    // Try to extract text to detect if document has text
    const { stdout: textOutput } = await execAsync(
      `pdftotext "${filePath}" - 2>/dev/null | head -100`
    );
    hasText = textOutput.trim().length > 50;
    if (hasText) confidence += 10;
  } catch {
    // If pdftotext fails, assume has text
    hasText = true;
  }

  // Detect images using pdfimages
  try {
    const { stdout: imageOutput } = await execAsync(
      `pdfimages -list "${filePath}" 2>/dev/null | grep -c "image"`
    );
    const imageCount = parseInt(imageOutput) || 0;
    hasImages = imageCount > 0;
    const imagePercentage = Math.min(
      100,
      (imageCount / Math.max(pageCount, 1)) * 30
    ); // Rough estimate
    confidence += hasImages ? 15 : 0;

    // Detect color by checking for RGB or CMYK
    try {
      const { stdout: colorOutput } = await execAsync(
        `pdfimages -list "${filePath}" 2>/dev/null | grep -E "rgb|RGB|CMYK|cmyk" | wc -l`
      );
      const colorCount = parseInt(colorOutput) || 0;
      hasColor = colorCount > 0;
      confidence += hasColor ? 10 : 0;
    } catch {
      // Assume no color if we can't detect
      hasColor = false;
    }

    // Check for common signature patterns
    try {
      const { stdout: sigOutput } = await execAsync(
        `pdftotext "${filePath}" - 2>/dev/null | grep -iE "signature|signed|initials|___" | wc -l`
      );
      const sigCount = parseInt(sigOutput) || 0;
      hasSignatures = sigCount > 0;
      confidence += hasSignatures ? 5 : 0;
    } catch {
      hasSignatures = false;
    }
  } catch {
    // If pdfimages fails, make educated guess based on file size
    // Large files are likely to have images
    hasImages = fileSize > 2 * 1024 * 1024; // > 2MB likely has images
    confidence = 30; // Low confidence if we can't analyze
  }

  const imagePercentage = hasImages
    ? Math.min(100, Math.max(10, (fileSize / (5 * 1024 * 1024)) * 30))
    : 0; // Rough heuristic

  // Generate recommendations based on analysis
  const recommendations = generateRecommendations(
    hasImages,
    hasText,
    hasColor,
    hasSignatures,
    fileSize
  );

  return {
    fileName,
    fileSizeBytes: fileSize,
    fileSizeMB: Math.round((fileSize / (1024 * 1024)) * 10) / 10,
    pageCount,
    hasImages,
    imagePercentage: Math.round(imagePercentage),
    hasColor,
    hasText,
    hasSignatures,
    confidence: Math.min(100, confidence),
    recommendations,
  };
}

/**
 * Generate profile recommendations based on detected characteristics
 */
function generateRecommendations(
  hasImages: boolean,
  hasText: boolean,
  hasColor: boolean,
  hasSignatures: boolean,
  fileSize: number
): {
  bestProfile: string;
  alternativeProfiles: string[];
  reasoning: string;
} {
  let bestProfile = "legal-balanced";
  let alternativeProfiles: string[] = [];
  let reasoning = "";

  // Decision tree for recommendations
  if (hasText && !hasImages) {
    // Text-heavy document (contracts, forms)
    bestProfile = "legal-text";
    alternativeProfiles = ["legal-text-225", "legal-balanced"];
    reasoning = "Text-heavy document detected. legal-text preserves signatures and text quality perfectly.";

    if (hasSignatures) {
      reasoning +=
        " Signatures detected - legal-text is ideal for signature preservation.";
    }
  } else if (hasImages && !hasText) {
    // Image-heavy document (scans, photos)
    bestProfile = "legal-jpeg";
    alternativeProfiles = ["legal-jpeg-225", "legal-aggressive-225"];
    reasoning = "Image-heavy document detected. legal-jpeg provides excellent compression for scanned images.";

    if (fileSize > 10 * 1024 * 1024) {
      // > 10MB
      bestProfile = "legal-jpeg-225";
      alternativeProfiles = ["legal-aggressive-225", "legal-jpeg"];
      reasoning += " Large file - recommending 225 DPI for 45-50% size reduction.";
    }
  } else if (hasImages && hasText) {
    // Mixed content
    bestProfile = "legal-balanced";
    alternativeProfiles = ["legal-balanced-225", "legal-jpeg"];
    reasoning =
      "Mixed content detected (text + images). legal-balanced uses JPEG for images and LZW for text.";

    if (fileSize > 5 * 1024 * 1024) {
      // > 5MB
      bestProfile = "legal-balanced-225";
      alternativeProfiles = ["legal-jpeg-225", "legal-balanced"];
      reasoning +=
        " Recommending 225 DPI for 45-50% size savings on mixed content.";
    }
  } else {
    // Generic/unknown
    bestProfile = "legal-balanced";
    alternativeProfiles = ["legal-jpeg", "legal-text", "printer"];
    reasoning = "Generic document. legal-balanced is a safe choice for any content type.";
  }

  // Size-based adjustments
  if (fileSize > 15 * 1024 * 1024) {
    // > 15MB - suggest aggressive compression
    if (!bestProfile.includes("225")) {
      alternativeProfiles.unshift(bestProfile + "-225");
    }
    alternativeProfiles.push("legal-aggressive-225");
    reasoning += " Consider -225 variants or -aggressive for larger files.";
  }

  return {
    bestProfile,
    alternativeProfiles: alternativeProfiles.slice(0, 3),
    reasoning,
  };
}

/**
 * Format analysis result for display
 */
export function formatAnalysisResult(analysis: PDFAnalysisResult): string {
  const lines = [
    "╔════════════════════════════════════════╗",
    "║     PDF ANALYSIS RESULTS               ║",
    "╚════════════════════════════════════════╝",
    "",
    `📄 File: ${analysis.fileName}`,
    `📊 Size: ${analysis.fileSizeMB} MB (${analysis.fileSizeBytes.toLocaleString()} bytes)`,
    `📑 Pages: ${analysis.pageCount}`,
    "",
    "📋 Content Analysis:",
    `  Text Content:     ${analysis.hasText ? "✓ Yes" : "✗ No"}`,
    `  Images:           ${analysis.hasImages ? "✓ Yes (" + analysis.imagePercentage + "%)" : "✗ No"}`,
    `  Color:            ${analysis.hasColor ? "✓ Yes" : "✗ No (grayscale)"}`,
    `  Signatures:       ${analysis.hasSignatures ? "✓ Yes" : "✗ No"}`,
    `  Confidence:       ${analysis.confidence}%`,
    "",
    "🎯 Recommendations:",
    `  Best Profile:     ${analysis.recommendations.bestProfile.toUpperCase()}`,
    `  Alternatives:     ${analysis.recommendations.alternativeProfiles.map((p) => p.toUpperCase()).join(", ")}`,
    "",
    `  Reasoning: ${analysis.recommendations.reasoning}`,
    "",
  ];

  return lines.join("\n");
}
