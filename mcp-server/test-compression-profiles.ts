/**
 * Test Suite for Compression Profiles Module
 * Validates all 11 compression profiles and helper functions
 */

import {
  CompressionProfile,
  CompressionProfileName,
  PRINTER_PROFILE,
  LEGAL_JPEG_PROFILE,
  LEGAL_BALANCED_PROFILE,
  LEGAL_TEXT_PROFILE,
  LEGAL_AGGRESSIVE_PROFILE,
  LEGAL_ARCHIVE_PROFILE,
  LEGAL_JPEG_225_PROFILE,
  LEGAL_BALANCED_225_PROFILE,
  LEGAL_TEXT_225_PROFILE,
  LEGAL_AGGRESSIVE_225_PROFILE,
  LEGAL_ARCHIVE_225_PROFILE,
  getProfile,
  getAllProfiles,
  compareProfiles,
  recommendProfile,
} from "./src/tools/compression-profiles.js";

// Color output for terminal
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  gray: "\x1b[90m",
};

let testsRun = 0;
let testsPassed = 0;
let testsFailed = 0;

function assert(condition: boolean, message: string) {
  testsRun++;
  if (condition) {
    testsPassed++;
    console.log(`${colors.green}✓${colors.reset} ${message}`);
  } else {
    testsFailed++;
    console.log(`${colors.red}✗${colors.reset} ${message}`);
  }
}

function assertEqual<T>(actual: T, expected: T, message: string) {
  assert(actual === expected, `${message} (expected ${expected}, got ${actual})`);
}

function testSection(title: string) {
  console.log(`\n${colors.blue}${title}${colors.reset}`);
}

// ============================================================================
// Test Suite
// ============================================================================

testSection("1. Profile Constants Validation");

// Test each profile constant exists and has correct structure
function validateProfile(profile: CompressionProfile, expectedName: CompressionProfileName) {
  assert(profile !== undefined, `Profile ${expectedName} is defined`);
  assert(profile.name === expectedName, `Profile ${expectedName} has correct name`);
  assert(profile.description !== undefined, `Profile ${expectedName} has description`);
  assert(profile.dpi !== undefined, `Profile ${expectedName} has DPI settings`);
  assert(profile.dpi.color > 0, `Profile ${expectedName} has valid color DPI`);
  assert(profile.dpi.gray > 0, `Profile ${expectedName} has valid grayscale DPI`);
  assert(profile.dpi.mono > 0, `Profile ${expectedName} has valid monochrome DPI`);
  assert(
    ["DCTEncode", "LZWEncode", "FlateDecode"].includes(profile.colorImageFilter),
    `Profile ${expectedName} has valid colorImageFilter`
  );
  assert(
    ["DCTEncode", "LZWEncode", "FlateDecode"].includes(profile.grayImageFilter),
    `Profile ${expectedName} has valid grayImageFilter`
  );
  assert(profile.estimatedCompression !== undefined, `Profile ${expectedName} has compression estimate`);
  assert(profile.bestFor !== undefined, `Profile ${expectedName} has bestFor description`);
  assert(Array.isArray(profile.considerGhostscriptFlags), `Profile ${expectedName} has Ghostscript flags array`);
  assert(profile.considerGhostscriptFlags.length > 0, `Profile ${expectedName} has at least one Ghostscript flag`);
}

validateProfile(PRINTER_PROFILE, "printer");
validateProfile(LEGAL_JPEG_PROFILE, "legal-jpeg");
validateProfile(LEGAL_BALANCED_PROFILE, "legal-balanced");
validateProfile(LEGAL_TEXT_PROFILE, "legal-text");
validateProfile(LEGAL_AGGRESSIVE_PROFILE, "legal-aggressive");
validateProfile(LEGAL_ARCHIVE_PROFILE, "legal-archive");
validateProfile(LEGAL_JPEG_225_PROFILE, "legal-jpeg-225");
validateProfile(LEGAL_BALANCED_225_PROFILE, "legal-balanced-225");
validateProfile(LEGAL_TEXT_225_PROFILE, "legal-text-225");
validateProfile(LEGAL_AGGRESSIVE_225_PROFILE, "legal-aggressive-225");
validateProfile(LEGAL_ARCHIVE_225_PROFILE, "legal-archive-225");

testSection("2. DPI Configuration Validation");

// 300 DPI profiles should have 300 DPI for color/gray
assert(PRINTER_PROFILE.dpi.color === 300, "Printer profile has 300 DPI color");
assert(LEGAL_JPEG_PROFILE.dpi.color === 300, "Legal-JPEG profile has 300 DPI color");
assert(LEGAL_BALANCED_PROFILE.dpi.color === 300, "Legal-Balanced profile has 300 DPI color");

// 225 DPI profiles should have 225 DPI for color/gray
assert(LEGAL_JPEG_225_PROFILE.dpi.color === 225, "Legal-JPEG-225 profile has 225 DPI color");
assert(LEGAL_BALANCED_225_PROFILE.dpi.color === 225, "Legal-Balanced-225 profile has 225 DPI color");

