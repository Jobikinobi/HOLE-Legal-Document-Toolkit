/**
 * Legal Exhibits Toolkit - Cloudflare Worker API
 *
 * Provides:
 * - File upload to R2 storage
 * - Basic PDF operations (merge/split) using pdf-lib (runs on Workers)
 * - Job queue for heavy processing (delegated to external processor)
 * - File serving with signed URLs
 *
 * Note: Heavy optimization (Ghostscript) must run on external server.
 * This worker handles storage, API, and coordination.
 */

import { Hono } from "hono";
import { cors } from "hono/cors";
import { PDFDocument } from "pdf-lib";

// Type definitions for Cloudflare bindings
interface Env {
  PDF_BUCKET: R2Bucket;
  JOB_STATUS: KVNamespace;
  ENVIRONMENT: string;
  MAX_FILE_SIZE_MB: string;
  PROCESSOR_WEBHOOK_URL?: string;
  PROCESSOR_API_KEY?: string;
}

interface JobStatus {
  id: string;
  status: "pending" | "processing" | "completed" | "failed";
  operation: string;
  inputFiles: string[];
  outputFile?: string;
  createdAt: string;
  updatedAt: string;
  error?: string;
  result?: Record<string, unknown>;
}

const app = new Hono<{ Bindings: Env }>();

// Enable CORS
app.use("*", cors());

// Health check
app.get("/", (c) => {
  return c.json({
    name: "Legal Exhibits Toolkit API",
    version: "1.0.0",
    status: "healthy",
    endpoints: {
      upload: "POST /upload",
      download: "GET /files/:key",
      list: "GET /files",
      merge: "POST /merge",
      split: "POST /split",
      optimize: "POST /optimize (requires external processor)",
      jobs: "GET /jobs/:id",
    },
  });
});

// ============================================
// File Management Endpoints
// ============================================

/**
 * Upload a PDF file to R2
 */
app.post("/upload", async (c) => {
  const env = c.env;
  const maxSizeMB = parseInt(env.MAX_FILE_SIZE_MB || "50", 10);
  const maxSizeBytes = maxSizeMB * 1024 * 1024;

  const formData = await c.req.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return c.json({ error: "No file provided" }, 400);
  }

  if (file.size > maxSizeBytes) {
    return c.json({ error: `File exceeds ${maxSizeMB}MB limit` }, 400);
  }

  if (!file.name.toLowerCase().endsWith(".pdf")) {
    return c.json({ error: "Only PDF files are allowed" }, 400);
  }

  // Generate unique key
  const timestamp = Date.now();
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
  const key = `uploads/${timestamp}_${sanitizedName}`;

  // Upload to R2
  const arrayBuffer = await file.arrayBuffer();
  await env.PDF_BUCKET.put(key, arrayBuffer, {
    customMetadata: {
      originalName: file.name,
      uploadedAt: new Date().toISOString(),
      size: file.size.toString(),
    },
  });

  return c.json({
    success: true,
    key,
    name: file.name,
    size: file.size,
    url: `/files/${key}`,
  });
});

/**
 * List files in R2 bucket
 */
app.get("/files", async (c) => {
  const env = c.env;
  const prefix = c.req.query("prefix") || "";
  const limit = parseInt(c.req.query("limit") || "100", 10);

  const listed = await env.PDF_BUCKET.list({
    prefix,
    limit,
  });

  const files = listed.objects.map((obj) => ({
    key: obj.key,
    size: obj.size,
    uploaded: obj.uploaded,
    etag: obj.etag,
  }));

  return c.json({
    files,
    truncated: listed.truncated,
    cursor: listed.cursor,
  });
});

/**
 * Download/serve a file from R2
 */
app.get("/files/:key{.*}", async (c) => {
  const env = c.env;
  const key = c.req.param("key");

  const object = await env.PDF_BUCKET.get(key);
  if (!object) {
    return c.json({ error: "File not found" }, 404);
  }

  const headers = new Headers();
  headers.set("Content-Type", "application/pdf");
  headers.set("Content-Length", object.size.toString());
  headers.set("ETag", object.etag);

  // Set filename for download
  const originalName = object.customMetadata?.originalName || key.split("/").pop();
  headers.set("Content-Disposition", `inline; filename="${originalName}"`);

  return new Response(object.body, { headers });
});

/**
 * Delete a file from R2
 */
app.delete("/files/:key{.*}", async (c) => {
  const env = c.env;
  const key = c.req.param("key");

  await env.PDF_BUCKET.delete(key);

  return c.json({ success: true, deleted: key });
});

