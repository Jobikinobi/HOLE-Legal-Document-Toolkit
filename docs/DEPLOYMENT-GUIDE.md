# Legal Exhibits Toolkit - Deployment Guide

## Architecture Overview

The Legal Exhibits Toolkit uses a hybrid architecture combining local processing power with cloud storage:

```
┌─────────────────────────────────────────────────────────────┐
│                    LOCAL ENVIRONMENT                         │
│                                                              │
│  ┌──────────────────┐         ┌─────────────────────┐      │
│  │  MCP Server      │ ◄─────► │  R2 FUSE Mount      │      │
│  │  (Native Tools)  │         │  ~/legal-exhibits-r2│      │
│  └──────────────────┘         └─────────────────────┘      │
│         │                              │                     │
│         │ Process PDFs                 │ Read/Write          │
│         │ - qpdf (split/merge)         │                     │
│         │ - ghostscript (optimize)     │                     │
│         │ - ocrmypdf (OCR)             │                     │
│         │ - python (Bates, TOC)        │                     │
│         │                              │                     │
└─────────┼──────────────────────────────┼─────────────────────┘
          │                              │
          │ HTTP API                     │ S3 API
          │ (Upload/Download)            │
          │                              │
          ▼                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   CLOUDFLARE WORKERS                         │
│                                                              │
│  ┌──────────────────┐         ┌─────────────────────┐      │
│  │  Worker API      │ ◄─────► │   R2 Storage        │      │
│  │  (Hono REST)     │         │  legal-exhibits     │      │
│  └──────────────────┘         └─────────────────────┘      │
│         │                              │                     │
│         │ - File upload/download       │ - PDF storage       │
│         │ - Simple merge/split         │ - Metadata          │
│         │ - Job tracking (KV)          │ - Secure access     │
│         │                              │                     │
└─────────┼──────────────────────────────┼─────────────────────┘
          │                              │
          │ Protected by                 │
          │ Cloudflare Access            │
          │                              │
          ▼                              ▼
    [Authenticated Users]        [Audit Logs]
```

## Components

### 1. MCP Server (Local)
**Location:** `mcp-server/`
**Purpose:** Heavy PDF processing with native tools
**Tools:**
- `qpdf` - Fast split/merge operations
- `ghostscript` - High-quality PDF optimization (Adobe Acrobat-level)
- `ocrmypdf` + `tesseract` - OCR for scanned documents
- Python scripts - Bates numbering, redaction, TOC generation

**Usage:**
```bash
# Run locally via Claude Code MCP
claude mcp add legal-exhibits

# Or run directly
npm run mcp:start
```

### 2. Cloudflare Worker API
**Location:** `cloudflare-worker/`
**Purpose:** Cloud storage and simple operations
**Deployed:** https://legal-exhibits-api.joe-1a2.workers.dev

**Capabilities:**
- File upload/download to R2
- Simple merge/split using pdf-lib (runs in Workers)
- Job status tracking via KV
- Signed URL generation for secure downloads

**Limitations:**
- Cannot run native binaries (qpdf, ghostscript, OCR)
- Limited to operations that work with pdf-lib

### 3. R2 Storage
**Bucket:** `legal-exhibits`
**Purpose:** Secure cloud storage for processed PDFs

**Features:**
- S3-compatible API
- No egress fees
- Integrated with Worker API
- Mountable via FUSE for local access

### 4. R2 FUSE Mount (Optional)
**Mount Point:** `~/legal-exhibits-r2`
**Purpose:** Access R2 as a local filesystem

**Setup:**
```bash
# Install and configure
./scripts/setup-r2-mount.sh

# Mount the bucket
rclone mount legal-exhibits-r2:legal-exhibits ~/legal-exhibits-r2 \
  --daemon --vfs-cache-mode writes

# Now you can use it like a local directory
cp processed-exhibit.pdf ~/legal-exhibits-r2/exhibits/
```

## Workflow Examples

### Example 1: Process and Upload Exhibit

```bash
# 1. Process locally with MCP server
# Via Claude Code MCP:
> Process the PDF at /path/to/scanned-exhibit.pdf
> - Split pages 1-5
> - OCR with English language
> - Optimize for printing
> - Save to ~/legal-exhibits-r2/cases/case-123/exhibit-a.pdf

# 2. The file is automatically synced to R2 via FUSE mount

# 3. Access via Worker API
curl https://legal-exhibits-api.joe-1a2.workers.dev/files/cases/case-123/exhibit-a.pdf
```

### Example 2: Batch Processing

```bash
# 1. Place all source PDFs in input directory
ls input/sealed-exhibits/
# S-A.pdf, S-B.pdf, S-C.pdf...

# 2. Process with MCP server
> Optimize all PDFs in input/sealed-exhibits/
> Merge into master document
> Add Bates numbers starting with CASE-001
> Save to ~/legal-exhibits-r2/cases/sealed-master.pdf

# 3. Share secure link
> Generate signed URL for sealed-master.pdf with 24h expiration
```

### Example 3: OCR Scanned Documents

```bash
# Process scanned documents with OCR
> OCR the PDF at /path/to/scanned.pdf
> - Language: English
> - Auto-rotate and deskew
> - Output as PDF/A-2 (archival format)
> - Save to ~/legal-exhibits-r2/ocr/scanned-searchable.pdf
```

## Deployment Status

### ✅ Completed
1. Cloudflare Worker API deployed
2. R2 bucket created: `legal-exhibits`
3. KV namespace configured: `JOB_STATUS`
4. rclone installed and configured
5. Mount point created: `~/legal-exhibits-r2`

