# Legal Exhibits Toolkit - Development Version

**Status**: Development/Experimental
**Date Created**: 2026-01-07

## Overview

This is the **DEVELOPMENT** version of the Legal Exhibits MCP Toolkit.

The **PRODUCTION** version is deployed at:
- Location: `~/.claude/mcp-servers/legal-exhibits-production/`
- Claude Desktop: Running
- Output: `/Users/jth/Library/Application Support/DEVONthink/Inbox`

## Development vs Production

### Production Version
- **Path**: `~/.claude/mcp-servers/legal-exhibits-production/`
- **Output**: Defaults to `DEVONthink Inbox` (configurable per-tool)
- **Status**: Deployed and active in Claude Desktop
- **Use**: Production work, processed exhibits go directly to DEVONthink by default
- **Config Location**: `/Users/jth/Library/Application Support/Claude/claude_desktop_config.json`
- **Flexibility**: Can override with `output_dir` parameter on any tool if needed

### Development Version
- **Path**: `/Volumes/HOLE-RAID-DRIVE/Projects/HOLE-Legal-Document-Toolkit/` (this folder)
- **Output**: Configurable, defaults to `./output`
- **Status**: For development and testing
- **Use**: Experimenting with features, modifying code, testing changes

## How It Works

### Development Workflow

1. **Make changes** in this folder (`/Volumes/HOLE-RAID-DRIVE/Projects/HOLE-Legal-Document-Toolkit/mcp-server/`)
2. **Test locally** using the development version
3. **Build**: `npm run build`
4. **Verify**: Test functionality before deploying

### Production Deployment

Once tested and stable:

1. **Copy changes** from development to production:
   ```bash
   cp -r mcp-server/src/* ~/.claude/mcp-servers/legal-exhibits-production/src/
   ```

2. **Rebuild production**:
   ```bash
   cd ~/.claude/mcp-servers/legal-exhibits-production
   npm run build
   ```

3. **Restart Claude Desktop** to apply changes

## Key Differences

| Aspect | Development | Production |
|--------|-------------|-----------|
| Location | `/Volumes/HOLE-RAID-DRIVE/Projects/HOLE-Legal-Document-Toolkit/` | `~/.claude/mcp-servers/legal-exhibits-production/` |
| Default Output | `./output` (configurable) | `/Users/jth/Library/Application Support/DEVONthink/Inbox` |
| Override Capable | Yes - per-tool | Yes - per-tool with `output_dir` parameter |
| Claude Desktop | Not configured | ✅ Active |
| Config | development config | production config |
| Changes Safe? | Yes - experimental | ⚠️ Affects production work |

## File Structure

```
/Volumes/HOLE-RAID-DRIVE/Projects/HOLE-Legal-Document-Toolkit/
├── mcp-server/                          (Development source)
│   ├── src/
│   │   ├── config.ts                    (Development config)
│   │   ├── index.ts                     (Main server)
│   │   ├── tools/                       (PDF tools)
│   │   └── utils/                       (Utilities)
│   ├── dist/                            (Compiled JS)
│   ├── package.json
│   ├── tsconfig.json
│   └── wrangler.toml
└── [other folders]

~/.claude/mcp-servers/legal-exhibits-production/
└── [Copy of built production version with hardcoded output path]
```

## Configuration

### Development Config
- File: `/mcp-server/src/config.ts`
- Default: `./output`
- Configurable: Yes (per-tool with `output_dir` parameter)

### Production Config
- File: `~/.claude/mcp-servers/legal-exhibits-production/src/config.ts`
- Default: `/Users/jth/Library/Application Support/DEVONthink/Inbox`
- Configurable: Yes, at two levels:
  - **Default**: Edit `config.ts` and rebuild to change the default
  - **Per-Tool**: Pass `output_dir` parameter to any tool to override

## Testing Development Changes

To test changes before deploying to production:

```bash
cd /Volumes/HOLE-RAID-DRIVE/Projects/HOLE-Legal-Document-Toolkit/mcp-server

# Install/update dependencies
npm install

# Build TypeScript
npm run build

# Test the server
npm test
# or manually test with test tools
```

## Deploying Changes

When you're satisfied with a change:

```bash
# 1. Copy the updated source
cp -r src/* ~/.claude/mcp-servers/legal-exhibits-production/src/

# 2. Rebuild production
cd ~/.claude/mcp-servers/legal-exhibits-production
npm run build

# 3. Restart Claude Desktop to load changes
# Cmd+Q then reopen Claude
```

## Troubleshooting

### Changes not appearing in production?
1. Verify you restarted Claude Desktop completely
2. Check that production version was rebuilt: `npm run build`
3. View logs: `tail -f ~/Library/Logs/Claude/mcp*.log`

### Documents not going to DEVONthink?
1. Verify production version is running (not development)
2. Check path: `/Users/jth/Library/Application Support/DEVONthink/Inbox`
3. Ensure DEVONthink is installed and Inbox exists

### Want to modify production default output location?
1. Edit: `~/.claude/mcp-servers/legal-exhibits-production/src/config.ts`
2. Change `DEFAULT_OUTPUT_DIR` constant to new default path
3. Rebuild: `npm run build`
4. Restart Claude Desktop

### Want to use a different location for a single tool call?
Pass `output_dir` parameter when calling the tool:
```
split_pdf(input_path: "...", output_dir: "/different/path")
```

## Quick Commands

```bash
# Development
cd /Volumes/HOLE-RAID-DRIVE/Projects/HOLE-Legal-Document-Toolkit/mcp-server
npm run build           # Build development
npm test               # Run tests

# Production
cd ~/.claude/mcp-servers/legal-exhibits-production
npm run build          # Build production
npm install            # Update dependencies

# Restart Claude Desktop
# On macOS: Cmd+Q, then reopen from Applications
```

## Notes

- **Development version** is for experimentation - safe to modify
- **Production version** is what Claude Desktop actually uses
- **Both versions** share the same source code initially, then diverge
- **Default output** is the main difference (DEVONthink vs ./output)
- **Both support overrides** via `output_dir` parameter for flexibility
- **Changes** must be manually copied from dev to prod when ready

---

**Last Updated**: 2026-01-07
**Version**: 1.0.0
