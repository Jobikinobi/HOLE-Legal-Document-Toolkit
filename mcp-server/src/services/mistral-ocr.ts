/**
 * Mistral OCR Service
 *
 * Provides high-quality OCR for legal documents using Mistral AI's Pixtral Large model.
 * Adapted from MISTRAL-Legal-Intelligence project for the HOLE Legal Document Toolkit.
 *
 * @module mistral-ocr
 */

import { Mistral } from '@mistralai/mistralai';
import { readFileSync } from 'fs';
import { createHash } from 'crypto';

/**
 * Mistral OCR result with page-level text extraction
 */
export interface MistralOcrResult {
  success: boolean;
  text: string;              // Combined text from all pages
  pageCount: number;
  pages: MistralOcrPage[];   // Individual page results
  model: string;             // OCR model used
  fileHash: string;          // SHA-256 hash for document tracking
  processingTimeMs: number;
}

/**
 * Individual page OCR result
 */
export interface MistralOcrPage {
  pageNumber: number;
  markdown: string;          // Markdown-formatted text with structure
  confidence?: number;       // OCR confidence score if available
}

/**
 * Mistral OCR Service
 *
 * Handles document OCR using Mistral AI API
 */
export class MistralOcrService {
  private client: Mistral;

  constructor(apiKey: string) {
    this.client = new Mistral({ apiKey });
  }

  /**
   * Perform OCR on a PDF file
   *
   * @param filePath - Path to the PDF file
   * @returns OCR result with extracted text
   */
  async ocrPdf(filePath: string): Promise<MistralOcrResult> {
    const startTime = Date.now();

    // Read file and compute hash
    const fileBuffer = readFileSync(filePath);
    const fileHash = createHash('sha256').update(fileBuffer).digest('hex');

    // Upload PDF to Mistral
    const fileBlob = new Blob([fileBuffer]);
    const uploadResponse = await this.client.files.upload({
      file: fileBlob as any,
      purpose: 'ocr'
    });

    // Get signed URL for processing
    const signedUrlResponse = await this.client.files.getSignedUrl({
      fileId: uploadResponse.id
    });

    // Perform OCR
    const ocrResponse = await this.client.ocr.process({
      model: 'mistral-ocr-latest',
      document: {
        type: 'document_url',
        documentUrl: signedUrlResponse.url
      },
      includeImageBase64: false
    });

    // Extract page data
    const pages: MistralOcrPage[] = (ocrResponse.pages || []).map((page: any, index: number) => ({
      pageNumber: index + 1,
      markdown: page.markdown || '',
      confidence: page.confidence
    }));

    // Combine all pages with page breaks
    const combinedText = pages
      .map(page => page.markdown)
      .join('\n\n--- PAGE BREAK ---\n\n');

    const processingTimeMs = Date.now() - startTime;

    // Clean up uploaded file (optional - Mistral may auto-delete)
    try {
      await this.client.files.delete({ fileId: uploadResponse.id });
    } catch {
      // Ignore cleanup errors
    }

    return {
      success: true,
      text: combinedText,
      pageCount: pages.length,
      pages,
      model: 'mistral-ocr-latest',
      fileHash,
      processingTimeMs
    };
  }

  /**
   * Check if Mistral API key is configured and valid
   */
  async checkConnection(): Promise<{ connected: boolean; error?: string }> {
    try {
      // Try to list files to verify API key works
      await this.client.files.list();
      return { connected: true };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      return { connected: false, error: errorMsg };
    }
  }
}

/**
 * Create a Mistral OCR service instance
 */
export function createMistralOcrService(apiKey: string): MistralOcrService {
  return new MistralOcrService(apiKey);
}
