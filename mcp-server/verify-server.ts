/**
 * Quick verification that MCP server is responding
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

async function verifyServer() {
  console.log('🔍 Verifying MCP Server...\n');

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
      name: 'verify-client',
      version: '1.0.0',
    },
    {
      capabilities: {},
    }
  );

  try {
    await client.connect(transport);
    console.log('✅ Connected to MCP server');

    const toolsResponse = await client.listTools();
    console.log(`✅ Found ${toolsResponse.tools.length} tools:`);

    toolsResponse.tools.forEach(tool => {
      console.log(`   • ${tool.name}`);
    });

    console.log('\n🎉 Server is running correctly!');

  } catch (error) {
    console.error('❌ Verification failed:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

verifyServer();
