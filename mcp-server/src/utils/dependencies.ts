/**
 * Dependency checking utilities
 * Verifies that required system tools are installed
 * Now supports both Mistral AI (cloud OCR) and local OCR (ocrmypdf/tesseract)
 */

import { exec } from "child_process";
import { promisify } from "util";
import { createMistralOcrService } from "../services/mistral-ocr.js";

const execAsync = promisify(exec);

interface DependencyStatus {
  name: string;
  installed: boolean;
  version?: string;
  path?: string;
  installCommand?: string;
  optional?: boolean;  // New: marks optional dependencies
}

interface DependencyCheckResult {
  allInstalled: boolean;
  dependencies: DependencyStatus[];
  message: string;
}

/**
 * Check if a command exists and get its version
 */
async function checkCommand(
  command: string,
  versionFlag: string = "--version"
): Promise<{ installed: boolean; version?: string; path?: string }> {
  try {
    // Check if command exists
    const { stdout: whichOutput } = await execAsync(`which ${command}`);
    const path = whichOutput.trim();

    // Get version
    const { stdout: versionOutput } = await execAsync(
      `${command} ${versionFlag} 2>&1 || true`
    );
    const version = versionOutput.trim().split("\n")[0];

    return { installed: true, version, path };
  } catch {
    return { installed: false };
  }
}

/**
 * Check all required dependencies
 */
export async function checkDependencies(): Promise<DependencyCheckResult> {
  const dependencies: DependencyStatus[] = [];

  // Check qpdf
  const qpdf = await checkCommand("qpdf", "--version");
  dependencies.push({
    name: "qpdf",
    installed: qpdf.installed,
    version: qpdf.version,
    path: qpdf.path,
    installCommand: "brew install qpdf",
  });

  // Check ghostscript
  const gs = await checkCommand("gs", "--version");
  dependencies.push({
    name: "ghostscript (gs)",
    installed: gs.installed,
    version: gs.version,
    path: gs.path,
    installCommand: "brew install gs",
  });

  // Check pdfcpu (optional, for Go-based operations)
  const pdfcpu = await checkCommand("pdfcpu", "version");
  dependencies.push({
    name: "pdfcpu (optional)",
    installed: pdfcpu.installed,
    version: pdfcpu.version,
    path: pdfcpu.path,
    installCommand: "brew install pdfcpu",
  });

  // Check pdfinfo from poppler (for page count)
  const pdfinfo = await checkCommand("pdfinfo", "-v");
  dependencies.push({
    name: "poppler (pdfinfo)",
    installed: pdfinfo.installed,
    version: pdfinfo.version,
    path: pdfinfo.path,
    installCommand: "brew install poppler",
  });

  // Check for OCR options: Mistral AI (cloud) OR ocrmypdf+tesseract (local)
  const mistralApiKey = process.env.MISTRAL_API_KEY;
  let mistralWorking = false;

  if (mistralApiKey) {
    try {
      const mistralService = createMistralOcrService(mistralApiKey);
      const check = await mistralService.checkConnection();
      mistralWorking = check.connected;
      dependencies.push({
        name: "Mistral AI OCR (Premium)",
        installed: mistralWorking,
        version: "API Connected",
        installCommand: "Set MISTRAL_API_KEY environment variable",
        optional: true,
      });
    } catch {
      dependencies.push({
        name: "Mistral AI OCR (Premium)",
        installed: false,
        installCommand: "Set MISTRAL_API_KEY with valid API key",
        optional: true,
      });
    }
  } else {
    dependencies.push({
      name: "Mistral AI OCR (Premium)",
      installed: false,
      installCommand: "Set MISTRAL_API_KEY environment variable (get key from https://console.mistral.ai)",
      optional: true,
    });
  }

  // Check ocrmypdf (for local OCR fallback)
  const ocrmypdf = await checkCommand("ocrmypdf", "--version");
  dependencies.push({
    name: "ocrmypdf (Free OCR)",
    installed: ocrmypdf.installed,
    version: ocrmypdf.version,
    path: ocrmypdf.path,
    installCommand: "brew install ocrmypdf",
    optional: mistralWorking,  // Optional if Mistral is working
  });

  // Check tesseract (OCR engine for local OCR)
  const tesseract = await checkCommand("tesseract", "--version");
  dependencies.push({
    name: "tesseract (Free OCR Engine)",
    installed: tesseract.installed,
    version: tesseract.version,
    path: tesseract.path,
    installCommand: "brew install tesseract",
    optional: mistralWorking,  // Optional if Mistral is working
  });

  const allInstalled = dependencies
    .filter((d) => !d.optional)
    .every((d) => d.installed);

  const missingRequired = dependencies
    .filter((d) => !d.installed && !d.optional)
    .map((d) => d.name);

  // Check if we have at least one OCR option
  const hasOcrOption = mistralWorking || (ocrmypdf.installed && tesseract.installed);

  let message: string;
  if (allInstalled && hasOcrOption) {
    const ocrMethod = mistralWorking ? "Mistral AI (Premium)" : "Tesseract (Free)";
    message = `All required dependencies are installed and ready! OCR: ${ocrMethod}`;
  } else if (allInstalled && !hasOcrOption) {
    message = "Core dependencies installed. For OCR, either:\n  1. Set MISTRAL_API_KEY (premium, cloud-based)\n  2. Install: brew install ocrmypdf tesseract (free, local)";
  } else {
    message = `Missing required dependencies: ${missingRequired.join(", ")}. Install with:\n${dependencies
      .filter((d) => !d.installed && !d.optional)
      .map((d) => `  ${d.installCommand}`)
      .join("\n")}`;
  }

  return {
    allInstalled: allInstalled && hasOcrOption,
    dependencies,
    message,
  };
}

/**
 * Ensure required dependencies are available, throw if not
 */
export async function ensureDependencies(): Promise<void> {
  const result = await checkDependencies();
  if (!result.allInstalled) {
    throw new Error(result.message);
  }
}
