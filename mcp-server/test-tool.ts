#!/usr/bin/env tsx
/**
 * Interactive tool tester for debugging
 * Usage: npx tsx test-tool.ts <tool_name> <args_json>
 *
 * Examples:
 *   npx tsx test-tool.ts check_dependencies '{}'
 *   npx tsx test-tool.ts ocr_pdf '{"input_path":"/path/to/file.pdf","output_path":"/tmp/out.pdf"}'
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const toolName = process.argv[2];
const argsJson = process.argv[3] || '{}';

if (!toolName) {
  console.error('Usage: npx tsx test-tool.ts <tool_name> <args_json>');
  console.error('\nAvailable tools:');
  console.error('  • split_pdf');
  console.error('  • merge_pdfs');
  console.error('  • optimize_pdf');
  console.error('  • ocr_pdf');
  console.error('  • extract_text');
  console.error('  • add_bates_numbers');
  console.error('  • redact_pdf');
  console.error('  • add_watermark');
  console.error('  • generate_toc');
  console.error('  • check_dependencies');
  console.error('  • list_pdfs');
  console.error('  • process_exhibit');
  process.exit(1);
}

async function testTool() {
  console.log(`🧪 Testing tool: ${toolName}\n`);

  const transport = new StdioClientTransport({
    command: 'node',
    args: ['dist/index.js'],
    env: {
      ...process.env,
      MISTRAL_API_KEY: process.env.MISTRAL_API_KEY || 'J7rEiM401PILd2knfr1Hfwo2ltk0N2MF'
    }
  });

  const client = new Client(
    { name: 'test-tool', version: '1.0.0' },
    { capabilities: {} }
  );

  try {
    await client.connect(transport);
    console.log('✅ Connected to MCP server\n');

    // Parse arguments
    let args;
    try {
      args = JSON.parse(argsJson);
    } catch (e) {
      console.error('❌ Invalid JSON arguments:', argsJson);
      process.exit(1);
    }

    console.log('📋 Tool:', toolName);
    console.log('📦 Arguments:', JSON.stringify(args, null, 2));
    console.log('\n🔄 Executing...\n');

    const startTime = Date.now();
    const result = await client.callTool({
      name: toolName,
      arguments: args
    });
    const duration = Date.now() - startTime;

    console.log('✅ Success!');
    console.log(`⏱️  Duration: ${duration}ms\n`);
    console.log('📊 Result:');
    console.log(JSON.stringify(result, null, 2));

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

testTool();