// ============================================
// PDF Processing Endpoints (using pdf-lib)
// ============================================

/**
 * Merge multiple PDFs (runs on Worker using pdf-lib)
 */
app.post("/merge", async (c) => {
  const env = c.env;
  const body = await c.req.json<{
    inputKeys: string[];
    outputKey?: string;
  }>();

  if (!body.inputKeys || body.inputKeys.length < 2) {
    return c.json({ error: "Need at least 2 input files to merge" }, 400);
  }

  try {
    // Create merged document
    const mergedPdf = await PDFDocument.create();

    for (const key of body.inputKeys) {
      const object = await env.PDF_BUCKET.get(key);
      if (!object) {
        return c.json({ error: `File not found: ${key}` }, 404);
      }

      const pdfBytes = await object.arrayBuffer();
      const pdf = await PDFDocument.load(pdfBytes);
      const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
      pages.forEach((page) => mergedPdf.addPage(page));
    }

    // Save merged PDF
    const mergedBytes = await mergedPdf.save();

    // Generate output key
    const timestamp = Date.now();
    const outputKey = body.outputKey || `merged/${timestamp}_merged.pdf`;

    // Upload to R2
    await env.PDF_BUCKET.put(outputKey, mergedBytes, {
      customMetadata: {
        operation: "merge",
        sourceFiles: body.inputKeys.join(","),
        createdAt: new Date().toISOString(),
      },
    });

    return c.json({
      success: true,
      outputKey,
      pageCount: mergedPdf.getPageCount(),
      size: mergedBytes.byteLength,
      url: `/files/${outputKey}`,
    });
  } catch (error) {
    return c.json(
      {
        error: "Merge failed",
        details: error instanceof Error ? error.message : String(error),
      },
      500
    );
  }
});

/**
 * Split a PDF into individual pages (runs on Worker using pdf-lib)
 */
app.post("/split", async (c) => {
  const env = c.env;
  const body = await c.req.json<{
    inputKey: string;
    pages?: number[] | string;
    outputPrefix?: string;
  }>();

  if (!body.inputKey) {
    return c.json({ error: "inputKey is required" }, 400);
  }

  try {
    // Load source PDF
    const object = await env.PDF_BUCKET.get(body.inputKey);
    if (!object) {
      return c.json({ error: "File not found" }, 404);
    }

    const pdfBytes = await object.arrayBuffer();
    const sourcePdf = await PDFDocument.load(pdfBytes);
    const totalPages = sourcePdf.getPageCount();

    // Determine which pages to extract
    let pageIndices: number[];
    if (body.pages) {
      if (typeof body.pages === "string") {
        // Parse page range string (e.g., "1-3,5,7-9")
        pageIndices = parsePageRange(body.pages, totalPages).map((p) => p - 1);
      } else {
        pageIndices = body.pages.map((p) => p - 1);
      }
    } else {
      pageIndices = Array.from({ length: totalPages }, (_, i) => i);
    }

    const timestamp = Date.now();
    const prefix = body.outputPrefix || `split/${timestamp}`;
    const outputFiles: Array<{ page: number; key: string; size: number }> = [];

    // Create individual page PDFs
    for (const pageIndex of pageIndices) {
      if (pageIndex < 0 || pageIndex >= totalPages) continue;

      const newPdf = await PDFDocument.create();
      const [page] = await newPdf.copyPages(sourcePdf, [pageIndex]);
      newPdf.addPage(page);

      const pageBytes = await newPdf.save();
      const pageNum = String(pageIndex + 1).padStart(3, "0");
      const key = `${prefix}/page_${pageNum}.pdf`;

      await env.PDF_BUCKET.put(key, pageBytes, {
        customMetadata: {
          operation: "split",
          sourceFile: body.inputKey,
          pageNumber: (pageIndex + 1).toString(),
          createdAt: new Date().toISOString(),
        },
      });

      outputFiles.push({
        page: pageIndex + 1,
        key,
        size: pageBytes.byteLength,
      });
    }

    return c.json({
      success: true,
      totalPages,
      extractedPages: outputFiles.length,
      files: outputFiles,
    });
  } catch (error) {
    return c.json(
      {
        error: "Split failed",
        details: error instanceof Error ? error.message : String(error),
      },
      500
    );
  }
});

/**
 * Queue heavy optimization job (requires external processor)
 */
