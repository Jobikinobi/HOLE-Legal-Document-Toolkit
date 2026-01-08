/**
 * Profile Scoring Algorithm
 * Scores all compression profiles against user preferences and document analysis
 */

import {
  CompressionProfileName,
  getAllProfiles,
  getProfile,
} from "../tools/compression-profiles.js";
import { PDFAnalysisResult } from "./pdf-analyzer.js";

export interface UserPreferences {
  useCase?: "print" | "digital" | "archive" | "bulk";
  documentType?: "scanned" | "text" | "mixed" | "unknown";
  sizePriority?: "quality" | "balanced" | "aggressive";
  willPrint?: boolean;
}

export interface ProfileScore {
  profile: CompressionProfileName;
  score: number;
  reasons: string[];
  estimatedCompression: string;
  estimatedQuality: "Excellent" | "Very High" | "Good" | "High";
}

/**
 * Score all profiles based on user preferences and PDF analysis
 */
export function scoreProfiles(
  preferences: UserPreferences,
  analysis?: PDFAnalysisResult
): ProfileScore[] {
  const allProfiles = getAllProfiles();

  const scores = allProfiles
    .map((profile) => ({
      profile: profile.name as CompressionProfileName,
      score: calculateProfileScore(profile.name, preferences, analysis),
      reasons: generateScoreReasons(profile.name, preferences, analysis),
      estimatedCompression: getProfile(profile.name).estimatedCompression,
      estimatedQuality: getQualityRating(profile.name),
    }))
    .sort((a, b) => b.score - a.score);

  return scores;
}

/**
 * Calculate score for a single profile
 */
function calculateProfileScore(
  profileName: CompressionProfileName,
  preferences: UserPreferences,
  analysis?: PDFAnalysisResult
): number {
  let score = 50; // Base score
  const profile = getProfile(profileName);

  // ============================================================================
  // CONSTRAINT 1: Print vs Digital
  // ============================================================================
  if (preferences.willPrint !== undefined) {
    if (preferences.willPrint && !profileName.includes("225")) {
      // If printing, prefer 300 DPI
      score += 25;
    } else if (!preferences.willPrint && profileName.includes("225")) {
      // If digital only, prefer 225 DPI (45-60% smaller)
      score += 30;
    }
  } else if (preferences.useCase === "print") {
    if (!profileName.includes("225")) score += 25;
  } else if (preferences.useCase === "digital" || preferences.useCase === "bulk") {
    if (profileName.includes("225")) score += 30;
  }

  // ============================================================================
  // CONSTRAINT 2: Document Type Matching
  // ============================================================================
  if (analysis) {
    // Text-heavy documents
    if (analysis.hasText && !analysis.hasImages) {
      if (profileName.includes("text")) score += 40;
      else if (profileName.includes("balanced")) score += 10;
      else score -= 10;

      // Bonus for signature preservation
      if (analysis.hasSignatures && profileName.includes("text")) {
        score += 15;
      }
    }

    // Image-heavy documents
    if (analysis.hasImages && !analysis.hasText) {
      if (profileName.includes("jpeg")) score += 40;
      else if (profileName.includes("balanced")) score += 10;
      else score -= 10;
    }

    // Mixed content
    if (analysis.hasImages && analysis.hasText) {
      if (profileName.includes("balanced")) score += 35;
      else if (profileName.includes("jpeg")) score += 15;
      else if (profileName.includes("text")) score += 5;
    }

    // Color preference
    if (analysis.hasColor && profileName.includes("jpeg")) {
      score += 10; // JPEG better for color
    }
    if (!analysis.hasColor && profileName.includes("text")) {
      score += 5; // Text profiles good for grayscale
    }
  } else if (preferences.documentType === "text") {
    if (profileName.includes("text")) score += 30;
    else if (profileName.includes("balanced")) score += 10;
  } else if (preferences.documentType === "scanned") {
    if (profileName.includes("jpeg")) score += 30;
    else if (profileName.includes("balanced")) score += 10;
  } else if (preferences.documentType === "mixed") {
    if (profileName.includes("balanced")) score += 30;
    else if (profileName.includes("jpeg")) score += 10;
  }

  // ============================================================================
  // CONSTRAINT 3: Size vs Quality Priority
  // ============================================================================
  const compressionPercentage = parseInt(profile.estimatedCompression.split("-")[0]);

  if (preferences.sizePriority === "quality") {
    // Prefer profiles with lower compression (higher quality)
    if (compressionPercentage < 50) score += 30;
    else if (compressionPercentage < 70) score += 10;
    else score -= 20;
  } else if (preferences.sizePriority === "balanced") {
    // Prefer middle-ground compression (60-75%)
    if (compressionPercentage >= 60 && compressionPercentage <= 75) {
      score += 30;
    } else if (compressionPercentage >= 50 && compressionPercentage <= 85) {
      score += 10;
    } else {
      score -= 10;
    }
  } else if (preferences.sizePriority === "aggressive") {
    // Prefer high compression
    if (compressionPercentage >= 75) score += 30;
    else if (compressionPercentage >= 65) score += 10;
    else score -= 20;
  }

  // ============================================================================
  // CONSTRAINT 4: Use Case Specific
  // ============================================================================
  if (preferences.useCase === "archive") {
    if (profileName.includes("archive")) score += 40;
    else if (profileName === "legal-text") score += 10;
  } else if (preferences.useCase === "bulk") {
    if (profileName.includes("aggressive")) score += 40;
    else if (profileName.includes("225")) score += 20;
  }

  // ============================================================================
  // CONSTRAINT 5: Legacy vs Modern
  // ============================================================================
  // Prefer modern compression profiles over legacy Adobe Acrobat presets
  if (
    ![
      "screen",
      "ebook",
      "prepress",
      "default",
    ].includes(profileName)
  ) {
    score += 10; // Modern profiles are better optimized for legal documents
  }

  // ============================================================================
  // FILE SIZE BONUS (if analysis available)
  // ============================================================================
  if (analysis) {
    const fileSizeMB = analysis.fileSizeMB;

    // Very large files (>10MB) - strong preference for 225 DPI and aggressive
    if (fileSizeMB > 10) {
      if (profileName.includes("225")) score += 20;
      if (profileName.includes("aggressive")) score += 15;
    }

    // Large files (5-10MB) - preference for 225 DPI
    if (fileSizeMB > 5 && fileSizeMB <= 10) {
      if (profileName.includes("225")) score += 15;
    }

    // Small files (<1MB) - less critical, can prioritize quality
    if (fileSizeMB < 1) {
      if (profileName.includes("archive") || profileName === "printer") {
        score += 10;
      }
    }
  }

  return Math.max(0, Math.min(100, score)); // Clamp between 0-100
}

