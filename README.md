# Legal Exhibits Toolkit

A professional toolkit for managing legal exhibits - merge, split, and optimize PDFs with **Adobe Acrobat-level quality**. Designed for legal professionals who use Figma to design exhibits and need production-ready PDFs.

## Features

- **Split PDFs**: Extract individual pages from Figma exports
- **Merge PDFs**: Combine multiple pages/documents into single exhibits
- **Optimize PDFs**: Compress with Ghostscript (matches Adobe Acrobat quality)
- **OCR Support**: Make scanned documents searchable with Tesseract OCR
- **PDF/A Compliance**: Create legally-archivable documents
- **Full Pipeline**: Process Figma → Split → Merge → OCR → Optimize in one command
- **MCP Server**: Integrate with Claude and other AI assistants
- **Cloudflare API**: Remote file storage and basic operations

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Legal Exhibits Toolkit                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────┐         ┌──────────────────────────────┐  │
│  │   MCP Server     │         │   Cloudflare Workers + R2    │  │
│  │   (Local/VPS)    │         │   (Remote Deployment)        │  │
│  │                  │         │                              │  │
│  │  • qpdf          │ ◄─────► │  • File upload/download      │  │
│  │  • ghostscript   │         │  • Basic merge/split         │  │
│  │  • ocrmypdf      │         │  • Job queue                 │  │
│  │  • tesseract     │         │  • R2 storage                │  │
│  └──────────────────┘         └──────────────────────────────┘  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Why hybrid?** Cloudflare Workers can't run native binaries (Ghostscript, QPDF). The MCP server handles heavy processing locally, while Workers handle storage and API.

## Quick Start

### 1. Install System Dependencies

```bash
# macOS (Homebrew)
brew install qpdf gs poppler ocrmypdf tesseract

# Or use the installer script
npm run install:deps
```

### 2. Install Node Dependencies

```bash
npm install
```

### 3. Verify Installation

```bash
npm run check:deps
```

### 4. Run MCP Server

```bash
npm run mcp:dev
```

## MCP Server Tools

The MCP server exposes these tools for AI assistants:

### `split_pdf`
Split a multi-page PDF into individual pages.

```json
{
  "input_path": "/path/to/figma-export.pdf",
  "output_dir": "./output",
  "prefix": "exhibit_a",
  "page_range": "1-5"
}
```

### `merge_pdfs`
Merge multiple PDFs into a single document.

```json
{
  "input_paths": ["page1.pdf", "page2.pdf", "page3.pdf"],
  "output_path": "./output/merged.pdf"
}
```

Or merge all PDFs in a directory:

```json
{
  "input_dir": "./split_pages",
  "output_path": "./output/merged.pdf",
  "pattern": "*.pdf"
}
```

### `optimize_pdf`
Optimize a PDF for maximum compression with high quality.

```json
{
  "input_path": "./merged.pdf",
  "output_path": "./final_exhibit.pdf",
  "preset": "printer"
}
```

**Presets** (match Adobe Acrobat):
| Preset | DPI | Use Case |
|--------|-----|----------|
| `screen` | 72 | Web viewing, smallest size |
| `ebook` | 150 | Digital distribution, balanced |
| `printer` | 300 | Office printing, high quality |
| `prepress` | 300 | Professional printing, maximum quality |
| `default` | 150 | Smart optimization |

### `process_exhibit`
Full pipeline: Split → Merge selected pages → OCR (optional) → Optimize.

```json
{
  "input_path": "./figma-export.pdf",
  "output_path": "./exhibits/exhibit_a.pdf",
  "pages": "1-3,5,7-9",
  "preset": "printer",
  "exhibit_label": "Exhibit A",
  "ocr": true,
  "ocr_language": "eng"
}
```

### `ocr_pdf`
Add searchable text layer to scanned PDFs. Creates PDF/A compliant documents.

```json
{
  "input_path": "./scanned-document.pdf",
  "output_path": "./searchable-document.pdf",
  "language": "eng",
  "deskew": true,
  "rotate": true,
  "output_type": "pdfa-2",
  "optimize": 1
}
```

**Language codes** (ISO 639-2):
| Code | Language | Multi-language Example |
|------|----------|------------------------|
| `eng` | English | `eng` |
| `spa` | Spanish | `eng+spa` |
| `fra` | French | `eng+fra+deu` |
| `deu` | German | |
| `chi_sim` | Chinese (Simplified) | |

**Output types**:
- `pdfa-2`: Recommended for legal archiving (ISO 19005-2)
- `pdfa-3`: Latest PDF/A standard with embedded files
- `pdf`: Standard PDF (no archiving compliance)

### `extract_text`
Extract all text content from a PDF for analysis or review.

```json
{
  "input_path": "./document.pdf"
}
```

### `check_dependencies`
Verify all system tools are installed (including OCR).

### `list_pdfs`
List PDF files with metadata (size, page count).

## Claude Desktop Integration