app.post("/optimize", async (c) => {
  const env = c.env;
  const body = await c.req.json<{
    inputKey: string;
    preset?: "screen" | "ebook" | "printer" | "prepress";
    outputKey?: string;
  }>();

  if (!body.inputKey) {
    return c.json({ error: "inputKey is required" }, 400);
  }

  // Check if external processor is configured
  if (!env.PROCESSOR_WEBHOOK_URL) {
    return c.json(
      {
        error: "Heavy optimization requires external processor",
        message:
          "Ghostscript cannot run on Cloudflare Workers. Configure PROCESSOR_WEBHOOK_URL to use an external processing server, or use the local MCP server for optimization.",
        alternatives: [
          "Use the local MCP server with 'optimize_pdf' tool",
          "Deploy a processing server with Ghostscript and configure webhook",
        ],
      },
      501
    );
  }

  // Create job
  const jobId = `job_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  const timestamp = Date.now();
  const outputKey = body.outputKey || `optimized/${timestamp}_optimized.pdf`;

  const job: JobStatus = {
    id: jobId,
    status: "pending",
    operation: "optimize",
    inputFiles: [body.inputKey],
    outputFile: outputKey,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Store job status
  await env.JOB_STATUS.put(jobId, JSON.stringify(job), {
    expirationTtl: 86400, // 24 hours
  });

  // Trigger external processor via webhook
  try {
    const response = await fetch(env.PROCESSOR_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.PROCESSOR_API_KEY || ""}`,
      },
      body: JSON.stringify({
        jobId,
        operation: "optimize",
        inputKey: body.inputKey,
        outputKey,
        preset: body.preset || "printer",
      }),
    });

    if (!response.ok) {
      throw new Error(`Processor returned ${response.status}`);
    }

    // Update job status
    job.status = "processing";
    job.updatedAt = new Date().toISOString();
    await env.JOB_STATUS.put(jobId, JSON.stringify(job), {
      expirationTtl: 86400,
    });

    return c.json({
      success: true,
      jobId,
      status: "processing",
      message: "Optimization job queued",
      statusUrl: `/jobs/${jobId}`,
    });
  } catch (error) {
    // Update job to failed
    job.status = "failed";
    job.error = error instanceof Error ? error.message : String(error);
    job.updatedAt = new Date().toISOString();
    await env.JOB_STATUS.put(jobId, JSON.stringify(job), {
      expirationTtl: 86400,
    });

    return c.json(
      {
        error: "Failed to queue optimization job",
        details: job.error,
      },
      500
    );
  }
});

/**
 * Check job status
 */
app.get("/jobs/:id", async (c) => {
  const env = c.env;
  const jobId = c.req.param("id");

  const jobData = await env.JOB_STATUS.get(jobId);
  if (!jobData) {
    return c.json({ error: "Job not found" }, 404);
  }

  const job: JobStatus = JSON.parse(jobData);

  return c.json(job);
});

/**
 * Webhook callback for external processor to update job status
 */
app.post("/jobs/:id/callback", async (c) => {
  const env = c.env;
  const jobId = c.req.param("id");
  const body = await c.req.json<{
    status: "completed" | "failed";
    error?: string;
    result?: Record<string, unknown>;
  }>();

  const jobData = await env.JOB_STATUS.get(jobId);
  if (!jobData) {
    return c.json({ error: "Job not found" }, 404);
  }

  const job: JobStatus = JSON.parse(jobData);
  job.status = body.status;
  job.updatedAt = new Date().toISOString();

  if (body.error) {
    job.error = body.error;
  }

  if (body.result) {
    job.result = body.result;
  }

  await env.JOB_STATUS.put(jobId, JSON.stringify(job), {
    expirationTtl: 86400,
  });

  return c.json({ success: true });
});

// ============================================
// Utility Functions
// ============================================

/**
 * Parse page range string (e.g., "1-3,5,7-9")
 */
function parsePageRange(range: string, totalPages: number): number[] {
  const pages: Set<number> = new Set();
  const parts = range.split(",").map((s) => s.trim());

  for (const part of parts) {
    if (part.includes("-")) {
      const [start, end] = part.split("-").map((s) => s.trim());
      const startPage = start ? parseInt(start, 10) : 1;
      const endPage = end ? parseInt(end, 10) : totalPages;

      for (let i = startPage; i <= Math.min(endPage, totalPages); i++) {
        if (i >= 1) pages.add(i);
      }
    } else {
      const page = parseInt(part, 10);
      if (page >= 1 && page <= totalPages) {
        pages.add(page);
      }
    }
  }

  return Array.from(pages).sort((a, b) => a - b);
}

export default app;
