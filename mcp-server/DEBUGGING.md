# Debugging the Legal Exhibits MCP Server

Complete guide for debugging and troubleshooting the MCP server.

## Quick Debug Commands

```bash
# 1. Check if server is running
ps aux | grep "node dist/index.js"

# 2. View server logs (if running in background)
tail -f /tmp/legal-mcp-server.log

# 3. Test server connection
npx tsx verify-server.ts

# 4. Run server in debug mode (foreground with verbose output)
DEBUG=* MISTRAL_API_KEY=your_key node dist/index.js

# 5. Check dependencies
npx tsx -e "import {checkDependencies} from './src/utils/dependencies.js'; checkDependencies().then(r => console.log(r))"
```

## Debugging Methods

### 1. Run Server in Foreground (See All Output)

**Stop background server first:**
```bash
kill $(cat /tmp/legal-mcp-server.pid)
```

**Run in foreground with Mistral API key:**
```bash
cd /Users/jth/Documents/GitHub/HOLE-Legal-Document-Toolkit/mcp-server
MISTRAL_API_KEY=J7rEiM401PILd2knfr1Hfwo2ltk0N2MF node dist/index.js
```

You'll see:
- All MCP protocol messages
- Tool execution logs
- Errors in real-time
- Connection status

**To stop:** Press `Ctrl+C`

### 2. Enable Verbose Logging

Add debug environment variable:

```bash
DEBUG=mcp:* MISTRAL_API_KEY=your_key node dist/index.js
```

This shows:
- Every MCP request/response
- Tool call parameters
- Return values
- Internal state changes

### 3. Test Individual Tools

Use the test scripts:

```bash
# Test Mistral OCR connection
MISTRAL_API_KEY=your_key npx tsx quick-test.ts

# Test OCR with a real PDF
MISTRAL_API_KEY=your_key npx tsx test-mistral-ocr.ts /path/to/test.pdf

# Test via MCP protocol
npx tsx test-mcp-ocr.ts

# Verify all tools
npx tsx verify-server.ts
```

### 4. Check Claude Desktop Logs

**macOS:**
```bash
# Real-time monitoring
tail -f ~/Library/Logs/Claude/mcp*.log

# View all MCP logs
ls -ltr ~/Library/Logs/Claude/mcp*
cat ~/Library/Logs/Claude/mcp-server-legal-exhibits.log
```

**Windows:**
```
%APPDATA%\Claude\Logs\mcp-server-legal-exhibits.log
```

**Linux:**
```bash
~/.config/Claude/logs/mcp*
```

### 5. Inspect MCP Protocol Messages

Create a debug wrapper script:

```typescript
// debug-mcp-client.ts
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const transport = new StdioClientTransport({
  command: 'node',
  args: ['dist/index.js'],
  env: {
    MISTRAL_API_KEY: 'your_key',
    DEBUG: 'mcp:*'  // Enable MCP debugging
  }
});

const client = new Client({ name: 'debug', version: '1.0.0' }, { capabilities: {} });

// Monitor all messages
transport.onmessage = (msg) => {
  console.log('📨 Message:', JSON.stringify(msg, null, 2));
};

await client.connect(transport);
```

## Common Issues & Solutions

### Issue: Server Won't Start

**Check:**
```bash
# 1. Is Node.js installed?
node --version  # Should be 18+

# 2. Are dependencies installed?
npm install

# 3. Is it already running?
ps aux | grep "node dist/index.js"

# 4. Is the build up to date?
npm run build
```

**Solution:**
```bash
# Kill existing instances
pkill -f "node dist/index.js"

# Rebuild
npm run build

# Start fresh
MISTRAL_API_KEY=your_key node dist/index.js
```

### Issue: OCR Not Working

**Check:**
```bash
# 1. Is Mistral API key set?
echo $MISTRAL_API_KEY

# 2. Test connection
MISTRAL_API_KEY=your_key npx tsx quick-test.ts

# 3. Check if Tesseract fallback works
which ocrmypdf
which tesseract
```

**Debug:**
```bash
# Run OCR with full error output
MISTRAL_API_KEY=your_key npx tsx test-mistral-ocr.ts /path/to/test.pdf
```

### Issue: Tools Not Showing in Claude Desktop

**Check configuration:**
```bash
# View config
cat ~/Library/Application\ Support/Claude/claude_desktop_config.json

# Should show:
{
  "mcpServers": {
    "legal-exhibits": {
      "command": "node",
      "args": ["/full/path/to/mcp-server/dist/index.js"],
      "env": {
        "MISTRAL_API_KEY": "your_key"
      }
    }
  }
}
```

