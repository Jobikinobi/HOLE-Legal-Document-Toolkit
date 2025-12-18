/**
 * Quick test to verify Mistral OCR integration
 */

import { createMistralOcrService } from './src/services/mistral-ocr.js';

async function quickTest() {
  const apiKey = process.env.MISTRAL_API_KEY;

  if (!apiKey) {
    console.error('❌ MISTRAL_API_KEY not set');
    console.log('Set it with: export MISTRAL_API_KEY=your_key');
    process.exit(1);
  }

  console.log('🧪 Testing Mistral OCR Connection...\n');
  console.log(`API Key: ${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 4)}`);

  try {
    const mistralService = createMistralOcrService(apiKey);
    console.log('✅ Service created');

    console.log('🔌 Checking connection...');
    const check = await mistralService.checkConnection();

    if (check.connected) {
      console.log('✅ Connected to Mistral AI successfully!');
      console.log('\n🎉 Integration is ready for testing!');
      console.log('\nNext steps:');
      console.log('1. Find a sample PDF to test');
      console.log('2. Run: MISTRAL_API_KEY=your_key npx tsx test-mistral-ocr.ts /path/to/sample.pdf');
    } else {
      console.log(`❌ Connection failed: ${check.error}`);
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

quickTest();
