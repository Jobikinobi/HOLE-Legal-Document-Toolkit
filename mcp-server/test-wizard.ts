#!/usr/bin/env tsx
/**
 * Test script for Profile Selection Wizard
 * Tests analyzer, scorer, and selector with real documents
 */

import { analyzePdf, formatAnalysisResult } from "./src/utils/pdf-analyzer.js";
import { scoreProfiles, formatScoreResults, UserPreferences } from "./src/utils/profile-scoring.js";
import { selectCompressionProfile, formatSelectionResult, ProfileSelectorOptions } from "./src/tools/select-profile.js";

const testDocuments = [
  '/Users/jth/Library/Application Support/DEVONthink/Inbox.dtBase2/Files.noindex/pdf/16/30 merged documents.pdf',
  '/Volumes/HOLE-RAID-DRIVE/Projects/HOLE-Legal-Document-Toolkit/test/sample.pdf',
];

async function testDocumentAnalysis(filePath: string) {
  console.log("\n" + "═".repeat(80));
  console.log(`📄 TESTING: ${filePath.split("/").pop()}`);
  console.log("═".repeat(80));

  try {
    // Test 1: Direct PDF analysis
    console.log("\n1️⃣  PDF ANALYSIS");
    console.log("-".repeat(80));
    const analysis = await analyzePdf(filePath);
    console.log(formatAnalysisResult(analysis));

    // Test 2: Profile scoring based on analysis alone
    console.log("\n2️⃣  PROFILE RECOMMENDATIONS (Based on Content Analysis)");
    console.log("-".repeat(80));
    const scoresByAnalysis = scoreProfiles({}, analysis);
    console.log(formatScoreResults(scoresByAnalysis));

    // Test 3: Profile selector with preferences
    console.log("\n3️⃣  PROFILE SELECTOR (Preferences + Analysis)");
    console.log("-".repeat(80));
    const options: ProfileSelectorOptions = {
      useCase: "digital",
      sizePriority: "balanced",
      samplePdfPath: filePath,
    };
    const selectorResult = await selectCompressionProfile(options);
    console.log(formatSelectionResult(selectorResult));

    // Test 4: Different use case
    console.log("\n4️⃣  ALTERNATIVE SCENARIO (Print + Quality Priority)");
    console.log("-".repeat(80));
    const options2: ProfileSelectorOptions = {
      useCase: "print",
      sizePriority: "quality",
      samplePdfPath: filePath,
    };
    const selectorResult2 = await selectCompressionProfile(options2);
    console.log(formatSelectionResult(selectorResult2));

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`❌ Error analyzing document: ${errorMsg}`);
  }
}

async function runTests() {
  console.log("\n🧪 PROFILE SELECTION WIZARD - TEST SUITE");
  console.log("═".repeat(80));

  for (const docPath of testDocuments) {
    try {
      await testDocumentAnalysis(docPath);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error(`\n⚠️  Skipping ${docPath}: ${errorMsg}`);
    }
  }

  console.log("\n" + "═".repeat(80));
  console.log("✅ TESTS COMPLETE");
  console.log("═".repeat(80));
  process.exit(0);
}

// Run tests
runTests().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
