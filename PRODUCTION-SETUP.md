# Production Setup - Legal Exhibits Toolkit

**Completed**: 2026-01-07
**Status**: ✅ Production Deployed

## What Was Done

### 1. Created Production Version
- **Location**: `~/.claude/mcp-servers/legal-exhibits-production/`
- **Source**: Copy of development MCP server with production configuration
- **Status**: Built and ready

### 2. Default DEVONthink Output Path
Production version automatically saves all output to DEVONthink Inbox by default:
```
/Users/jth/Library/Application Support/DEVONthink/Inbox
```

Changes made:
- Created `src/config.ts` with default path
- Updated `src/tools/split.ts` to use `getDefaultOutputDir()`
- Updated `src/index.ts` to list files from DEVONthink Inbox
- Optional `output_dir` parameter still available in tools to override default

### 3. Updated Claude Desktop Configuration
- **Config File**: `/Users/jth/Library/Application Support/Claude/claude_desktop_config.json`
- **Changed**: `legal-exhibits` entry now points to production version
- **Path**: `/Users/jth/.claude/mcp-servers/legal-exhibits-production/dist/index.js`
- **Status**: Active - Claude Desktop will use this on next restart

### 4. Marked Development Version
- Created `DEVELOPMENT.md` explaining the split
- Development version remains in original location for experimentation
- Safe to modify without affecting production

## Directory Structure

```
Production:
  ~/.claude/mcp-servers/legal-exhibits-production/
  ├── src/
  │   ├── config.ts                (hardcoded: /Users/jth/Library/Application Support/DEVONthink/Inbox)
  │   ├── index.ts                 (uses config)
  │   ├── tools/                   (split.ts uses config)
  │   └── utils/
  ├── dist/                        (compiled, ready to use)
  └── node_modules/                (dependencies installed)

Development:
  /Volumes/HOLE-RAID-DRIVE/Projects/HOLE-Legal-Document-Toolkit/
  ├── mcp-server/                  (source code, flexible output)
  ├── DEVELOPMENT.md               (this folder's purpose)
  └── [other resources]
```

## Claude Desktop Configuration

**Before**:
```json
"legal-exhibits": {
  "command": "node",
  "args": ["/Users/jth/Documents/GitHub/HOLE-Legal-Document-Toolkit/mcp-server/dist/index.js"]
}
```

**After**:
```json
"legal-exhibits": {
  "command": "node",
  "args": ["/Users/jth/.claude/mcp-servers/legal-exhibits-production/dist/index.js"]
}
```

## Key Features

✅ **Smart Defaults** - Documents automatically save to DEVONthink Inbox
✅ **No Configuration Needed** - Default output location works out of the box
✅ **Flexible When Needed** - Override with `output_dir` parameter if desired
✅ **Development Safe** - Development version remains flexible for testing
✅ **Easy Deployment** - Copy changes from dev → prod when ready

## How Production Works

1. **User calls a tool** (e.g., `split_pdf`)
2. **Tool checks for output_dir parameter**
   - If provided: uses specified directory
   - If not provided: uses default from config
3. **Default path**: `/Users/jth/Library/Application Support/DEVONthink/Inbox`
4. **Tool ensures directory exists** (creates if needed)
5. **Output saved to selected location** ✅
6. **Claude Desktop lists resources** from output directory

## Example Tool Usage

### split_pdf (Default Behavior)
```
Input: split_pdf(input_path: "/path/to/document.pdf")
Output: Automatically saved to /Users/jth/Library/Application Support/DEVONthink/Inbox
Result: "Successfully split document.pdf → /Users/jth/Library/Application Support/DEVONthink/Inbox"
```

### split_pdf (Custom Output Location)
```
Input: split_pdf(
  input_path: "/path/to/document.pdf",
  output_dir: "/custom/path"
)
Output: Saved to specified custom path
Result: "Successfully split document.pdf → /custom/path"
```

### How It Works
- **No output_dir** → Uses default: `/Users/jth/Library/Application Support/DEVONthink/Inbox`
- **With output_dir** → Uses specified directory
- Both ways work seamlessly

## Next Steps

### To Use Production
1. **Restart Claude Desktop**: Cmd+Q, then reopen
2. **All MCP tools** will now output to DEVONthink Inbox automatically
3. **No configuration needed** - it just works

### To Update Production
When you make changes in development:
```bash
# 1. Test in development version
cd /Volumes/HOLE-RAID-DRIVE/Projects/HOLE-Legal-Document-Toolkit/mcp-server
npm run build && npm test

# 2. Copy to production
cp -r src/* ~/.claude/mcp-servers/legal-exhibits-production/src/

# 3. Rebuild production
cd ~/.claude/mcp-servers/legal-exhibits-production
npm run build

# 4. Restart Claude Desktop
```

### To Change the Default Output Location
Edit production config:
```bash
# Edit the default path
nano ~/.claude/mcp-servers/legal-exhibits-production/src/config.ts

# Change DEFAULT_OUTPUT_DIR to a different path
# (Users can still override per-tool with output_dir parameter)

# Rebuild
npm run build

# Restart Claude Desktop
```

### To Override on a Per-Tool Basis
No code changes needed - just pass the `output_dir` parameter when calling a tool:
```
split_pdf(input_path: "...", output_dir: "/custom/path")
```

## Files Modified

- ✅ `~/.claude/mcp-servers/legal-exhibits-production/src/config.ts` (created)
- ✅ `~/.claude/mcp-servers/legal-exhibits-production/src/tools/split.ts` (updated)
- ✅ `~/.claude/mcp-servers/legal-exhibits-production/src/index.ts` (updated)
- ✅ `/Users/jth/Library/Application Support/Claude/claude_desktop_config.json` (updated)
- ✅ `/Volumes/HOLE-RAID-DRIVE/Projects/HOLE-Legal-Document-Toolkit/DEVELOPMENT.md` (created)
- ✅ `/Volumes/HOLE-RAID-DRIVE/Projects/HOLE-Legal-Document-Toolkit/PRODUCTION-SETUP.md` (created)

## Verification

To verify production is set up correctly:

```bash
# 1. Check production directory exists
ls -la ~/.claude/mcp-servers/legal-exhibits-production/

# 2. Verify dist folder has compiled code
ls -la ~/.claude/mcp-servers/legal-exhibits-production/dist/

# 3. Check Claude Desktop config
cat ~/Library/Application\ Support/Claude/claude_desktop_config.json | grep legal-exhibits

# 4. Look for production version path
# Should see: /Users/jth/.claude/mcp-servers/legal-exhibits-production/dist/index.js
```

## Troubleshooting

**Q: How do I know if production or development is running?**
A: Development outputs to `./output` relative to where you run it. Production always outputs to DEVONthink Inbox.

**Q: Can I have both running?**
A: Claude Desktop only runs the production version. You can manually run development with custom output for testing.

**Q: What if DEVONthink Inbox doesn't exist?**
A: The tool automatically creates the directory if it doesn't exist. You may need to reload DEVONthink.

**Q: How do I revert to development version in Claude Desktop?**
A: Edit `claude_desktop_config.json` and change the path back to the development version, then restart Claude Desktop.

---

**Setup Date**: 2026-01-07
**Status**: Production Ready ✅
**Version**: 1.0.0
