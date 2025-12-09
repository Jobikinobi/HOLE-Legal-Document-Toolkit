// Test script for Legal Exhibits Toolkit tools
import { addBatesNumbers } from "../mcp-server/dist/tools/bates.js";
import { addWatermark, redactPdf } from "../mcp-server/dist/tools/redact.js";
import { generateToc } from "../mcp-server/dist/tools/toc.js";

async function runTests() {
  console.log("=".repeat(60));
  console.log("LEGAL EXHIBITS TOOLKIT - TOOL TESTS");
  console.log("=".repeat(60));

  // Test 1: Bates Numbering
  console.log("\n1. Testing Bates Numbering...");
  try {
    const batesResult = await addBatesNumbers({
      inputPath: "./test/sample.pdf",
      outputPath: "./test/output/sample_bates.pdf",
      prefix: "EXHIBIT-",
      startNumber: 1,
      digits: 4,
      position: "bottom-right",
    });
    console.log("   ✓ Bates numbering succeeded");
    console.log(`   Range: ${batesResult.batesRange.start} - ${batesResult.batesRange.end}`);
    console.log(`   Output: ${batesResult.outputFile.path} (${batesResult.outputFile.size})`);
  } catch (error) {
    console.log(`   ✗ Bates numbering failed: ${error.message}`);
  }

  // Test 2: Watermarking
  console.log("\n2. Testing Watermark...");
  try {
    const watermarkResult = await addWatermark({
      inputPath: "./test/sample.pdf",
      outputPath: "./test/output/sample_watermarked.pdf",
      text: "CONFIDENTIAL",
      opacity: 0.3,
      rotation: -45,
    });
    console.log("   ✓ Watermarking succeeded");
    console.log(`   Pages: ${watermarkResult.pages}`);
    console.log(`   Output: ${watermarkResult.outputPath}`);
  } catch (error) {
    console.log(`   ✗ Watermarking failed: ${error.message}`);
  }

  // Test 3: Redaction
  console.log("\n3. Testing Redaction...");
  try {
    const redactResult = await redactPdf({
      inputPath: "./test/sample.pdf",
      outputPath: "./test/output/sample_redacted.pdf",
      areas: [
        { page: 1, x: 72, y: 395, width: 150, height: 20, label: "[REDACTED]" },
        { page: 1, x: 72, y: 365, width: 350, height: 20, label: "[PRIVILEGED]" },
      ],
      redactFooters: false,
    });
    console.log("   ✓ Redaction succeeded");
    console.log(`   Redaction boxes: ${redactResult.redactions.totalBoxes}`);
    console.log(`   Output: ${redactResult.outputFile.path} (${redactResult.outputFile.size})`);
  } catch (error) {
    console.log(`   ✗ Redaction failed: ${error.message}`);
  }

  // Test 4: Table of Contents
  console.log("\n4. Testing Table of Contents Generation...");
  try {
    const tocResult = await generateToc({
      outputPath: "./test/output/toc.pdf",
      title: "EXHIBIT INDEX",
      subtitle: "Smith v. Jones, Case No. 2024-CV-1234",
      preparedBy: "Legal Exhibits Toolkit",
      date: new Date().toLocaleDateString(),
      entries: [
        {
          label: "Exhibit A",
          description: "Email correspondence dated January 5, 2024",
          batesStart: "EXHIBIT-0001",
          batesEnd: "EXHIBIT-0003",
          pageCount: 3,
        },
        {
          label: "Exhibit B",
          description: "Contract between parties",
          batesStart: "EXHIBIT-0004",
          batesEnd: "EXHIBIT-0015",
          pageCount: 12,
        },
        {
          label: "Exhibit C",
          description: "Deposition transcript of John Smith",
          batesStart: "EXHIBIT-0016",
          batesEnd: "EXHIBIT-0050",
          pageCount: 35,
        },
      ],
    });
    console.log("   ✓ TOC generation succeeded");
    console.log(`   Entries: ${tocResult.entries}`);
    console.log(`   Output: ${tocResult.outputFile.path} (${tocResult.outputFile.size})`);
  } catch (error) {
    console.log(`   ✗ TOC generation failed: ${error.message}`);
  }

  console.log("\n" + "=".repeat(60));
  console.log("TEST COMPLETE - Check ./test/output/ for generated files");
  console.log("=".repeat(60));
}

runTests().catch(console.error);
