# Claude Desktop MCP Server Setup

Complete guide for configuring the Legal Exhibits Toolkit as an MCP server in Claude Desktop.

## Prerequisites

1. **Claude Desktop** installed (download from https://claude.ai/download)
2. **Node.js** 18+ installed
3. **Legal Exhibits Toolkit** cloned and dependencies installed

## Step 1: Build the MCP Server

```bash
cd /path/to/HOLE-Legal-Document-Toolkit/mcp-server
npm install
npm run build
```

This creates the compiled server in `dist/index.js`.

## Step 2: Locate Claude Desktop Config File

**macOS**:
```bash
~/Library/Application Support/Claude/claude_desktop_config.json
```

**Windows**:
```
%APPDATA%/Claude/claude_desktop_config.json
```

**Linux**:
```bash
~/.config/Claude/claude_desktop_config.json
```

## Step 3: Configure the MCP Server

Open the `claude_desktop_config.json` file and add the Legal Exhibits server:

### Option A: With Mistral AI OCR (Premium - Recommended)

```json
{
  "mcpServers": {
    "legal-exhibits": {
      "command": "node",
      "args": [
        "/Users/YOUR_USERNAME/Documents/GitHub/HOLE-Legal-Document-Toolkit/mcp-server/dist/index.js"
      ],
      "env": {
        "MISTRAL_API_KEY": "your_mistral_api_key_here"
      }
    }
  }
}
```

**Get your Mistral API key**:
1. Go to https://console.mistral.ai
2. Sign up or log in
3. Navigate to API Keys
4. Create a new key
5. Copy and paste it into the config above

**Benefits**:
- ✨ Superior accuracy on legal documents
- 📄 Better handling of poor-quality scans
- 🌐 Automatic multi-language detection
- 💰 ~$0.03-0.06 per document

### Option B: With Tesseract OCR (Free)

```json
{
  "mcpServers": {
    "legal-exhibits": {
      "command": "node",
      "args": [
        "/Users/YOUR_USERNAME/Documents/GitHub/HOLE-Legal-Document-Toolkit/mcp-server/dist/index.js"
      ]
    }
  }
}
```

**Requirements**:
- Install Tesseract: `brew install ocrmypdf tesseract`

**Benefits**:
- ✅ Completely free
- ✅ Works offline
- ✅ No API keys needed
- ⚠️ Moderate accuracy on degraded documents

### Option C: Multiple MCP Servers

If you already have other MCP servers configured:

```json
{
  "mcpServers": {
    "legal-exhibits": {
      "command": "node",
      "args": [
        "/Users/YOUR_USERNAME/Documents/GitHub/HOLE-Legal-Document-Toolkit/mcp-server/dist/index.js"
      ],
      "env": {
        "MISTRAL_API_KEY": "your_mistral_api_key_here"
      }
    },
    "other-server": {
      "command": "...",
      "args": ["..."]
    }
  }
}
```

## Step 4: Update the Path

Replace `/Users/YOUR_USERNAME/Documents/GitHub/` with the actual path to your installation.

**Quick way to get the full path**:
```bash
cd /path/to/HOLE-Legal-Document-Toolkit/mcp-server
pwd
# Copy the output and append '/dist/index.js'
```

## Step 5: Restart Claude Desktop

1. **Quit Claude Desktop completely** (Cmd+Q on Mac, Alt+F4 on Windows)
2. **Reopen Claude Desktop**
3. The Legal Exhibits MCP server will load automatically

## Step 6: Verify Installation

In Claude Desktop, try asking:

> "Can you list the available MCP tools?"

You should see tools like:
- `split_pdf`
- `merge_pdfs`
- `ocr_pdf`
- `optimize_pdf`
- `add_bates_numbers`
- etc.

## Troubleshooting

### MCP Server Not Loading

**Check the logs**:
```bash
# macOS
tail -f ~/Library/Logs/Claude/mcp*.log

# Windows
# Check Event Viewer or %APPDATA%/Claude/Logs/
```

**Common issues**:
1. **Wrong path**: Make sure the path to `dist/index.js` is absolute and correct
2. **Not built**: Run `npm run build` in the mcp-server directory
3. **Node not in PATH**: Use full path to node: `/usr/local/bin/node` or `C:\Program Files\nodejs\node.exe`

### OCR Not Working

**If using Mistral**:
- Verify API key is correct in the config
- Check you have API credits at https://console.mistral.ai

**If using Tesseract**:
- Verify installation: `which ocrmypdf` and `which tesseract`
- Install if missing: `brew install ocrmypdf tesseract`

### Permission Errors

Make sure the MCP server has execute permissions:
```bash
chmod +x /path/to/mcp-server/dist/index.js
```

## Example Configuration (Complete)

Here's a complete example with proper formatting:

```json
{
  "mcpServers": {
    "legal-exhibits": {
      "command": "node",
      "args": [
        "/Users/joeherrmann/Documents/GitHub/HOLE-Legal-Document-Toolkit/mcp-server/dist/index.js"
      ],
      "env": {
        "MISTRAL_API_KEY": "J7rEiM401PILd2knfr1Hfwo2ltk0N2MF"
      }
    }
  }
}
```

## Updating the Server

When you update the toolkit code:

```bash
cd /path/to/HOLE-Legal-Document-Toolkit/mcp-server
git pull
npm install
npm run build
# Restart Claude Desktop
```

## Security Notes

- ⚠️ **Never commit** your `claude_desktop_config.json` to version control
- ⚠️ **Keep your Mistral API key secret**
- ✅ The API key is only stored locally on your machine
- ✅ Claude Desktop passes it securely to the MCP server

## Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review the logs
3. Open an issue at: https://github.com/anthropics/claude-code/issues