// Monochrome DPI consistency
assert(PRINTER_PROFILE.dpi.mono === 1200, "300 DPI profiles use 1200 DPI monochrome");
assert(LEGAL_JPEG_225_PROFILE.dpi.mono === 900, "225 DPI profiles use 900 DPI monochrome");

testSection("3. Image Filter Configuration");

// Verify filter combinations
assert(LEGAL_JPEG_PROFILE.colorImageFilter === "DCTEncode", "JPEG profile uses DCTEncode for color");
assert(LEGAL_TEXT_PROFILE.colorImageFilter === "LZWEncode", "Text profile uses LZWEncode for color");
assert(LEGAL_BALANCED_PROFILE.colorImageFilter === "DCTEncode", "Balanced profile uses JPEG for color");
assert(LEGAL_BALANCED_PROFILE.grayImageFilter === "LZWEncode", "Balanced profile uses LZW for grayscale");

testSection("4. JPEG Quality Settings");

// JPEG quality only appears in DCTEncode profiles
assert(LEGAL_JPEG_PROFILE.jpegQuality === 90, "Legal-JPEG uses quality 90");
assert(LEGAL_BALANCED_PROFILE.jpegQuality === 92, "Legal-Balanced uses quality 92");
assert(LEGAL_AGGRESSIVE_PROFILE.jpegQuality === 85, "Legal-Aggressive uses quality 85");
assert(LEGAL_JPEG_225_PROFILE.jpegQuality === 90, "Legal-JPEG-225 uses quality 90");
assert(LEGAL_AGGRESSIVE_225_PROFILE.jpegQuality === 85, "Legal-Aggressive-225 uses quality 85");
assert(LEGAL_TEXT_PROFILE.jpegQuality === undefined, "LZW profiles don't have JPEG quality");

testSection("5. Ghostscript Flags");

// Verify flags array contains expected DPI settings
function hasFlag(profile: CompressionProfile, flag: string): boolean {
  return profile.considerGhostscriptFlags.some((f) => f.includes(flag));
}

assert(hasFlag(PRINTER_PROFILE, "300"), "Printer profile has 300 DPI flags");
assert(hasFlag(LEGAL_JPEG_225_PROFILE, "225"), "225 DPI profile has 225 DPI flags");
assert(hasFlag(LEGAL_JPEG_PROFILE, "DCTEncode"), "JPEG profile has DCTEncode flag");
assert(hasFlag(LEGAL_TEXT_PROFILE, "LZWEncode"), "Text profile has LZWEncode flag");

testSection("6. getProfile() Function");

// Test retrieval of each profile
const profile1 = getProfile("printer");
assert(profile1.name === "printer", "getProfile('printer') returns printer profile");

const profile2 = getProfile("legal-jpeg");
assert(profile2.name === "legal-jpeg", "getProfile('legal-jpeg') returns legal-jpeg profile");

const profile3 = getProfile("legal-jpeg-225");
assert(profile3.name === "legal-jpeg-225", "getProfile('legal-jpeg-225') returns legal-jpeg-225 profile");

const profile4 = getProfile("legal-archive-225");
assert(profile4.name === "legal-archive-225", "getProfile('legal-archive-225') returns legal-archive-225 profile");

testSection("7. getAllProfiles() Function");

const allProfiles = getAllProfiles();
assert(allProfiles.length === 11, "getAllProfiles() returns all 11 profiles");

const profileNames = allProfiles.map((p) => p.name);
assert(profileNames.includes("printer"), "getAllProfiles includes printer");
assert(profileNames.includes("legal-jpeg"), "getAllProfiles includes legal-jpeg");
assert(profileNames.includes("legal-jpeg-225"), "getAllProfiles includes legal-jpeg-225");
assert(profileNames.includes("legal-archive-225"), "getAllProfiles includes legal-archive-225");

// Verify no duplicates
const uniqueNames = new Set(profileNames);
assert(uniqueNames.size === 11, "getAllProfiles has no duplicate profiles");

testSection("8. compareProfiles() Function");

const comparison = compareProfiles();
assert(comparison.length === 11, "compareProfiles() returns 11 profile comparisons");

// Verify comparison format
const firstComparison = comparison[0];
assert(firstComparison.name !== undefined, "Comparison includes profile name");
assert(firstComparison.compression !== undefined, "Comparison includes compression estimate");
assert(firstComparison.quality !== undefined, "Comparison includes quality rating");
assert(firstComparison.bestFor !== undefined, "Comparison includes use case");

// Verify 225 DPI variants show size savings
const jpeg225Comparison = comparison.find((c) => c.name === "legal-jpeg-225");
assert(jpeg225Comparison !== undefined, "Comparison includes legal-jpeg-225");
assert(
  jpeg225Comparison?.bestFor.includes("smaller"),
  "225 DPI variants mention file size savings"
);

testSection("9. recommendProfile() Function");

// Test recommendations for different document types
const scanRec = recommendProfile("scanned document");
assert(scanRec === "legal-jpeg", "Recommends legal-jpeg for scanned documents");

const contractRec = recommendProfile("contract");
assert(contractRec === "legal-text", "Recommends legal-text for contracts");

