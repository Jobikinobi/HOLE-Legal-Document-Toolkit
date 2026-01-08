#!/usr/bin/env node
/**
 * Legal Exhibits Toolkit - MCP Server
 *
 * An MCP server for managing legal exhibits:
 * - Split multi-page PDFs into individual pages
 * - Merge multiple PDFs into a single document
 * - Optimize PDFs for maximum compression with high quality (Adobe Acrobat-level)
 * - OCR scanned documents to make them searchable
 * - Bates numbering for legal document stamping
 * - Redaction for sensitive content
 * - Table of contents generation
 *
 * Uses native tools via Homebrew:
 * - qpdf: Fast PDF manipulation (split, merge)
 * - ghostscript: High-quality optimization and compression
 * - ocrmypdf + tesseract: OCR for scanned documents
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

import { splitPdf } from "./tools/split.js";
import { mergePdfs } from "./tools/merge.js";
import { optimizePdf, OptimizationPreset } from "./tools/optimize.js";
import { processExhibit } from "./tools/process-exhibit.js";
import { ocrPdf, extractText, checkOcrInstalled, OcrOutputType, OcrOptimizeLevel } from "./tools/ocr.js";
import { addBatesNumbers, BatesPosition } from "./tools/bates.js";
import { redactPdf, addWatermark } from "./tools/redact.js";
import { generateToc, createEntriesFromFiles } from "./tools/toc.js";
import { selectCompressionProfile, formatSelectionResult, validateAndNormalizeOptions, ProfileSelectorOptions } from "./tools/select-profile.js";
import { checkDependencies } from "./utils/dependencies.js";
import { listFiles } from "./utils/files.js";

const server = new Server(
  {
    name: "legal-exhibits-toolkit",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
      resources: {},
    },
  }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "split_pdf",
        description: "Split a multi-page PDF (e.g., from Figma export) into individual single-page PDFs. Perfect for separating exhibit pages.",
        inputSchema: {
          type: "object",
          properties: {
            input_path: {
              type: "string",
              description: "Path to the input PDF file to split",
            },
            output_dir: {
              type: "string",
              description: "Directory to save the split pages (default: ./output)",
            },
            prefix: {
              type: "string",
              description: "Prefix for output filenames (default: page)",
            },
            page_range: {
              type: "string",
              description: "Optional page range to extract (e.g., '1-5', '1,3,5', '2-'). Omit to split all pages.",
            },
          },
          required: ["input_path"],
        },
      },
      {
        name: "merge_pdfs",
        description: "Merge multiple PDF files into a single document. Maintains original quality and page order.",
        inputSchema: {
          type: "object",
          properties: {
            input_paths: {
              type: "array",
              items: { type: "string" },
              description: "Array of PDF file paths to merge, in order",
            },
            output_path: {
              type: "string",
              description: "Path for the merged output PDF",
            },
            input_dir: {
              type: "string",
              description: "Alternative: directory containing PDFs to merge (files sorted alphabetically)",
            },
            pattern: {
              type: "string",
              description: "Glob pattern when using input_dir (default: *.pdf)",
            },
          },
          required: ["output_path"],
        },
      },
      {
        name: "optimize_pdf",
        description: "Optimize a PDF for maximum compression while maintaining high quality. Choose from 11 compression profiles optimized for different use cases, with both 300 DPI (professional) and 225 DPI (digital-first) options.",
        inputSchema: {
          type: "object",
          properties: {
            input_path: {
              type: "string",
              description: "Path to the PDF to optimize",
            },
            output_path: {
              type: "string",
              description: "Path for the optimized output PDF",
            },
            preset: {
              type: "string",
              enum: [
                "printer",
                "legal-jpeg",
                "legal-balanced",
                "legal-text",
                "legal-aggressive",
                "legal-archive",
                "legal-jpeg-225",
                "legal-balanced-225",
                "legal-text-225",
                "legal-aggressive-225",
                "legal-archive-225",
                "screen",
                "ebook",
                "prepress",
                "default",
              ],
              description:
                "Compression profile - choose based on your document type and quality needs:\n\n" +
                "300 DPI (Professional Quality):\n" +
                "- printer: 30-50% compression, balanced, safe default\n" +
                "- legal-jpeg: 70-85% compression, best for scanned documents\n" +
                "- legal-balanced: 60-75% compression, mixed content (text + images)\n" +
                "- legal-text: 45-60% compression, text-heavy documents & contracts\n" +
                "- legal-aggressive: 75-85% compression, high-volume processing\n" +
                "- legal-archive: 55-70% compression, long-term legal storage\n\n" +
                "225 DPI (Digital-First, 45-60% smaller than 300 DPI):\n" +
                "- legal-jpeg-225: 80-90% compression, digital archival\n" +
                "- legal-balanced-225: 70-80% compression, digital documents\n" +
                "- legal-text-225: 55-65% compression, digital contracts\n" +
                "- legal-aggressive-225: 85-92% compression, bulk archival\n" +
                "- legal-archive-225: 65-75% compression, digital storage\n\n" +
                "Legacy Adobe Acrobat (for backward compatibility):\n" +
                "- screen: 72 dpi, smallest size, web viewing\n" +
                "- ebook: 150 dpi, balanced quality/size\n" +
                "- prepress: 300 dpi, maximum quality\n" +
                "- default: balanced optimization",
            },
            dpi: {
              type: "number",
              description:
                "Custom DPI for image downsampling (overrides preset DPI). Note: compression profiles have optimized DPI settings - use this only to override.",
            },
            grayscale: {
              type: "boolean",
              description: "Convert to grayscale (further reduces file size by 10-20%)",
            },
          },
          required: ["input_path", "output_path"],
        },
      },
      {
        name: "process_exhibit",
        description: "Full pipeline: Split Figma export, merge selected pages, OCR if needed, and optimize. Perfect for creating final exhibit documents from both digital and scanned sources.",
        inputSchema: {
          type: "object",
          properties: {
            input_path: {
              type: "string",
              description: "Path to the Figma-exported PDF or scanned document",
            },
            output_path: {
              type: "string",
              description: "Path for the final optimized exhibit PDF",
            },
            pages: {
              type: "string",
              description: "Page selection (e.g., '1-3,5,7-9'). Omit to include all pages.",
            },
            preset: {
              type: "string",
              enum: [
                "printer",
                "legal-jpeg",
                "legal-balanced",
                "legal-text",
                "legal-aggressive",
                "legal-archive",
                "legal-jpeg-225",
                "legal-balanced-225",
                "legal-text-225",
                "legal-aggressive-225",
                "legal-archive-225",
                "screen",
                "ebook",
                "prepress",
                "default",
              ],
              description:
                "Optimization profile (default: printer). Use legal-jpeg for scanned documents, legal-text for contracts, legal-aggressive for bulk processing, or 225 DPI variants for 45-50% smaller files.",
            },
            exhibit_label: {
              type: "string",
              description: "Optional label for the exhibit (e.g., 'Exhibit A')",
            },
            ocr: {
              type: "boolean",
              description: "Enable OCR for scanned documents. Adds searchable text layer while preserving appearance. Creates PDF/A compliant output.",
            },
            ocr_language: {
              type: "string",
              description: "OCR language (ISO 639-2 code). Examples: 'eng', 'eng+spa', 'eng+fra'. Default: 'eng'",
            },
          },
          required: ["input_path", "output_path"],
        },
      },
      {
        name: "check_dependencies",
        description: "Check if required system dependencies (qpdf, ghostscript) are installed and available.",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "list_pdfs",
        description: "List PDF files in a directory with their sizes and page counts.",
        inputSchema: {
          type: "object",
          properties: {
            directory: {
              type: "string",
              description: "Directory to scan for PDFs (default: current directory)",
            },
            recursive: {
              type: "boolean",
              description: "Search subdirectories recursively",
            },
          },
        },
      },
      {
        name: "ocr_pdf",
        description: "Add searchable text layer to scanned PDFs using OCR. Creates PDF/A compliant documents suitable for legal archiving. Preserves original appearance while making content searchable and copy-able.",
        inputSchema: {
          type: "object",
          properties: {
            input_path: {
              type: "string",
              description: "Path to the scanned PDF to OCR",
            },
            output_path: {
              type: "string",
              description: "Path for the OCR'd output PDF",
            },
            language: {
              type: "string",
              description: "OCR language(s). Use ISO 639-2 codes. Examples: 'eng' (English), 'eng+spa' (English+Spanish), 'eng+fra+deu' (English+French+German). Default: 'eng'",
            },
            deskew: {
              type: "boolean",
              description: "Automatically straighten tilted scans (default: true)",
            },
            clean: {
              type: "boolean",
              description: "Clean up scan artifacts and noise (default: false)",
            },
            rotate: {
              type: "boolean",
              description: "Auto-rotate pages to correct orientation (default: true)",
            },
            force_ocr: {
              type: "boolean",
              description: "Force OCR even if text layer already exists (default: false)",
            },
            output_type: {
              type: "string",
              enum: ["pdf", "pdfa", "pdfa-1", "pdfa-2", "pdfa-3"],
              description: "Output format. Use 'pdfa-2' for legal archiving compliance (default: pdfa-2)",
            },
            optimize: {
              type: "number",
              enum: [0, 1, 2, 3],
              description: "Optimization level: 0=off, 1=lossless, 2=lossy, 3=aggressive (default: 1)",
            },
          },
          required: ["input_path", "output_path"],
        },
      },
      {
        name: "extract_text",
        description: "Extract all text content from a PDF. Useful for analysis, indexing, or review.",
        inputSchema: {
          type: "object",
          properties: {
            input_path: {
              type: "string",
              description: "Path to the PDF to extract text from",
            },
          },
          required: ["input_path"],
        },
      },
      {
        name: "add_bates_numbers",
        description: "Add Bates numbers (sequential page stamps) to legal documents. Essential for discovery and court filings.",
        inputSchema: {
          type: "object",
          properties: {
            input_path: {
              type: "string",
              description: "Path to the PDF to stamp",
            },
            output_path: {
              type: "string",
              description: "Path for the Bates-numbered output PDF",
            },
            prefix: {
              type: "string",
              description: "Prefix for Bates numbers (e.g., 'SMITH-', 'EXHIBIT A-', 'DOC-')",
            },
            suffix: {
              type: "string",
              description: "Suffix after numbers (e.g., '-CONFIDENTIAL')",
            },
            start_number: {
              type: "number",
              description: "Starting number (default: 1)",
            },
            digits: {
              type: "number",
              description: "Zero-padding digits (default: 4, e.g., 0001)",
            },
            position: {
              type: "string",
              enum: ["top-left", "top-center", "top-right", "bottom-left", "bottom-center", "bottom-right"],
              description: "Position of Bates stamp (default: bottom-right)",
            },
            font_size: {
              type: "number",
              description: "Font size in points (default: 10)",
            },
          },
          required: ["input_path", "output_path"],
        },
      },
      {
        name: "redact_pdf",
        description: "Apply redactions (black boxes) to sensitive areas in a PDF. Use for privileged information, PII, etc.",
        inputSchema: {
          type: "object",
          properties: {
            input_path: {
              type: "string",
              description: "Path to the PDF to redact",
            },
            output_path: {
              type: "string",
              description: "Path for the redacted output PDF",
            },
            areas: {
              type: "array",
              description: "Array of areas to redact: [{page, x, y, width, height, label?}]",
              items: {
                type: "object",
                properties: {
                  page: { type: "number", description: "Page number (1-indexed)" },
                  x: { type: "number", description: "X coordinate from left" },
                  y: { type: "number", description: "Y coordinate from bottom" },
                  width: { type: "number", description: "Width of redaction box" },
                  height: { type: "number", description: "Height of redaction box" },
                  label: { type: "string", description: "Optional label (e.g., '[REDACTED]')" },
                },
              },
            },
            redact_headers: {
              type: "boolean",
              description: "Redact header area on all pages",
            },
            redact_footers: {
              type: "boolean",
              description: "Redact footer area on all pages",
            },
            header_height: {
              type: "number",
              description: "Height of header region to redact (default: 50)",
            },
            footer_height: {
              type: "number",
              description: "Height of footer region to redact (default: 50)",
            },
          },
          required: ["input_path", "output_path"],
        },
      },
      {
        name: "add_watermark",
        description: "Add a diagonal text watermark to all pages (e.g., 'CONFIDENTIAL', 'DRAFT', 'COPY').",
        inputSchema: {
          type: "object",
          properties: {
            input_path: {
              type: "string",
              description: "Path to the PDF to watermark",
            },
            output_path: {
              type: "string",
              description: "Path for the watermarked output PDF",
            },
            text: {
              type: "string",
              description: "Watermark text (e.g., 'CONFIDENTIAL', 'DRAFT')",
            },
            font_size: {
              type: "number",
              description: "Font size (default: 60)",
            },
            opacity: {
              type: "number",
              description: "Opacity 0-1 (default: 0.3)",
            },
            rotation: {
              type: "number",
              description: "Rotation angle in degrees (default: -45)",
            },
          },
          required: ["input_path", "output_path", "text"],
        },
      },
      {
        name: "generate_toc",
        description: "Generate a Table of Contents / Exhibit Index page for a collection of legal exhibits.",
        inputSchema: {
          type: "object",
          properties: {
            output_path: {
              type: "string",
              description: "Path for the generated TOC PDF",
            },
            entries: {
              type: "array",
              description: "Array of exhibit entries",
              items: {
                type: "object",
                properties: {
                  label: { type: "string", description: "Exhibit label (e.g., 'Exhibit A')" },
                  description: { type: "string", description: "Brief description" },
                  batesStart: { type: "string", description: "Starting Bates number" },
                  batesEnd: { type: "string", description: "Ending Bates number" },
                  pageCount: { type: "number", description: "Number of pages" },
                },
              },
            },
            title: {
              type: "string",
              description: "TOC title (default: 'TABLE OF CONTENTS')",
            },
            subtitle: {
              type: "string",
              description: "Subtitle (e.g., case name)",
            },
            case_caption: {
              type: "string",
              description: "Full case caption (can include newlines)",
            },
            prepared_by: {
              type: "string",
              description: "Preparer name/firm",
            },
            prepared_for: {
              type: "string",
              description: "Recipient name",
            },
            date: {
              type: "string",
              description: "Date string",
            },
            include_page_numbers: {
              type: "boolean",
              description: "Include page count column (default: true)",
            },
            include_bates_numbers: {
              type: "boolean",
              description: "Include Bates range column (default: true)",
            },
          },
          required: ["output_path", "entries"],
        },
      },
      {
        name: "select_compression_profile",
        description: "Interactive wizard to help select the best compression profile for your document. Asks about your use case, document type, and priority (quality vs file size), then recommends profiles ranked by fit. Optionally analyze an actual PDF to get personalized recommendations.",
        inputSchema: {
          type: "object",
          properties: {
            use_case: {
              type: "string",
              enum: ["print", "digital", "archive", "bulk"],
              description: "Intended use case for the document (print=will be printed, digital=email/cloud only, archive=long-term storage, bulk=high-volume processing)",
            },
            document_type: {
              type: "string",
              enum: ["scanned", "text", "mixed", "unknown"],
              description: "Type of content (scanned=image-based, text=text-only like contracts, mixed=both, unknown=unsure)",
            },
            size_priority: {
              type: "string",
              enum: ["quality", "balanced", "aggressive"],
              description: "Priority for optimization (quality=minimize loss, balanced=compromise, aggressive=maximum compression)",
            },
            will_print: {
              type: "boolean",
              description: "Will this document be printed later? Helps prioritize 300 DPI profiles.",
            },
            sample_pdf_path: {
              type: "string",
              description: "Optional: Path to a sample PDF to analyze for personalized recommendations. Detects images, text, color, signatures.",
            },
          },
        },
      },
      {
        name: "analyze_pdf_for_profile",
        description: "Analyze a PDF document to detect its characteristics (images, text, color, signatures) and get profile recommendations. Returns detailed analysis and ranked profile suggestions based on document content.",
        inputSchema: {
          type: "object",
          properties: {
            pdf_path: {
              type: "string",
              description: "Path to the PDF file to analyze",
            },
          },
          required: ["pdf_path"],
        },
      },
    ],
  };
});

// List resources (processed files)
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  const files = await listFiles("./output", "*.pdf");
  return {
    resources: files.map((file) => ({
      uri: `file://${file.path}`,
      name: file.name,
      mimeType: "application/pdf",
      description: `${file.size} - ${file.pages} pages`,
    })),
  };
});

// Read resource
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const uri = request.params.uri;
  if (!uri.startsWith("file://")) {
    throw new Error("Only file:// URIs are supported");
  }

  const filePath = uri.replace("file://", "");
  const fs = await import("fs/promises");
  const content = await fs.readFile(filePath);

  return {
    contents: [
      {
        uri,
        mimeType: "application/pdf",
        blob: content.toString("base64"),
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (!args) {
    return {
      content: [{ type: "text", text: "Error: No arguments provided" }],
      isError: true,
    };
  }

  try {
    switch (name) {
      case "split_pdf": {
        const result = await splitPdf({
          inputPath: args.input_path as string,
          outputDir: args.output_dir as string | undefined,
          prefix: args.prefix as string | undefined,
          pageRange: args.page_range as string | undefined,
        });
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      }

      case "merge_pdfs": {
        const result = await mergePdfs({
          inputPaths: args.input_paths as string[] | undefined,
          outputPath: args.output_path as string,
          inputDir: args.input_dir as string | undefined,
          pattern: args.pattern as string | undefined,
        });
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      }

      case "optimize_pdf": {
        const result = await optimizePdf({
          inputPath: args.input_path as string,
          outputPath: args.output_path as string,
          preset: args.preset as OptimizationPreset | undefined,
          dpi: args.dpi as number | undefined,
          grayscale: args.grayscale as boolean | undefined,
        });
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      }

      case "process_exhibit": {
        const result = await processExhibit({
          inputPath: args.input_path as string,
          outputPath: args.output_path as string,
          pages: args.pages as string | undefined,
          preset: args.preset as OptimizationPreset | undefined,
          exhibitLabel: args.exhibit_label as string | undefined,
          ocr: args.ocr as boolean | undefined,
          ocrLanguage: args.ocr_language as string | undefined,
        });
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      }

      case "check_dependencies": {
        const result = await checkDependencies();
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      }

      case "list_pdfs": {
        const files = await listFiles(
          args.directory as string | undefined,
          "*.pdf",
          args.recursive as boolean | undefined
        );
        return {
          content: [{ type: "text", text: JSON.stringify(files, null, 2) }],
        };
      }

      case "ocr_pdf": {
        const result = await ocrPdf({
          inputPath: args.input_path as string,
          outputPath: args.output_path as string,
          language: args.language as string | undefined,
          deskew: args.deskew as boolean | undefined,
          clean: args.clean as boolean | undefined,
          rotate: args.rotate as boolean | undefined,
          forceOcr: args.force_ocr as boolean | undefined,
          outputType: args.output_type as OcrOutputType | undefined,
          optimize: args.optimize as OcrOptimizeLevel | undefined,
        });
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      }

      case "extract_text": {
        const text = await extractText(args.input_path as string);
        return {
          content: [{ type: "text", text }],
        };
      }

      case "add_bates_numbers": {
        const result = await addBatesNumbers({
          inputPath: args.input_path as string,
          outputPath: args.output_path as string,
          prefix: args.prefix as string | undefined,
          suffix: args.suffix as string | undefined,
          startNumber: args.start_number as number | undefined,
          digits: args.digits as number | undefined,
          position: args.position as BatesPosition | undefined,
          fontSize: args.font_size as number | undefined,
        });
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      }

      case "redact_pdf": {
        const result = await redactPdf({
          inputPath: args.input_path as string,
          outputPath: args.output_path as string,
          areas: args.areas as Array<{
            page: number;
            x: number;
            y: number;
            width: number;
            height: number;
            label?: string;
          }> | undefined,
          redactHeaders: args.redact_headers as boolean | undefined,
          redactFooters: args.redact_footers as boolean | undefined,
          headerHeight: args.header_height as number | undefined,
          footerHeight: args.footer_height as number | undefined,
        });
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      }

      case "add_watermark": {
        const result = await addWatermark({
          inputPath: args.input_path as string,
          outputPath: args.output_path as string,
          text: args.text as string,
          fontSize: args.font_size as number | undefined,
          opacity: args.opacity as number | undefined,
          rotation: args.rotation as number | undefined,
        });
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      }

      case "generate_toc": {
        const result = await generateToc({
          outputPath: args.output_path as string,
          entries: args.entries as Array<{
            label: string;
            description: string;
            batesStart?: string;
            batesEnd?: string;
            pageCount?: number;
          }>,
          title: args.title as string | undefined,
          subtitle: args.subtitle as string | undefined,
          caseCaption: args.case_caption as string | undefined,
          preparedBy: args.prepared_by as string | undefined,
          preparedFor: args.prepared_for as string | undefined,
          date: args.date as string | undefined,
          includePageNumbers: args.include_page_numbers as boolean | undefined,
          includeBatesNumbers: args.include_bates_numbers as boolean | undefined,
        });
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      }

      case "select_compression_profile": {
        const options: ProfileSelectorOptions = {
          useCase: args.use_case as "print" | "digital" | "archive" | "bulk" | undefined,
          documentType: args.document_type as "scanned" | "text" | "mixed" | "unknown" | undefined,
          sizePriority: args.size_priority as "quality" | "balanced" | "aggressive" | undefined,
          willPrint: args.will_print as boolean | undefined,
          samplePdfPath: args.sample_pdf_path as string | undefined,
        };

        // Validate and normalize options
        const validatedOptions = validateAndNormalizeOptions(options);

        // Run the profile selector
        const result = await selectCompressionProfile(validatedOptions);

        // Format the result for display
        const formattedResult = formatSelectionResult(result);

        return {
          content: [{ type: "text", text: formattedResult }],
        };
      }

      case "analyze_pdf_for_profile": {
        const { analyzePdf, formatAnalysisResult } = await import("./utils/pdf-analyzer.js");
        const pdfPath = args.pdf_path as string;

        try {
          const analysis = await analyzePdf(pdfPath);
          const { scoreProfiles, formatScoreResults } = await import("./utils/profile-scoring.js");

          // Get profile recommendations based on detected characteristics
          const scores = scoreProfiles({}, analysis);

          const result =
            formatAnalysisResult(analysis) +
            "\n\n" +
            formatScoreResults(scores);

          return {
            content: [{ type: "text", text: result }],
          };
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error);
          return {
            content: [{ type: "text", text: `Failed to analyze PDF: ${errorMsg}` }],
            isError: true,
          };
        }
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      content: [{ type: "text", text: `Error: ${errorMessage}` }],
      isError: true,
    };
  }
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();

  // Handle transport errors silently (EPIPE, etc.)
  transport.onerror = (error) => {
    // Silently ignore transport errors - logging corrupts MCP protocol
  };

  // Handle server errors
  server.onerror = (error) => {
    // Silently ignore server errors - logging corrupts MCP protocol
  };

  // Handle unhandled rejections
  process.on('unhandledRejection', (error) => {
    // Silently ignore - logging corrupts MCP protocol
  });

  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    // Silently ignore - logging corrupts MCP protocol
  });

  await server.connect(transport);
  // Server started - do not log to stdio as it corrupts the MCP protocol
}

main().catch((error) => {
  // Silently fail - logging to stderr corrupts the MCP protocol
  process.exit(1);
});
