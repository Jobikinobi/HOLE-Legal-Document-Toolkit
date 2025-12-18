/**
 * Cloudflare Worker entry point for Legal Exhibits MCP Server
 *
 * This worker exposes the MCP server tools as a remote HTTP MCP server.
 * Uses workers-mcp ProxyToSelf pattern to automatically handle MCP protocol.
 */

import { WorkerEntrypoint } from 'cloudflare:workers';
import { ProxyToSelf } from 'workers-mcp';

// Environment variables interface
interface Env {
  SHARED_SECRET?: string;
  MISTRAL_API_KEY?: string;
}

// Import tool implementations
// Note: These tools use native binaries (qpdf, ghostscript) so they won't actually run in Workers.
// This server serves as documentation and a bridge - actual processing happens elsewhere.

export default class LegalExhibitsMCP extends WorkerEntrypoint<Env> {
  /**
   * Split a multi-page PDF into individual single-page PDFs
   */
  async split_pdf(params: {
    input_path: string;
    output_dir?: string;
    prefix?: string;
    page_range?: string;
  }) {
    return {
      error: 'This operation requires native binaries (qpdf) and cannot run in Cloudflare Workers.',
      message: 'Use the local MCP server or configure a remote processing server.',
      tool: 'split_pdf',
      params
    };
  }

  /**
   * Merge multiple PDF files into a single document
   */
  async merge_pdfs(params: {
    input_paths?: string[];
    output_path: string;
    input_dir?: string;
    pattern?: string;
  }) {
    return {
      error: 'This operation requires native binaries (qpdf) and cannot run in Cloudflare Workers.',
      message: 'Use the local MCP server or configure a remote processing server.',
      tool: 'merge_pdfs',
      params
    };
  }

  /**
   * Optimize a PDF for maximum compression
   */
  async optimize_pdf(params: {
    input_path: string;
    output_path: string;
    preset?: 'screen' | 'ebook' | 'printer' | 'prepress' | 'default';
    dpi?: number;
    grayscale?: boolean;
  }) {
    return {
      error: 'This operation requires native binaries (Ghostscript) and cannot run in Cloudflare Workers.',
      message: 'Use the local MCP server or configure a remote processing server.',
      tool: 'optimize_pdf',
      params
    };
  }

  /**
   * Full pipeline: Split, merge, OCR if needed, and optimize
   */
  async process_exhibit(params: {
    input_path: string;
    output_path: string;
    pages?: string;
    ocr?: boolean;
    ocr_language?: string;
    preset?: 'screen' | 'ebook' | 'printer' | 'prepress' | 'default';
    exhibit_label?: string;
  }) {
    return {
      error: 'This operation requires native binaries (qpdf, Ghostscript, OCR) and cannot run in Cloudflare Workers.',
      message: 'Use the local MCP server or configure a remote processing server.',
      tool: 'process_exhibit',
      params
    };
  }

  /**
   * Add searchable text layer to scanned PDFs using OCR
   */
  async ocr_pdf(params: {
    input_path: string;
    output_path: string;
    language?: string;
    deskew?: boolean;
    rotate?: boolean;
    clean?: boolean;
    force_ocr?: boolean;
    output_type?: 'pdf' | 'pdfa' | 'pdfa-1' | 'pdfa-2' | 'pdfa-3';
    optimize?: 0 | 1 | 2 | 3;
  }) {
    return {
      error: 'This operation requires native binaries (OCRmyPDF, Tesseract) and cannot run in Cloudflare Workers.',
      message: 'Use the local MCP server or configure a remote processing server.',
      tool: 'ocr_pdf',
      params
    };
  }

  /**
   * Extract all text content from a PDF
   */
  async extract_text(params: {
    input_path: string;
  }) {
    return {
      error: 'This operation requires native binaries and cannot run in Cloudflare Workers.',
      message: 'Use the local MCP server or configure a remote processing server.',
      tool: 'extract_text',
      params
    };
  }

  /**
   * Add Bates numbers to legal documents
   */
  async add_bates_numbers(params: {
    input_path: string;
    output_path: string;
    prefix?: string;
    start_number?: number;
    digits?: number;
    suffix?: string;
    position?: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
    font_size?: number;
  }) {
    return {
      error: 'This operation requires native binaries and cannot run in Cloudflare Workers.',
      message: 'Use the local MCP server or configure a remote processing server.',
      tool: 'add_bates_numbers',
      params
    };
  }

  /**
   * Apply redactions to sensitive areas in a PDF
   */
  async redact_pdf(params: {
    input_path: string;
    output_path: string;
    areas?: Array<{
      page: number;
      x: number;
      y: number;
      width: number;
      height: number;
      label?: string;
    }>;
    redact_headers?: boolean;
    redact_footers?: boolean;
    header_height?: number;
    footer_height?: number;
  }) {
    return {
      error: 'This operation requires native binaries and cannot run in Cloudflare Workers.',
      message: 'Use the local MCP server or configure a remote processing server.',
      tool: 'redact_pdf',
      params
    };
  }

  /**
   * Add a watermark to all pages
   */
  async add_watermark(params: {
    input_path: string;
    output_path: string;
    text: string;
    opacity?: number;
    rotation?: number;
    font_size?: number;
  }) {
    return {
      error: 'This operation requires native binaries and cannot run in Cloudflare Workers.',
      message: 'Use the local MCP server or configure a remote processing server.',
      tool: 'add_watermark',
      params
    };
  }

  /**
   * Generate a Table of Contents page
   */
  async generate_toc(params: {
    output_path: string;
    entries: Array<{
      label?: string;
      description?: string;
      pageCount?: number;
      batesStart?: string;
      batesEnd?: string;
    }>;
    title?: string;
    subtitle?: string;
    date?: string;
    prepared_by?: string;
    prepared_for?: string;
    case_caption?: string;
    include_page_numbers?: boolean;
    include_bates_numbers?: boolean;
  }) {
    return {
      error: 'This operation requires native binaries and cannot run in Cloudflare Workers.',
      message: 'Use the local MCP server or configure a remote processing server.',
      tool: 'generate_toc',
      params
    };
  }

  /**
   * Check if dependencies are installed
   */
  async check_dependencies() {
    return {
      available: false,
      message: 'Native dependencies (qpdf, ghostscript, ocrmypdf) cannot run in Cloudflare Workers.',
      recommendation: 'Use the local MCP server which has access to these tools via Homebrew.'
    };
  }

  /**
   * List PDF files in a directory
   */
  async list_pdfs(params: {
    directory?: string;
    recursive?: boolean;
  }) {
    return {
      error: 'File system access not available in Cloudflare Workers.',
      message: 'Use the local MCP server for file system operations.',
      tool: 'list_pdfs',
      params
    };
  }

  /**
   * Required fetch handler for MCP protocol
   */
  async fetch(request: Request): Promise<Response> {
    return new ProxyToSelf(this as any).fetch(request);
  }
}