/**
 * Generate human-readable reasons for the score
 */
function generateScoreReasons(
  profileName: CompressionProfileName,
  preferences: UserPreferences,
  analysis?: PDFAnalysisResult
): string[] {
  const reasons: string[] = [];
  const profile = getProfile(profileName);

  // Content type reasons
  if (analysis) {
    if (profileName.includes("text") && analysis.hasText && !analysis.hasImages) {
      reasons.push("Matches text-heavy document");
      if (analysis.hasSignatures) reasons.push("Preserves signatures");
    }
    if (profileName.includes("jpeg") && analysis.hasImages) {
      reasons.push("Optimized for image compression");
    }
    if (profileName.includes("balanced") && analysis.hasImages && analysis.hasText) {
      reasons.push("Handles mixed content well");
    }
  }

  // Use case reasons
  if (preferences.useCase === "archive" && profileName.includes("archive")) {
    reasons.push("Archival-quality lossless compression");
  }
  if (preferences.useCase === "bulk" && profileName.includes("aggressive")) {
    reasons.push("Maximum compression for bulk processing");
  }

  // DPI reasons
  if (profileName.includes("225")) {
    reasons.push("45-60% smaller than 300 DPI");
    if (preferences.useCase === "digital") {
      reasons.push("Excellent for digital-only documents");
    }
  } else {
    reasons.push("Professional 300 DPI quality");
    if (preferences.willPrint) {
      reasons.push("Suitable for printing");
    }
  }

  // Size priority reasons
  if (preferences.sizePriority === "quality") {
    if (parseInt(profile.estimatedCompression.split("-")[0]) < 60) {
      reasons.push("Conservative compression preserves quality");
    }
  }
  if (preferences.sizePriority === "aggressive") {
    if (parseInt(profile.estimatedCompression.split("-")[1]) > 80) {
      reasons.push("Aggressive compression maximizes size savings");
    }
  }

  // File size specific
  if (analysis && analysis.fileSizeMB > 10) {
    if (profileName.includes("225") || profileName.includes("aggressive")) {
      reasons.push(
        `Recommended for large files (${analysis.fileSizeMB}MB)`
      );
    }
  }

  return reasons.length > 0 ? reasons : ["Suitable for your needs"];
}

/**
 * Determine quality rating for a profile
 */
function getQualityRating(
  profileName: CompressionProfileName
): "Excellent" | "Very High" | "Good" | "High" {
  if (profileName.includes("archive")) return "Excellent";
  if (profileName.includes("text")) return "Excellent";
  if (profileName === "printer") return "High";
  if (profileName.includes("jpeg") && !profileName.includes("aggressive")) return "Very High";
  if (profileName.includes("balanced")) return "Very High";
  if (profileName.includes("aggressive")) return "Good";
  return "High";
}

/**
 * Format scores for display
 */
export function formatScoreResults(scores: ProfileScore[]): string {
  const lines = [
    "╔════════════════════════════════════════╗",
    "║    PROFILE RECOMMENDATIONS             ║",
    "╚════════════════════════════════════════╝",
    "",
  ];

  // Show top 5 recommendations
  const topScores = scores.slice(0, 5);

  topScores.forEach((item, index) => {
    const medal = index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : "  ";
    lines.push(
      `${medal} ${item.profile.toUpperCase().padEnd(25)} [Score: ${item.score}%]`
    );
    lines.push(`   Quality: ${item.estimatedQuality} | Compression: ${item.estimatedCompression}`);

    item.reasons.forEach((reason) => {
      lines.push(`   ✓ ${reason}`);
    });

    if (index < topScores.length - 1) lines.push("");
  });

  lines.push("");
  lines.push(
    "💡 Tip: Use 'cc optimize_pdf input.pdf output.pdf --preset [profile]' to optimize"
  );
  lines.push("");

  return lines.join("\n");
}
