import * as vscode from "vscode";
import * as path from "path";
import {
  compileMarkdown,
  extractFrontmatter,
  parseSlides,
  SlideBackground,
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
  private lastHasPerSlideTitles: boolean = false;
  private lastDocumentUri: vscode.Uri | null = null;
  /** Monotonic counter to reject stale async updates. */
  private updateVersion = 0;
  /** Whether an updateWebview call is currently in flight. */
  private isUpdating = false;
  /** The current preview mode — controls close behavior. */
  private currentMode: "fullscreen" | "split" = "fullscreen";

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
  showPreview(
    document: vscode.TextDocument,
    mode: "fullscreen" | "split" = "fullscreen"
  ): void {
    if (document.languageId !== "markdown") {
      return;
    }

    this.currentMode = mode;

    // Track the document for restoration on close
    this.lastDocumentUri = document.uri;

    // Set context key to show views/commands only when preview is active
    vscode.commands.executeCommand(
      "setContext",
      "md2slide.previewActive",
      true
    );

    const viewColumn =
      mode === "split" ? vscode.ViewColumn.Beside : vscode.ViewColumn.Active;

    if (this.panel) {
      this.panel.reveal(viewColumn);
    } else {
      this.panel = vscode.window.createWebviewPanel(
        "md2slide.preview",
        `Preview: ${document.fileName.split(/[\\/]/).pop() ?? "Slide"}`,
        viewColumn,
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

    // Fullscreen mode: close md tab and maximize editor
    if (mode === "fullscreen") {
      this.closeMarkdownTab(document.uri);
      vscode.commands.executeCommand("workbench.action.maximizeEditor");
    }

    this.render(document);
    this.registerHotReload(document);
  }

  /**
   * Close the markdown editor tab matching the given URI.
   */
  private closeMarkdownTab(uri: vscode.Uri): void {
    // Use a microtask to ensure the webview tab exists before we close the md tab
    setTimeout(async () => {
      for (const group of vscode.window.tabGroups.all) {
        for (const tab of group.tabs) {
          const input = tab.input;
          if (
            input instanceof vscode.TabInputText &&
            input.uri.toString() === uri.toString()
          ) {
            await vscode.window.tabGroups.close(tab);
            return;
          }
        }
      }
    }, 50);
  }

  /**
   * Close the preview panel and restore the markdown editor.
   */
  async closePreview(): Promise<void> {
    // Fullscreen mode: restore markdown editor and un-maximize
    if (this.currentMode === "fullscreen") {
      if (this.lastDocumentUri) {
        try {
          await vscode.window.showTextDocument(this.lastDocumentUri);
        } catch {
          // Document may have been deleted; ignore
        }
      }
      vscode.commands.executeCommand("workbench.action.evenEditorWidths");
    }

    // Dispose the webview panel (this also calls this.dispose())
    this.dispose();
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
      // Background fields: frontmatter > VS Code settings
      backgroundColor:
        (frontMatterMeta.backgroundColor ??
        config.get<string>("backgroundColor")) ||
        undefined,
      backgroundImage:
        (frontMatterMeta.backgroundImage ??
        config.get<string>("backgroundImage")) ||
        undefined,
      backgroundSize:
        (frontMatterMeta.backgroundSize ??
        config.get<string>("backgroundSize")) ||
        undefined,
      backgroundPosition:
        (frontMatterMeta.backgroundPosition ??
        config.get<string>("backgroundPosition")) ||
        undefined,
      backgroundRepeat:
        (frontMatterMeta.backgroundRepeat ??
        config.get<string>("backgroundRepeat")) ||
        undefined,
      backgroundOpacity:
        (frontMatterMeta.backgroundOpacity ??
        config.get<number>("backgroundOpacity")) ||
        undefined,
    };

    // Resolve logo URL for webview context
    const logoUrl = await this.resolveLogoUrl(
      metadata.logo,
      document,
      false
    );

    // Check if any slide has per-slide titles
    const slides = parseSlides(body);
    const hasPerSlideTitles = slides.some(
      (s) => s.slideOverlay !== undefined
    );
    this.lastHasPerSlideTitles = hasPerSlideTitles;

    // Build global background from resolved metadata
    const globalBackground: SlideBackground = {};
    if (metadata.backgroundColor) globalBackground.color = metadata.backgroundColor;
    if (metadata.backgroundSize) globalBackground.size = metadata.backgroundSize;
    if (metadata.backgroundPosition) globalBackground.position = metadata.backgroundPosition;
    if (metadata.backgroundRepeat) globalBackground.repeat = metadata.backgroundRepeat;
    if (metadata.backgroundOpacity !== undefined) globalBackground.opacity = metadata.backgroundOpacity;

    // Resolve global background image (same logic as logo)
    const resolvedBgImage = await this.resolveBackgroundImage(
      metadata.backgroundImage,
      document,
      false
    );
    if (resolvedBgImage) globalBackground.image = resolvedBgImage;

    // Callback to resolve per-slide local images in webview context
    const resolveImageUrl = (rawPath: string): string | undefined => {
      if (/^https?:\/\//i.test(rawPath)) return rawPath;
      if (!this.panel) return undefined;
      const docDir = path.dirname(document.uri.fsPath);
      const resolvedPath = path.resolve(docDir, rawPath);
      try {
        return this.panel.webview
          .asWebviewUri(vscode.Uri.file(resolvedPath))
          .toString();
      } catch {
        return undefined;
      }
    };

    // Inject per-slide overlays & backgrounds
    const htmlContent = compileMarkdown(body, {
      globalTitle: metadata.title,
      globalPosition: metadata.logoPosition,
      globalBackground,
      resolveImageUrl,
    });

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
   * If an update is already in flight, skip scheduling — the latest document
   * state will be picked up by the next edit event after the current update
   * completes, or by the postMessage version guard.
   */
  private scheduleRender(document: vscode.TextDocument): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    if (this.isUpdating) {
      return;
    }
    this.debounceTimer = setTimeout(() => {
      this.updateWebview(document);
    }, 300);
  }

  /**
   * Post a message to the existing webview to update slides without full reload.
   * If metadata changed, falls back to a full render.
   * Uses a monotonic version counter to reject stale updates caused by async races.
   */
  private async updateWebview(
    document: vscode.TextDocument
  ): Promise<void> {
    if (!this.panel) {
      return;
    }

    // Capture version and mark in-flight so scheduleRender skips piling up
    const version = ++this.updateVersion;
    this.isUpdating = true;

    try {
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

      // Check if per-slide title presence changed
      const slides = parseSlides(body);
      const hasPerSlideTitles = slides.some(
        (s) => s.slideOverlay !== undefined
      );

      // If metadata changed OR per-slide title presence changed, full render
      if (
        !this.metadataEqual(this.lastMetadata, metadata) ||
        this.lastHasPerSlideTitles !== hasPerSlideTitles
      ) {
        this.lastHasPerSlideTitles = hasPerSlideTitles;
        await this.render(document);
        return;
      }

      // --- async work below — check version before posting ---

      // Metadata unchanged — partial update with per-slide overlays & backgrounds injected
      const globalBackground: SlideBackground = {};
      if (metadata.backgroundColor) globalBackground.color = metadata.backgroundColor;
      if (metadata.backgroundSize) globalBackground.size = metadata.backgroundSize;
      if (metadata.backgroundPosition) globalBackground.position = metadata.backgroundPosition;
      if (metadata.backgroundRepeat) globalBackground.repeat = metadata.backgroundRepeat;
      if (metadata.backgroundOpacity !== undefined) globalBackground.opacity = metadata.backgroundOpacity;
      // Resolve global background image for webview
      const resolvedBgImage = await this.resolveBackgroundImage(
        metadata.backgroundImage, document, false
      );

      // Stale check: if a newer update started while we awaited, discard this one
      if (this.updateVersion !== version) {
        return;
      }

      if (resolvedBgImage) globalBackground.image = resolvedBgImage;

      const resolveImageUrl = (rawPath: string): string | undefined => {
        if (/^https?:\/\//i.test(rawPath)) return rawPath;
        if (!this.panel) return undefined;
        const docDir = path.dirname(document.uri.fsPath);
        try {
          return this.panel.webview
            .asWebviewUri(vscode.Uri.file(path.resolve(docDir, rawPath)))
            .toString();
        } catch { return undefined; }
      };

      const htmlContent = compileMarkdown(body, {
        globalTitle: metadata.title,
        globalPosition: metadata.logoPosition,
        globalBackground,
        resolveImageUrl,
      });

      // Final stale check before posting
      if (this.updateVersion !== version) {
        return;
      }

      this.panel.webview.postMessage({
        command: "update",
        htmlContent,
        version,
      });
    } finally {
      this.isUpdating = false;
    }
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
      // Background fields: frontmatter > VS Code settings
      backgroundColor:
        (frontMatterMeta.backgroundColor ??
        config.get<string>("backgroundColor")) ||
        undefined,
      backgroundImage:
        (frontMatterMeta.backgroundImage ??
        config.get<string>("backgroundImage")) ||
        undefined,
      backgroundSize:
        (frontMatterMeta.backgroundSize ??
        config.get<string>("backgroundSize")) ||
        undefined,
      backgroundPosition:
        (frontMatterMeta.backgroundPosition ??
        config.get<string>("backgroundPosition")) ||
        undefined,
      backgroundRepeat:
        (frontMatterMeta.backgroundRepeat ??
        config.get<string>("backgroundRepeat")) ||
        undefined,
      backgroundOpacity:
        (frontMatterMeta.backgroundOpacity ??
        config.get<number>("backgroundOpacity")) ||
        undefined,
    };

    // Resolve logo URL for export context (base64 data URI for local files)
    const logoUrl = await this.resolveLogoUrl(
      metadata.logo,
      document,
      true
    );

    // Build global background for export
    const globalBackground: SlideBackground = {};
    if (metadata.backgroundColor) globalBackground.color = metadata.backgroundColor;
    if (metadata.backgroundSize) globalBackground.size = metadata.backgroundSize;
    if (metadata.backgroundPosition) globalBackground.position = metadata.backgroundPosition;
    if (metadata.backgroundRepeat) globalBackground.repeat = metadata.backgroundRepeat;
    if (metadata.backgroundOpacity !== undefined) globalBackground.opacity = metadata.backgroundOpacity;
    // Resolve global background image for export (base64 for local files)
    const resolvedBgImage = await this.resolveBackgroundImage(
      metadata.backgroundImage, document, true
    );
    if (resolvedBgImage) globalBackground.image = resolvedBgImage;

    // Per-slide local images: resolve to base64 for self-contained export
    const resolveImageUrlForExport = async (rawPath: string): Promise<string | undefined> => {
      if (/^https?:\/\//i.test(rawPath)) return rawPath;
      // Resolve & embed as base64
      const docDir = path.dirname(document.uri.fsPath);
      const resolvedPath = path.resolve(docDir, rawPath);
      try {
        const uri = vscode.Uri.file(resolvedPath);
        const data = await vscode.workspace.fs.readFile(uri);
        const ext = path.extname(resolvedPath).toLowerCase();
        const mimeMap: Record<string, string> = {
          ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
          ".gif": "image/gif", ".svg": "image/svg+xml", ".webp": "image/webp",
        };
        const mimeType = mimeMap[ext] || "image/png";
        const base64 = Buffer.from(data).toString("base64");
        return `data:${mimeType};base64,${base64}`;
      } catch { return undefined; }
    };

    // Pre-resolve per-slide background images for export (path → base64)
    const allSlides = parseSlides(body);
    const resolvedImageCache = new Map<string, string>();
    for (const slide of allSlides) {
      const img = slide.slideBackground?.image;
      if (img && !resolvedImageCache.has(img)) {
        const resolved = await resolveImageUrlForExport(img);
        if (resolved) resolvedImageCache.set(img, resolved);
      }
    }

    const htmlContent = compileMarkdown(body, {
      globalTitle: metadata.title,
      globalPosition: metadata.logoPosition,
      globalBackground,
      resolveImageUrl: (rawPath) => resolvedImageCache.get(rawPath) ?? rawPath,
    });

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
   * Resolve background image path (same logic as resolveLogoUrl).
   */
  private async resolveBackgroundImage(
    rawPath: string | undefined,
    document: vscode.TextDocument,
    forExport: boolean
  ): Promise<string | undefined> {
    return this.resolveLogoUrl(rawPath, document, forExport);
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
      a.title === b.title &&
      a.backgroundColor === b.backgroundColor &&
      a.backgroundImage === b.backgroundImage &&
      a.backgroundSize === b.backgroundSize &&
      a.backgroundPosition === b.backgroundPosition &&
      a.backgroundRepeat === b.backgroundRepeat &&
      a.backgroundOpacity === b.backgroundOpacity
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
    this.lastDocumentUri = null;
    vscode.commands.executeCommand(
      "setContext",
      "md2slide.previewActive",
      false
    );
    PreviewPanel.instance = null;
  }
}
