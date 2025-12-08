#!/usr/bin/env node
/**
 * Legal Exhibits Toolkit - MCP Server
 *
 * An MCP server for managing legal exhibits:
 * - Split multi-page PDFs into individual pages
 * - Merge multiple PDFs into a single document
 * - Optimize PDFs for maximum compression with high quality (Adobe Acrobat-level)
 *
 * Uses native tools via Homebrew:
 * - qpdf: Fast PDF manipulation (split, merge)
 * - ghostscript: High-quality optimization and compression
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
        description: "Optimize a PDF for maximum compression while maintaining high quality. Uses Ghostscript with Adobe Acrobat-equivalent settings.",
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
              enum: ["screen", "ebook", "printer", "prepress", "default"],
              description: "Quality preset:\n- screen: 72 dpi, smallest size, good for web\n- ebook: 150 dpi, balanced quality/size\n- printer: 300 dpi, high quality for printing\n- prepress: 300 dpi, maximum quality (like Acrobat)\n- default: balanced optimization",
            },
            dpi: {
              type: "number",
              description: "Custom DPI for image downsampling (overrides preset)",
            },
            grayscale: {
              type: "boolean",
              description: "Convert to grayscale (further reduces size)",
            },
          },
          required: ["input_path", "output_path"],
        },
      },
      {
        name: "process_exhibit",
        description: "Full pipeline: Split Figma export, merge selected pages, and optimize. Perfect for creating final exhibit documents.",
        inputSchema: {
          type: "object",
          properties: {
            input_path: {
              type: "string",
              description: "Path to the Figma-exported PDF",
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
              enum: ["screen", "ebook", "printer", "prepress", "default"],
              description: "Optimization quality preset (default: printer)",
            },
            exhibit_label: {
              type: "string",
              description: "Optional label for the exhibit (e.g., 'Exhibit A')",
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
  await server.connect(transport);
  console.error("Legal Exhibits MCP Server started");
}

main().catch(console.error);
