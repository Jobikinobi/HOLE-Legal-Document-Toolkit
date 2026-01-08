/**
 * Profile Selector Tool
 * Interactive wizard to help users select the best compression profile for their needs
 * Combines PDF analysis with preference-based scoring
 */

import * as path from "path";
import { UserPreferences, scoreProfiles, formatScoreResults } from "../utils/profile-scoring.js";
import { analyzePdf, formatAnalysisResult, PDFAnalysisResult } from "../utils/pdf-analyzer.js";

export interface ProfileSelectorOptions {
  useCase?: "print" | "digital" | "archive" | "bulk";
  documentType?: "scanned" | "text" | "mixed" | "unknown";
  sizePriority?: "quality" | "balanced" | "aggressive";
  willPrint?: boolean;
  samplePdfPath?: string; // Optional: analyze an actual document
}

export interface ProfileSelectorResult {
  selectedProfile: string;
  allRecommendations: string;
  analysis?: string; // If PDF was analyzed
  preferences: UserPreferences;
}

/**
 * Parse string inputs to enums
 */
function parseInput(input: string, type: "useCase" | "documentType" | "sizePriority" | "willPrint"): any {
  if (type === "willPrint") {
    return input.toLowerCase() === "yes" || input === "true";
  }
  return input.toLowerCase();
}

/**
 * Interactive profile selector
 * Asks user questions or accepts preferences directly, then recommends profiles
 */
export async function selectCompressionProfile(
  options: ProfileSelectorOptions
): Promise<ProfileSelectorResult> {
  const preferences: UserPreferences = {
    useCase: options.useCase,
    documentType: options.documentType,
    sizePriority: options.sizePriority,
    willPrint: options.willPrint,
  };

  let analysis: PDFAnalysisResult | undefined;

  // If a sample PDF path was provided, analyze it
  if (options.samplePdfPath) {
    try {
      analysis = await analyzePdf(options.samplePdfPath);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.warn(`Failed to analyze PDF: ${errorMsg}`);
      // Continue with preference-based scoring if analysis fails
    }
  }

  // Score all profiles based on preferences and analysis
  const scores = scoreProfiles(preferences, analysis);

  // Get the top recommendation
  const topRecommendation = scores[0];
  const recommendationsFormatted = formatScoreResults(scores);

  // Build result
  const result: ProfileSelectorResult = {
    selectedProfile: topRecommendation.profile,
    allRecommendations: recommendationsFormatted,
    preferences,
  };

  // Include analysis if available
  if (analysis) {
    result.analysis = formatAnalysisResult(analysis);
  }

  return result;
}

/**
 * Generate user-friendly guidance based on responses
 * Used to suggest profiles before detailed scoring
 */
export function getQuickRecommendation(
  useCase?: string,
  documentType?: string,
  sizePriority?: string,
  willPrint?: boolean
): string {
  const lines: string[] = [];

  lines.push("📋 Quick Profile Recommendation");
  lines.push("");

  // Basic recommendation logic
  if (willPrint === true) {
    lines.push("Since you'll be printing, using a 300 DPI profile:");
    if (documentType === "text" || documentType === "scanned") {
      lines.push("  → Recommended: legal-text (perfect for signatures and text)");
    } else if (documentType === "mixed") {
      lines.push("  → Recommended: legal-balanced (handles text + images)");
    } else {
      lines.push("  → Recommended: legal-jpeg (excellent for scanned documents)");
    }
  } else if (willPrint === false) {
    lines.push("Since you're digital-only, using a 225 DPI profile for 45-60% smaller files:");
    if (documentType === "text" || documentType === "scanned") {
      lines.push("  → Recommended: legal-text-225 (great for contracts/forms)");
    } else if (documentType === "mixed") {
      lines.push("  → Recommended: legal-balanced-225 (smart hybrid approach)");
    } else {
      lines.push("  → Recommended: legal-jpeg-225 (excellent compression for images)");
    }
  }

  if (useCase === "archive") {
    lines.push("For archival quality (lossless), consider:");
    lines.push("  → legal-archive or legal-archive-225");
  } else if (useCase === "bulk") {
    lines.push("For bulk processing with maximum compression:");
    lines.push("  → legal-aggressive-225 (excellent 45-50% size reduction)");
  }

  if (sizePriority === "quality") {
    lines.push("You prioritize quality, so avoid aggressive profiles.");
  } else if (sizePriority === "aggressive") {
    lines.push("You prioritize small file sizes, so consider -225 profiles or -aggressive.");
  }

  lines.push("");
  lines.push("💡 Tip: Upload a sample PDF to get personalized analysis and ranking!");

  return lines.join("\n");
}

/**
 * Format selection result for display in MCP response
 */
export function formatSelectionResult(result: ProfileSelectorResult): string {
  const lines: string[] = [];

  lines.push("🎯 COMPRESSION PROFILE SELECTION");
  lines.push("═════════════════════════════════════════");
  lines.push("");

  if (result.analysis) {
    lines.push(result.analysis);
    lines.push("");
  }

  lines.push("═════════════════════════════════════════");
  lines.push(result.allRecommendations);

  if (result.selectedProfile) {
    lines.push("");
    lines.push("✨ RECOMMENDED USAGE:");
    lines.push(
      `   cc optimize_pdf input.pdf output.pdf --preset ${result.selectedProfile.toLowerCase()}`
    );
    lines.push("");
  }

  return lines.join("\n");
}

/**
 * Validate options and fill in defaults
 */
export function validateAndNormalizeOptions(options: ProfileSelectorOptions): ProfileSelectorOptions {
  const normalized = { ...options };

  // Validate useCase
  if (normalized.useCase && !["print", "digital", "archive", "bulk"].includes(normalized.useCase)) {
    console.warn(`Invalid useCase: ${normalized.useCase}, ignoring`);
    normalized.useCase = undefined;
  }

  // Validate documentType
  if (normalized.documentType && !["scanned", "text", "mixed", "unknown"].includes(normalized.documentType)) {
    console.warn(`Invalid documentType: ${normalized.documentType}, ignoring`);
    normalized.documentType = undefined;
  }

  // Validate sizePriority
  if (normalized.sizePriority && !["quality", "balanced", "aggressive"].includes(normalized.sizePriority)) {
    console.warn(`Invalid sizePriority: ${normalized.sizePriority}, ignoring`);
    normalized.sizePriority = undefined;
  }

  // Validate samplePdfPath if provided
  if (normalized.samplePdfPath && !normalized.samplePdfPath.endsWith(".pdf")) {
    console.warn(`Sample path doesn't appear to be a PDF: ${normalized.samplePdfPath}`);
  }

  return normalized;
}
