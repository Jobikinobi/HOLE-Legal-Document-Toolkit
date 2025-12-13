/**
 * Test OCR through MCP protocol
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { spawn } from 'child_process';

async function testMcpOcr() {
  console.log('🧪 Testing OCR through MCP Protocol\n');

  // Start MCP server as child process
  const serverProcess = spawn('node', ['dist/index.js'], {
    env: {
      ...process.env,
      MISTRAL_API_KEY: 'J7rEiM401PILd2knfr1Hfwo2ltk0N2MF'
    }
  });

  const transport = new StdioClientTransport({
    command: 'node',
    args: ['dist/index.js'],
    env: {
      ...process.env,
      MISTRAL_API_KEY: 'J7rEiM401PILd2knfr1Hfwo2ltk0N2MF'
    }
  });

  const client = new Client(
    {
      name: 'test-client',
      version: '1.0.0',
    },
    {
      capabilities: {},
    }
  );

  try {
    await client.connect(transport);
    console.log('✅ Connected to MCP server');

    // List tools
    console.log('\n📋 Listing available tools...');
    const toolsResponse = await client.listTools();
    console.log(`Found ${toolsResponse.tools.length} tools`);

    const ocrTool = toolsResponse.tools.find(t => t.name === 'ocr_pdf');
    if (ocrTool) {
      console.log('✅ ocr_pdf tool found');
      console.log(`   Description: ${ocrTool.description}`);
    } else {
      console.log('❌ ocr_pdf tool NOT found');
      process.exit(1);
    }

    // Test OCR tool
    console.log('\n🔬 Testing ocr_pdf tool...');
    const testPdf = '/Users/jth/Documents/HOLE-LaunchStoryBook-Design-Spec.pdf';
    const outputPdf = '/tmp/test-mcp-ocr-output.pdf';

    const result = await client.callTool({
      name: 'ocr_pdf',
      arguments: {
        input_path: testPdf,
        output_path: outputPdf,
      }
    });

    console.log('\n📊 OCR Result:');
    console.log(JSON.stringify(result, null, 2));

    console.log('\n✨ MCP protocol test completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  } finally {
    await client.close();
    serverProcess.kill();
  }
}

testMcpOcr();
