/**
 * R2 API Tools for MCP Server
 *
 * Provides tools to query and access files in the legal-exhibits R2 bucket
 * via the secure API endpoint.
 */

import { config } from 'dotenv';
import { join } from 'path';

// Load environment variables
config({ path: join(process.cwd(), '.env') });

const API_URL = process.env.LEGAL_EXHIBITS_API_URL || 'https://legal-exhibits.theholetruth.org';
const CLIENT_ID = process.env.CF_ACCESS_CLIENT_ID;
const CLIENT_SECRET = process.env.CF_ACCESS_CLIENT_SECRET;

interface R2File {
  key: string;
  size: number;
  uploaded: string;
  etag: string;
}

interface ListFilesResponse {
  files: R2File[];
  truncated: boolean;
  cursor?: string;
}

/**
 * Make authenticated API request
 */
async function apiRequest(path: string, options: RequestInit = {}): Promise<Response> {
  const headers = new Headers(options.headers);

  if (CLIENT_ID && CLIENT_SECRET) {
    headers.set('CF-Access-Client-Id', CLIENT_ID);
    headers.set('CF-Access-Client-Secret', CLIENT_SECRET);
  }

  return fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });
}

/**
 * List files in R2 bucket
 */
export async function listR2Files(params: {
  prefix?: string;
  limit?: number;
}): Promise<{
  success: boolean;
  files?: R2File[];
  error?: string;
}> {
  try {
    const query = new URLSearchParams();
    if (params.prefix) query.set('prefix', params.prefix);
    if (params.limit) query.set('limit', params.limit.toString());

    const response = await apiRequest(`/files?${query.toString()}`);

    if (!response.ok) {
      return {
        success: false,
        error: `API returned ${response.status}: ${response.statusText}`,
      };
    }

    const data = await response.json() as ListFilesResponse;

    return {
      success: true,
      files: data.files,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Get file metadata
 */
export async function getR2FileInfo(key: string): Promise<{
  success: boolean;
  file?: R2File;
  error?: string;
}> {
  try {
    const response = await apiRequest(`/files/${encodeURIComponent(key)}`, {
      method: 'HEAD',
    });

    if (!response.ok) {
      return {
        success: false,
        error: `File not found or access denied: ${response.status}`,
      };
    }

    const size = response.headers.get('content-length');
    const etag = response.headers.get('etag');
    const lastModified = response.headers.get('last-modified');

    return {
      success: true,
      file: {
        key,
        size: size ? parseInt(size) : 0,
        uploaded: lastModified || new Date().toISOString(),
        etag: etag || '',
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Download file from R2
 */
export async function downloadR2File(params: {
  key: string;
  outputPath: string;
}): Promise<{
  success: boolean;
  path?: string;
  size?: number;
  error?: string;
}> {
  try {
    const response = await apiRequest(`/files/${encodeURIComponent(params.key)}`);

    if (!response.ok) {
      return {
        success: false,
        error: `Failed to download: ${response.status} ${response.statusText}`,
      };
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    const fs = await import('fs/promises');

    // Ensure directory exists
    const { dirname } = await import('path');
    await fs.mkdir(dirname(params.outputPath), { recursive: true });

    // Write file
    await fs.writeFile(params.outputPath, buffer);

    return {
      success: true,
      path: params.outputPath,
      size: buffer.length,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Get file download URL
 */
export function getR2FileUrl(key: string): string {
  return `${API_URL}/files/${encodeURIComponent(key)}`;
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

/**
 * Format date for display
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleString();
}
