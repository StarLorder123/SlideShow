import * as vscode from "vscode";
import * as path from "path";
import {
  compileMarkdown,
  extractFrontmatter,
  SlideMetadata,
} from "./compiler/mdCompiler";
import { SlideTemplate } from "./template/slideTemplate";
import { OutlineProvider } from "./outlineProvider";

/**
 * Singleton that manages the lifecycle of the preview Webview panel.
 * Handles rendering, hot-reload with debounce, and export.
 */
export class PreviewPanel {
  private static instance: PreviewPanel | null = null;
  private panel: vscode.WebviewPanel | undefined;
  private debounceTimer: NodeJS.Timeout | undefined;
  private disposables: vscode.Disposable[] = [];
  private outlineProvider: OutlineProvider | null = null;
  private lastMetadata: SlideMetadata | null = null;

  private constructor() {}

  /**
   * Get the singleton instance.
   */
  static getInstance(): PreviewPanel {
    if (!PreviewPanel.instance) {
      PreviewPanel.instance = new PreviewPanel();
    }
    return PreviewPanel.instance;
  }

  /**
   * Attach the outline provider for refreshing and navigation.
   */
  setOutlineProvider(provider: OutlineProvider): void {
    this.outlineProvider = provider;
  }

  /**
   * Show the preview panel for the given document.
   */
  showPreview(document: vscode.TextDocument): void {
    if (document.languageId !== "markdown") {
      return;
    }

    // Set context key to show views/commands only when preview is active
    vscode.commands.executeCommand(
      "setContext",
      "md2slide.previewActive",
      true
    );

    if (this.panel) {
      this.panel.reveal(vscode.ViewColumn.Two);
    } else {
      this.panel = vscode.window.createWebviewPanel(
        "md2slide.preview",
        `Preview: ${document.fileName.split(/[\\/]/).pop() ?? "Slide"}`,
        vscode.ViewColumn.Two,
        {
          enableScripts: true,
          retainContextWhenHidden: true,
        }
      );

      this.panel.onDidDispose(
        () => {
          this.dispose();
        },
        null,
        this.disposables
      );
    }

    this.render(document);
    this.registerHotReload(document);
  }

  /**
   * Render the current document into the webview.
   */
  private async render(document: vscode.TextDocument): Promise<void> {
    if (!this.panel) {
      return;
    }

    const text = document.getText();
    const { metadata: frontMatterMeta, body } = extractFrontmatter(text);

    // Resolve metadata with priority: frontmatter > VS Code settings
    const config = vscode.workspace.getConfiguration("md2slide");
    const metadata: SlideMetadata = {
      logo:
        (frontMatterMeta.logo ?? config.get<string>("logo")) || undefined,
      logoPosition:
        frontMatterMeta.logoPosition ??
        (config.get<string>("logoPosition") as SlideMetadata["logoPosition"]) ??
        undefined,
      title:
        (frontMatterMeta.title ??
          config.get<string>("presentationTitle")) ||
        undefined,
    };

    // Resolve logo URL for webview context
    const logoUrl = await this.resolveLogoUrl(
      metadata.logo,
      document,
      false
    );

    const htmlContent = compileMarkdown(body);
    const theme = config.get<string>("theme", "black");

    this.panel.webview.html = SlideTemplate.build(htmlContent, {
      theme,
      logoUrl,
      logoPosition: metadata.logoPosition,
      title: metadata.title,
    });

    // Cache for change detection
    this.lastMetadata = metadata;

    // Update outline provider
    if (this.outlineProvider) {
      this.outlineProvider.setDocument(document);
      this.outlineProvider.refresh();
    }
  }

  /**
   * Toggle Reveal.js overview (thumbnail) mode in the webview.
   */
  toggleOverview(): void {
    if (this.panel) {
      this.panel.webview.postMessage({ command: "toggleOverview" });
    }
  }

  /**
   * Navigate to a specific slide index in the webview.
   */
  navigateToSlide(index: number): void {
    if (this.panel) {
      this.panel.webview.postMessage({ command: "navigate", index });
    }
  }

  /**
   * Register a listener that re-renders the webview on document edits (300ms debounce).
   */
  private registerHotReload(document: vscode.TextDocument): void {
    this.disposables.push(
      vscode.workspace.onDidChangeTextDocument((e) => {
        if (e.document.uri.toString() !== document.uri.toString()) {
          return;
        }
        this.scheduleRender(document);
      })
    );
  }

