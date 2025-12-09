/**
 * Dependency checking utilities
 * Verifies that required system tools are installed
 */

import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

interface DependencyStatus {
  name: string;
  installed: boolean;
  version?: string;
  path?: string;
  installCommand?: string;
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

  // Check ocrmypdf (for OCR)
  const ocrmypdf = await checkCommand("ocrmypdf", "--version");
  dependencies.push({
    name: "ocrmypdf (OCR)",
    installed: ocrmypdf.installed,
    version: ocrmypdf.version,
    path: ocrmypdf.path,
    installCommand: "brew install ocrmypdf",
  });

  // Check tesseract (OCR engine)
  const tesseract = await checkCommand("tesseract", "--version");
  dependencies.push({
    name: "tesseract (OCR engine)",
    installed: tesseract.installed,
    version: tesseract.version,
    path: tesseract.path,
    installCommand: "brew install tesseract",
  });

  const allInstalled = dependencies
    .filter((d) => !d.name.includes("optional"))
    .every((d) => d.installed);

  const missingRequired = dependencies
    .filter((d) => !d.installed && !d.name.includes("optional"))
    .map((d) => d.name);

  let message: string;
  if (allInstalled) {
    message = "All required dependencies are installed and ready!";
  } else {
    message = `Missing required dependencies: ${missingRequired.join(", ")}. Install with:\n${dependencies
      .filter((d) => !d.installed && !d.name.includes("optional"))
      .map((d) => `  ${d.installCommand}`)
      .join("\n")}`;
  }

  return {
    allInstalled,
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