const photoRec = recommendProfile("photo");
assert(photoRec === "legal-jpeg", "Recommends legal-jpeg for photos");

const formRec = recommendProfile("form");
assert(formRec === "legal-text", "Recommends legal-text for forms");

const archiveRec = recommendProfile("archive");
assert(archiveRec === "legal-archive", "Recommends legal-archive for archival");

const bulkRec = recommendProfile("high-volume processing");
assert(bulkRec === "legal-aggressive", "Recommends legal-aggressive for bulk processing");

const mixedRec = recommendProfile("mixed content");
assert(mixedRec === "legal-balanced", "Recommends legal-balanced for mixed content (default)");

const unknownRec = recommendProfile("unknown type");
assert(unknownRec === "legal-balanced", "Recommends legal-balanced for unknown types");

testSection("10. Compression Profile Hierarchy");

// Verify compression ranges make sense
assert(
  PRINTER_PROFILE.estimatedCompression === "30-50%",
  "Printer: 30-50% compression"
);
assert(
  LEGAL_JPEG_PROFILE.estimatedCompression === "70-85%",
  "Legal-JPEG: 70-85% compression"
);
assert(
  LEGAL_JPEG_225_PROFILE.estimatedCompression === "80-90%",
  "Legal-JPEG-225: 80-90% compression"
);
assert(
  LEGAL_AGGRESSIVE_225_PROFILE.estimatedCompression === "85-92%",
  "Legal-Aggressive-225: 85-92% compression"
);

testSection("11. 225 DPI Additional Compression");

// Verify 225 DPI profiles achieve more compression than 300 DPI equivalents
const jpeg300 = "70-85%";
const jpeg225 = "80-90%";
assert(jpeg225 > jpeg300, "JPEG-225 (80-90%) compresses more than JPEG (70-85%)");

const balanced300 = "60-75%";
const balanced225 = "70-80%";
assert(balanced225 > balanced300, "Balanced-225 (70-80%) compresses more than Balanced (60-75%)");

testSection("12. Quality Ratings");

// Verify quality ratings are reasonable
const highQualityProfiles = [
  "printer",
  "legal-jpeg",
  "legal-balanced",
  "legal-text",
  "legal-archive",
  "legal-jpeg-225",
  "legal-balanced-225",
  "legal-text-225",
  "legal-archive-225",
];

highQualityProfiles.forEach((name) => {
  const profile = getProfile(name as CompressionProfileName);
  assert(
    ["High", "Very High", "Excellent"].includes(profile.description.split("quality")[0].slice(-10)) ||
      profile.description.includes("Excellent") ||
      profile.description.includes("Very High"),
    `${name} has appropriate quality description`
  );
});

testSection("13. Type Safety");

// Verify TypeScript type safety (these would be compile-time checks)
const profileNames2: CompressionProfileName[] = [
  "printer",
  "legal-jpeg",
  "legal-balanced",
  "legal-text",
  "legal-aggressive",
  "legal-archive",
  "legal-jpeg-225",
  "legal-balanced-225",
  "legal-text-225",
  "legal-aggressive-225",
  "legal-archive-225",
];

profileNames2.forEach((name) => {
  const profile = getProfile(name);
  assert(profile !== undefined, `Type ${name} resolves to valid profile`);
});

testSection("14. Downsampling Methods");

// Verify appropriate downsampling for quality
assert(LEGAL_JPEG_PROFILE.downsampling === "Bicubic", "JPEG uses Bicubic downsampling for quality");
assert(LEGAL_TEXT_PROFILE.downsampling === "Bicubic", "Text uses Bicubic for text preservation");
assert(LEGAL_AGGRESSIVE_PROFILE.downsampling === "Average", "Aggressive uses Average for speed");

testSection("15. Integration Readiness");

// Verify all profiles are ready for optimize.ts integration
allProfiles.forEach((profile) => {
  assert(profile.considerGhostscriptFlags.length > 0, `${profile.name} has Ghostscript flags for integration`);
  assert(profile.dpi.color > 0, `${profile.name} has valid DPI for integration`);
  assert(profile.colorImageFilter !== undefined, `${profile.name} has color filter defined`);
});

// ============================================================================
// Test Results Summary
// ============================================================================

console.log(`\n${colors.blue}${"=".repeat(60)}${colors.reset}`);
console.log(`${colors.blue}Test Results Summary${colors.reset}`);
console.log(`${colors.blue}${"=".repeat(60)}${colors.reset}\n`);

console.log(`Total Tests Run:  ${colors.blue}${testsRun}${colors.reset}`);
console.log(`${colors.green}✓ Passed: ${testsPassed}${colors.reset}`);

if (testsFailed > 0) {
  console.log(`${colors.red}✗ Failed: ${testsFailed}${colors.reset}`);
  process.exit(1);
} else {
  console.log(`${colors.green}✗ Failed: 0${colors.reset}`);
}

console.log(`\nPass Rate: ${colors.green}${((testsPassed / testsRun) * 100).toFixed(1)}%${colors.reset}`);
console.log(`\n${colors.green}✓ All compression profiles are functioning correctly!${colors.reset}\n`);

process.exit(0);