  /**
   * Debounce the re-render to avoid excessive updates on fast typing.
   */
  private scheduleRender(document: vscode.TextDocument): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    this.debounceTimer = setTimeout(() => {
      this.updateWebview(document);
    }, 300);
  }

  /**
   * Post a message to the existing webview to update slides without full reload.
   * If metadata changed, falls back to a full render.
   */
  private async updateWebview(
    document: vscode.TextDocument
  ): Promise<void> {
    if (!this.panel) {
      return;
    }

    const text = document.getText();
    const { metadata: frontMatterMeta, body } = extractFrontmatter(text);

    const config = vscode.workspace.getConfiguration("md2slide");
    const metadata: SlideMetadata = {
      logo:
        (frontMatterMeta.logo ?? config.get<string>("logo")) || undefined,
      logoPosition:
        frontMatterMeta.logoPosition ??
        (config.get<string>(
          "logoPosition"
        ) as SlideMetadata["logoPosition"]) ??
        undefined,
      title:
        (frontMatterMeta.title ??
          config.get<string>("presentationTitle")) ||
        undefined,
    };

    // If metadata changed, do a full render to update the overlay
    if (!this.metadataEqual(this.lastMetadata, metadata)) {
      await this.render(document);
      return;
    }

    // Metadata unchanged — partial update (slides-only, overlay persists)
    const htmlContent = compileMarkdown(body);
    this.panel.webview.postMessage({
      command: "update",
      htmlContent,
    });
  }

  /**
   * Export the current markdown document as a standalone HTML file.
   */
  async exportHtml(document: vscode.TextDocument): Promise<void> {
    const text = document.getText();
    const { metadata: frontMatterMeta, body } = extractFrontmatter(text);

    const config = vscode.workspace.getConfiguration("md2slide");
    const metadata: SlideMetadata = {
      logo:
        (frontMatterMeta.logo ?? config.get<string>("logo")) || undefined,
      logoPosition:
        frontMatterMeta.logoPosition ??
        (config.get<string>("logoPosition") as SlideMetadata["logoPosition"]) ??
        undefined,
      title:
        (frontMatterMeta.title ??
          config.get<string>("presentationTitle")) ||
        undefined,
    };

    // Resolve logo URL for export context (base64 data URI for local files)
    const logoUrl = await this.resolveLogoUrl(
      metadata.logo,
      document,
      true
    );

    const htmlContent = compileMarkdown(body);
    const theme = config.get<string>("theme", "black");

    const fullHtml = SlideTemplate.build(htmlContent, {
      theme,
      logoUrl,
      logoPosition: metadata.logoPosition,
      title: metadata.title,
    });

    const uri = await vscode.window.showSaveDialog({
      filters: { "HTML Files": ["html", "htm"] },
      saveLabel: "Export Slides",
      defaultUri: vscode.Uri.file(
        document.fileName.replace(/\.md$/i, ".html")
      ),
    });

    if (uri) {
      await vscode.workspace.fs.writeFile(
        uri,
        Buffer.from(fullHtml, "utf-8")
      );
      vscode.window.showInformationMessage(
        "Slides exported successfully!"
      );
    }
  }

  /**
   * Resolve the logo URL appropriate for the current context.
   * - URLs (http/https) pass through unchanged
   * - Local paths in webview: resolve via asWebviewUri
   * - Local paths in export: read file and return base64 data URI
   * Returns undefined if no logo or file missing.
   */
  private async resolveLogoUrl(
    rawPath: string | undefined,
    document: vscode.TextDocument,
    forExport: boolean
  ): Promise<string | undefined> {
    if (!rawPath || rawPath.trim().length === 0) {
      return undefined;
    }

    // URL detection: starts with http:// or https://
    if (/^https?:\/\//i.test(rawPath)) {
      return rawPath;
    }

    // Local path: resolve relative to the markdown file's directory
    const docDir = path.dirname(document.uri.fsPath);
    const resolvedPath = path.resolve(docDir, rawPath);

    if (forExport) {
      // Read file and embed as base64 data URI
      try {
        const uri = vscode.Uri.file(resolvedPath);
        const data = await vscode.workspace.fs.readFile(uri);
        const ext = path.extname(resolvedPath).toLowerCase();
        const mimeType =
          ext === ".png"
            ? "image/png"
            : ext === ".jpg" || ext === ".jpeg"
              ? "image/jpeg"
              : ext === ".gif"
                ? "image/gif"
                : ext === ".svg"
                  ? "image/svg+xml"
                  : ext === ".webp"
                    ? "image/webp"
                    : "image/png";
        const base64 = Buffer.from(data).toString("base64");
        return `data:${mimeType};base64,${base64}`;
      } catch {
        console.warn(
          `MD2Slide: Logo file not found: ${resolvedPath}`
        );
        return undefined;
      }
    } else {
      // Webview: convert to webview URI scheme
      if (!this.panel) {
        return undefined;
      }
      const uri = vscode.Uri.file(resolvedPath);
      return this.panel.webview.asWebviewUri(uri).toString();
    }
  }

  /**
   * Compare two metadata objects for equality.
   */
  private metadataEqual(
    a: SlideMetadata | null,
    b: SlideMetadata
  ): boolean {
    if (!a) {
      return false;
    }
    return (
      a.logo === b.logo &&
      a.logoPosition === b.logoPosition &&
      a.title === b.title
    );
  }

  /**
   * Clean up all resources.
   */
  dispose(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = undefined;
    }
    if (this.panel) {
      this.panel.dispose();
      this.panel = undefined;
    }
    this.disposables.forEach((d) => d.dispose());
    this.disposables = [];
    this.outlineProvider = null;
    vscode.commands.executeCommand(
      "setContext",
      "md2slide.previewActive",
      false
    );
    PreviewPanel.instance = null;
  }
}
