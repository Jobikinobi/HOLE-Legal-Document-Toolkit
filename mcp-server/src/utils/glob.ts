/**
 * Simple glob implementation using fs
 */

import * as fs from "fs/promises";
import * as path from "path";

interface GlobOptions {
  cwd?: string;
  absolute?: boolean;
}

/**
 * Simple glob pattern matching
 * Supports: *.ext, **\/*.ext patterns
 */
export async function glob(
  pattern: string,
  options: GlobOptions = {}
): Promise<string[]> {
  const cwd = options.cwd || process.cwd();
  const recursive = pattern.includes("**/");
  const filePattern = pattern.replace("**/", "").replace("*/", "");

  const results: string[] = [];

  async function scanDir(dir: string): Promise<void> {
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory() && recursive) {
          await scanDir(fullPath);
        } else if (entry.isFile()) {
          if (matchPattern(entry.name, filePattern)) {
            results.push(options.absolute ? fullPath : path.relative(cwd, fullPath));
          }
        }
      }
    } catch {
      // Skip directories that can't be read
    }
  }

  await scanDir(cwd);
  return results;
}

/**
 * Match filename against simple glob pattern
 */
function matchPattern(filename: string, pattern: string): boolean {
  // Handle *.ext pattern
  if (pattern.startsWith("*.")) {
    const ext = pattern.slice(1);
    return filename.toLowerCase().endsWith(ext.toLowerCase());
  }

  // Handle exact match
  if (!pattern.includes("*")) {
    return filename === pattern;
  }

  // Handle prefix*.ext pattern
  const parts = pattern.split("*");
  if (parts.length === 2) {
    return (
      filename.startsWith(parts[0]) &&
      filename.endsWith(parts[1])
    );
  }

  return false;
}
