import * as path from "path";
import * as vscode from "vscode";

/** MIME type map for common image extensions. */
const MIME_MAP: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
};

/**
 * Get the MIME type for an image file extension. Defaults to "image/png".
 */
export function getMimeType(ext: string): string {
  return MIME_MAP[ext.toLowerCase()] || "image/png";
}

/**
 * Resolve a local image path for use in either a webview or exported HTML.
 *
 * - URLs (http/https) pass through unchanged.
 * - Local paths in webview context: resolved via `webview.asWebviewUri()`.
 * - Local paths in export context: read from disk and returned as base64 data URI.
 *
 * Returns `undefined` if no path is provided or the file cannot be read.
 */
export async function resolveLocalImage(
  rawPath: string | undefined,
  document: vscode.TextDocument,
  forExport: boolean,
  webview?: vscode.Webview
): Promise<string | undefined> {
  if (!rawPath || rawPath.trim().length === 0) {
    return undefined;
  }

  // URL detection
  if (/^https?:\/\//i.test(rawPath)) {
    return rawPath;
  }

  // Local path: resolve relative to the markdown file's directory
  const docDir = path.dirname(document.uri.fsPath);
  const resolvedPath = path.resolve(docDir, rawPath);
  const uri = vscode.Uri.file(resolvedPath);

  if (forExport) {
    return fileToBase64(uri);
  }

  // Webview context
  if (!webview) {
    return undefined;
  }
  return webview.asWebviewUri(uri).toString();
}

/**
 * Read an image file and return a base64 data URI.
 * Returns `undefined` if the file cannot be read.
 */
export async function fileToBase64(
  uri: vscode.Uri
): Promise<string | undefined> {
  try {
    const data = await vscode.workspace.fs.readFile(uri);
    const ext = path.extname(uri.fsPath);
    const mimeType = getMimeType(ext);
    const base64 = Buffer.from(data).toString("base64");
    return `data:${mimeType};base64,${base64}`;
  } catch {
    return undefined;
  }
}