**Fix:**
1. Check path is absolute (not relative)
2. Verify `dist/index.js` exists
3. Restart Claude Desktop completely (Cmd+Q, then reopen)
4. Check logs: `tail -f ~/Library/Logs/Claude/mcp*.log`

### Issue: TypeScript Errors

**Check:**
```bash
npm run typecheck
```

**Common fixes:**
- Run `npm install` to update dependencies
- Delete `dist/` and rebuild: `rm -rf dist && npm run build`
- Check `tsconfig.json` is correct

### Issue: Tool Execution Fails

**Enable detailed logging:**

Edit `src/index.ts` and add logging:

```typescript
case "ocr_pdf": {
  console.error('[DEBUG] OCR tool called with:', args);
  try {
    const result = await ocrPdf({...});
    console.error('[DEBUG] OCR result:', result);
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  } catch (error) {
    console.error('[DEBUG] OCR error:', error);
    throw error;
  }
}
```

Rebuild and run in foreground to see logs.

## Advanced Debugging

### 1. Trace All Function Calls

Add this at the top of `src/index.ts`:

```typescript
// Debug wrapper to log all tool calls
const originalHandler = server.setRequestHandler;
server.setRequestHandler = function(schema: any, handler: any) {
  return originalHandler.call(this, schema, async (request: any) => {
    console.error('[MCP REQUEST]', JSON.stringify(request, null, 2));
    const result = await handler(request);
    console.error('[MCP RESPONSE]', JSON.stringify(result, null, 2));
    return result;
  });
};
```

### 2. Monitor File System Operations

```bash
# macOS - monitor file access
sudo fs_usage -f filesys node | grep legal-exhibits

# Linux - use strace
strace -e trace=file node dist/index.js
```

### 3. Check Memory Usage

```bash
# Monitor memory while running
watch -n 1 'ps aux | grep "node dist/index.js"'

# Detailed memory info
node --expose-gc --trace-gc dist/index.js
```

### 4. Profile Performance

```bash
# Run with profiler
node --prof dist/index.js

# After stopping, process the log
node --prof-process isolate-*.log > profile.txt
```

## Testing Checklist

Use this checklist to verify everything works:

```bash
# 1. Build succeeds
npm run build
echo $?  # Should be 0

# 2. Type check passes
npm run typecheck
echo $?  # Should be 0

# 3. Server starts
MISTRAL_API_KEY=your_key node dist/index.js &
sleep 2

# 4. Server responds
npx tsx verify-server.ts

# 5. Mistral connection works
MISTRAL_API_KEY=your_key npx tsx quick-test.ts

# 6. OCR processes a PDF
MISTRAL_API_KEY=your_key npx tsx test-mistral-ocr.ts /path/to/test.pdf

# 7. Dependencies check
which qpdf gs pdfinfo

# 8. Kill server
pkill -f "node dist/index.js"
```

## Debug Scripts

### Create a Debug Log File

```bash
# Start with logging to file
MISTRAL_API_KEY=your_key node dist/index.js 2>&1 | tee /tmp/legal-mcp-debug.log

# In another terminal, watch the log
tail -f /tmp/legal-mcp-debug.log
```

### Test Specific Tool

```bash
# Test split_pdf
npx tsx -e "
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const transport = new StdioClientTransport({
  command: 'node',
  args: ['dist/index.js']
});

const client = new Client({ name: 'test', version: '1.0.0' }, { capabilities: {} });
await client.connect(transport);

const result = await client.callTool({
  name: 'check_dependencies',
  arguments: {}
});

console.log(JSON.stringify(result, null, 2));
await client.close();
"
```

## Getting Help

If issues persist:

1. **Collect debug info:**
   ```bash
   npm run build 2>&1 > build.log
   npm run typecheck 2>&1 > typecheck.log
   MISTRAL_API_KEY=your_key node dist/index.js 2>&1 > server.log &
   sleep 5
   npx tsx verify-server.ts 2>&1 > verify.log
   ```

2. **Check versions:**
   ```bash
   node --version
   npm --version
   cat package.json | grep version
   ```

3. **Open an issue** with:
   - Error messages
   - Debug logs
   - Steps to reproduce
   - System info (OS, Node version)

## Quick Reference

| What to Debug | Command |
|--------------|---------|
| Server status | `ps aux \| grep "node dist/index.js"` |
| View logs | `tail -f ~/Library/Logs/Claude/mcp*.log` |
| Test connection | `npx tsx verify-server.ts` |
| Test OCR | `MISTRAL_API_KEY=key npx tsx test-mistral-ocr.ts file.pdf` |
| Run in foreground | `MISTRAL_API_KEY=key node dist/index.js` |
| Rebuild | `npm run build` |
| Check types | `npm run typecheck` |
| Kill server | `pkill -f "node dist/index.js"` |
