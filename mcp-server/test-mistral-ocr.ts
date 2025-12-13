/**
 * Test script for Mistral OCR integration
 * Usage: MISTRAL_API_KEY=your_key npx tsx test-mistral-ocr.ts /path/to/test.pdf
 */

import { createMistralOcrService } from './src/services/mistral-ocr.js';
import { ocrPdf } from './src/tools/ocr.js';
import * as path from 'path';
import { existsSync } from 'fs';

async function testMistralOcr() {
  const apiKey = process.env.MISTRAL_API_KEY;

  if (!apiKey) {
    console.error('❌ MISTRAL_API_KEY not set');
    console.log('\nUsage: MISTRAL_API_KEY=your_key npx tsx test-mistral-ocr.ts /path/to/test.pdf');
    process.exit(1);
  }

  const inputPath = process.argv[2];

  if (!inputPath) {
    console.error('❌ No input file specified');
    console.log('\nUsage: MISTRAL_API_KEY=your_key npx tsx test-mistral-ocr.ts /path/to/test.pdf');
    process.exit(1);
  }

  if (!existsSync(inputPath)) {
    console.error(`❌ File not found: ${inputPath}`);
    process.exit(1);
  }

  console.log('🚀 Testing Mistral OCR Integration\n');
  console.log(`Input file: ${inputPath}`);
  console.log(`API Key: ${apiKey.substring(0, 10)}...`);
  console.log('');

  try {
    // Test 1: Check Mistral connection
    console.log('1️⃣  Checking Mistral AI connection...');
    const mistralService = createMistralOcrService(apiKey);
    const connectionCheck = await mistralService.checkConnection();

    if (!connectionCheck.connected) {
      console.error(`❌ Mistral connection failed: ${connectionCheck.error}`);
      process.exit(1);
    }
    console.log('✅ Connected to Mistral AI');
    console.log('');

    // Test 2: Run OCR
    console.log('2️⃣  Running OCR on PDF...');
    const outputPath = inputPath.replace('.pdf', '-ocr-test.pdf');

    const result = await ocrPdf({
      inputPath,
      outputPath,
    });

    console.log('✅ OCR completed successfully!');
    console.log('');
    console.log('📊 Results:');
    console.log(`   Input: ${result.inputFile.size} (${result.inputFile.pages} pages)`);
    console.log(`   Output: ${result.outputFile.size} (${result.outputFile.pages} pages)`);
    console.log(`   Language: ${result.ocr.language}`);
    console.log(`   Pages processed: ${result.ocr.pagesProcessed}`);
    console.log(`   Message: ${result.message}`);
    console.log('');
    console.log('✨ Test completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

testMistralOcr();