Add to your Claude Desktop config (`~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "legal-exhibits": {
      "command": "node",
      "args": ["/path/to/legal-exhibits-toolkit/mcp-server/dist/index.js"]
    }
  }
}
```

Or for development:

```json
{
  "mcpServers": {
    "legal-exhibits": {
      "command": "npx",
      "args": ["tsx", "/path/to/legal-exhibits-toolkit/mcp-server/src/index.ts"]
    }
  }
}
```

## Cloudflare Workers Deployment

### 1. Configure Wrangler

Edit `cloudflare-worker/wrangler.toml`:

```toml
account_id = "your-account-id"

[[r2_buckets]]
binding = "PDF_BUCKET"
bucket_name = "your-bucket-name"

[[kv_namespaces]]
binding = "JOB_STATUS"
id = "your-kv-namespace-id"
```

### 2. Create R2 Bucket

```bash
wrangler r2 bucket create legal-exhibits
```

### 3. Create KV Namespace

```bash
wrangler kv:namespace create JOB_STATUS
```

### 4. Deploy

```bash
npm run worker:deploy
```

### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Health check |
| `/upload` | POST | Upload PDF to R2 |
| `/files` | GET | List files |
| `/files/:key` | GET | Download file |
| `/files/:key` | DELETE | Delete file |
| `/merge` | POST | Merge PDFs (pdf-lib) |
| `/split` | POST | Split PDF (pdf-lib) |
| `/optimize` | POST | Queue optimization job* |
| `/jobs/:id` | GET | Check job status |

*Requires external processor for Ghostscript optimization.

## Workflow Examples

### Processing Figma Legal Exhibits

1. **Export from Figma**: Export your exhibit designs as a single PDF

2. **Process with MCP**:
   ```
   User: Process my Figma export into Exhibit A, using pages 1-3 and 5-7

   Claude: I'll use the process_exhibit tool to:
   - Split the PDF
   - Extract pages 1-3, 5-7
   - Merge them in order
   - Optimize for printing

   Result: Exhibit A created - 2.4MB → 890KB (63% smaller)
   ```

3. **Or via CLI**:
   ```bash
   # Split
   qpdf figma-export.pdf --pages . 1-3,5-7 -- selected.pdf

   # Optimize with Ghostscript
   gs -sDEVICE=pdfwrite -dPDFSETTINGS=/printer \
      -dNOPAUSE -dQUIET -dBATCH \
      -sOutputFile=exhibit_a.pdf selected.pdf
   ```

### Processing Scanned Documents with OCR

1. **For opposing counsel's scanned PDFs**:
   ```
   User: OCR this scanned deposition transcript and make it searchable

   Claude: I'll use the ocr_pdf tool to:
   - Add searchable text layer
   - Auto-deskew tilted pages
   - Create PDF/A-2 compliant output

   Result: 45 pages processed, document is now searchable
   ```

2. **Via CLI**:
   ```bash
   # OCR with PDF/A-2 output for legal archiving
   ocrmypdf --deskew --rotate-pages \
            --output-type pdfa-2 \
            scanned.pdf searchable.pdf
   ```

3. **Multi-language documents** (e.g., bilingual contracts):
   ```json
   {
     "input_path": "./bilingual-contract.pdf",
     "output_path": "./searchable-contract.pdf",
     "language": "eng+spa"
   }
   ```

## Optimization Quality Comparison

| Tool | Compression | Quality | Speed |
|------|-------------|---------|-------|
| Ghostscript (prepress) | Excellent | Maximum | Slow |
| Ghostscript (printer) | Very Good | High | Medium |
| QPDF | Good | Lossless | Fast |
| pdf-lib (Workers) | Minimal | Lossless | Fast |

**Recommendation**: Use `printer` preset for most legal documents. Use `prepress` for court filings requiring maximum quality.

## Project Structure

```
legal-exhibits-toolkit/
├── mcp-server/           # MCP server with PDF tools
│   ├── src/
│   │   ├── index.ts      # Main server entry
│   │   ├── tools/        # PDF processing tools
│   │   │   ├── split.ts
│   │   │   ├── merge.ts
│   │   │   ├── optimize.ts
│   │   │   ├── ocr.ts
│   │   │   └── process-exhibit.ts
│   │   └── utils/        # Helper utilities
│   └── package.json
├── cloudflare-worker/    # Cloudflare Workers API
│   ├── src/
│   │   └── index.ts      # Hono-based API
│   ├── wrangler.toml
│   └── package.json
├── scripts/              # Setup scripts
├── input/                # Input files directory
├── output/               # Processed files directory
├── temp/                 # Temporary processing files
└── package.json          # Root package
```

## Requirements

### System Dependencies
- **qpdf** ≥ 11.0 (PDF manipulation)
- **ghostscript** ≥ 10.0 (optimization)
- **ocrmypdf** ≥ 16.0 (OCR processing)
- **tesseract** ≥ 5.0 (OCR engine)
- **poppler** (recommended, for page count)

### Node.js
- Node.js ≥ 18.0
- npm ≥ 9.0

## Troubleshooting

### "qpdf not found"
```bash
brew install qpdf  # macOS
sudo apt install qpdf  # Ubuntu/Debian
```

### "gs not found"
```bash
brew install gs  # macOS
sudo apt install ghostscript  # Ubuntu/Debian
```

### "ocrmypdf not found"
```bash
brew install ocrmypdf tesseract  # macOS
sudo apt install ocrmypdf tesseract-ocr  # Ubuntu/Debian
```

### OCR produces poor results
- Ensure document is high-resolution (300+ DPI)
- Enable `deskew: true` for tilted scans
- Enable `clean: true` for noisy documents
- Try different languages if text is multilingual

### Large file processing timeout
Increase the timeout in your MCP client or process in smaller batches.

### Cloudflare Workers size limit
Workers have a 25MB request limit. For larger files, upload directly to R2.

## License

MIT

## Sources & References

- [QPDF Documentation](https://qpdf.readthedocs.io/)
- [Ghostscript PDF Optimization](https://ghostscript.readthedocs.io/en/latest/VectorDevices.html)
- [OCRmyPDF Documentation](https://ocrmypdf.readthedocs.io/)
- [Tesseract OCR](https://github.com/tesseract-ocr/tesseract)
- [MCP Protocol Specification](https://modelcontextprotocol.io/specification/2025-03-26)
- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [pdf-lib Library](https://pdf-lib.js.org/)
- [Figma PDF Export Best Practices](https://help.figma.com/hc/en-us/articles/13402894554519-Export-formats-and-settings)