### 📋 Manual Steps Required

#### 1. Configure R2 API Credentials
```bash
# Get API token from:
# https://dash.cloudflare.com/1a25a792e801e687b9fe4932030cf6a6/r2/api-tokens

# Update rclone config:
rclone config update legal-exhibits-r2 \
  access_key_id YOUR_ACCESS_KEY_ID \
  secret_access_key YOUR_SECRET_ACCESS_KEY
```

#### 2. Set Up Cloudflare Access
See [CLOUDFLARE-ACCESS-SETUP.md](./CLOUDFLARE-ACCESS-SETUP.md) for detailed instructions.

**Quick start:**
1. Go to Zero Trust dashboard
2. Create application for `legal-exhibits-api.joe-1a2.workers.dev`
3. Add access policy for `@theholetruth.org` emails
4. Create service token for MCP server API access

#### 3. Mount R2 Bucket
```bash
# Mount for this session
rclone mount legal-exhibits-r2:legal-exhibits ~/legal-exhibits-r2 \
  --daemon --vfs-cache-mode writes

# Or add to startup (macOS)
# Create ~/Library/LaunchAgents/com.user.rclone-legal-exhibits.plist
```

## API Endpoints

### Health Check
```bash
GET https://legal-exhibits-api.joe-1a2.workers.dev/
```

### Upload File
```bash
POST https://legal-exhibits-api.joe-1a2.workers.dev/upload
Content-Type: multipart/form-data

file: [PDF file]
```

### List Files
```bash
GET https://legal-exhibits-api.joe-1a2.workers.dev/files?prefix=cases/case-123
```

### Download File
```bash
GET https://legal-exhibits-api.joe-1a2.workers.dev/files/cases/case-123/exhibit-a.pdf
```

### Merge PDFs (using pdf-lib)
```bash
POST https://legal-exhibits-api.joe-1a2.workers.dev/merge
Content-Type: application/json

{
  "inputKeys": [
    "cases/case-123/exhibit-a.pdf",
    "cases/case-123/exhibit-b.pdf"
  ],
  "outputKey": "cases/case-123/merged.pdf"
}
```

## MCP Server Tools

All tools available via Claude Code MCP:

| Tool | Description | Runs On |
|------|-------------|---------|
| `split_pdf` | Split multi-page PDF | Local (qpdf) |
| `merge_pdfs` | Merge multiple PDFs | Local (qpdf) |
| `optimize_pdf` | Compress with high quality | Local (ghostscript) |
| `ocr_pdf` | Add searchable text layer | Local (ocrmypdf) |
| `add_bates_numbers` | Legal document stamping | Local (Python) |
| `redact_pdf` | Apply redactions | Local (Python) |
| `add_watermark` | Add diagonal watermark | Local (Python) |
| `generate_toc` | Create exhibit index | Local (Python) |
| `process_exhibit` | Full pipeline | Local (all tools) |
| `list_pdfs` | List PDFs in directory | Local (filesystem) |
| `check_dependencies` | Verify tools installed | Local (Homebrew) |

## Security Considerations

### Data Encryption
- ✅ All data in transit encrypted (HTTPS)
- ✅ R2 storage encrypted at rest
- ✅ Cloudflare Access authentication required
- ✅ Service tokens for API access
- ✅ Audit logging enabled

### Access Control
- Restrict to `@theholetruth.org` domain
- Role-based access via Cloudflare Access policies
- Time-limited guest access for specific cases
- IP restrictions (optional)

### Compliance
- PDF/A format for archival compliance
- Audit logs of all access
- Secure deletion via R2 lifecycle policies
- Redaction capabilities for privileged content

## Monitoring & Maintenance

### Worker Logs
```bash
# Stream live logs
wrangler tail --name legal-exhibits-api

# View recent logs
wrangler tail --name legal-exhibits-api --format json
```

### R2 Usage
```bash
# Check bucket size
wrangler r2 bucket info legal-exhibits

# List objects
wrangler r2 object list legal-exhibits --prefix cases/
```

### Update Worker
```bash
cd cloudflare-worker
npm run deploy
```

### Update MCP Server
```bash
cd mcp-server
npm run build
# Restart Claude Code to reload MCP server
```

## Troubleshooting

### Mount Not Working
```bash
# Check if already mounted
mount | grep legal-exhibits-r2

# Unmount if needed
umount ~/legal-exhibits-r2

# Remount with verbose logging
rclone mount legal-exhibits-r2:legal-exhibits ~/legal-exhibits-r2 \
  --vfs-cache-mode writes -vv
```

### Worker API Errors
```bash
# Check Worker status
wrangler status --name legal-exhibits-api

# View error logs
wrangler tail --name legal-exhibits-api --format pretty
```

### MCP Server Issues
```bash
# Verify dependencies
npm run check:deps

# Reinstall if needed
npm run install:deps
```

## Cost Estimates

### Cloudflare Costs
- **Workers:** Free tier (100k requests/day)
- **R2 Storage:** $0.015/GB/month
- **KV:** Free tier (1GB, 100k reads/day)
- **Access:** Free for up to 50 users

**Example monthly cost:**
- Storage: 100GB @ $0.015 = $1.50
- Worker requests: Free tier
- Total: ~$1.50/month

### Local Costs
- macOS with Homebrew: Free
- Native tools (qpdf, ghostscript): Free

## Support

- API Issues: Check Worker logs with `wrangler tail`
- MCP Server: GitHub Issues
- Cloudflare: Support Portal
- Documentation: `/docs` directory
