import * as vscode from "vscode";
import * as path from "path";
import {
  compileMarkdown,
  extractFrontmatter,
  parseSlides,
} from "./mdCompiler";
import { SlideTemplate } from "./slideTemplate";
import { OutlineProvider } from "./outlineProvider";
import { SlideBackground, SlideMetadata } from "./types";
import { resolveMetadata } from "./metadataResolver";
import { resolveLocalImage } from "./imageResolver";

/**
 * Build a SlideBackground from resolved metadata (only truthy fields).
 */
function buildGlobalBackground(metadata: SlideMetadata): SlideBackground {
  const bg: SlideBackground = {};
  if (metadata.backgroundColor) bg.color = metadata.backgroundColor;
  if (metadata.backgroundSize) bg.size = metadata.backgroundSize;
  if (metadata.backgroundPosition) bg.position = metadata.backgroundPosition;
  if (metadata.backgroundRepeat) bg.repeat = metadata.backgroundRepeat;
  if (metadata.backgroundOpacity !== undefined) bg.opacity = metadata.backgroundOpacity;
  return bg;
}

/**
 * Compare two metadata objects for equality.
 */
function metadataEqual(a: SlideMetadata | null, b: SlideMetadata): boolean {
  if (!a) return false;
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
  private currentMode: "fullscreen" | "split" | "window" = "fullscreen";

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
    mode: "fullscreen" | "split" | "window" = "fullscreen"
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

    // Window mode: detach the webview into its own native window
    if (mode === "window") {
      // Defer to let the webview tab finish rendering, then move to new window
      setTimeout(() => {
        vscode.commands.executeCommand(
          "workbench.action.moveEditorToNewWindow"
        );
      }, 100);
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
    // (split and window modes keep the markdown editor open)
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
    const config = vscode.workspace.getConfiguration("md2slide");
    const metadata = resolveMetadata(frontMatterMeta, config);

    // Resolve logo URL for webview context
    const logoUrl = await resolveLocalImage(
      metadata.logo,
      document,
      false,
      this.panel.webview
    );

    // Check if any slide has per-slide titles
    const slides = parseSlides(body);
    const hasPerSlideTitles = slides.some(
      (s) => s.slideOverlay !== undefined
    );
    this.lastHasPerSlideTitles = hasPerSlideTitles;

    // Build global background from resolved metadata
    const globalBackground = buildGlobalBackground(metadata);

    // Resolve global background image
    const resolvedBgImage = await resolveLocalImage(
      metadata.backgroundImage,
      document,
      false,
      this.panel.webview
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
      const metadata = resolveMetadata(frontMatterMeta, config);

      // Check if per-slide title presence changed
      const slides = parseSlides(body);
      const hasPerSlideTitles = slides.some(
        (s) => s.slideOverlay !== undefined
      );

      // If metadata changed OR per-slide title presence changed, full render
      if (
        !metadataEqual(this.lastMetadata, metadata) ||
        this.lastHasPerSlideTitles !== hasPerSlideTitles
      ) {
        this.lastHasPerSlideTitles = hasPerSlideTitles;
        await this.render(document);
        return;
      }

      // --- async work below — check version before posting ---

      // Metadata unchanged — partial update with per-slide overlays & backgrounds injected
      const globalBackground = buildGlobalBackground(metadata);

      const resolvedBgImage = await resolveLocalImage(
        metadata.backgroundImage,
        document,
        false,
        this.panel.webview
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
    const metadata = resolveMetadata(frontMatterMeta, config);

    // Resolve logo URL for export context (base64 data URI for local files)
    const logoUrl = await resolveLocalImage(
      metadata.logo,
      document,
      true
    );

    // Build global background for export
    const globalBackground = buildGlobalBackground(metadata);

    // Resolve global background image for export (base64 for local files)
    const resolvedBgImage = await resolveLocalImage(
      metadata.backgroundImage,
      document,
      true
    );
    if (resolvedBgImage) globalBackground.image = resolvedBgImage;

    // Pre-resolve per-slide background images for export (path → base64)
    const allSlides = parseSlides(body);
    const resolvedImageCache = new Map<string, string>();
    for (const slide of allSlides) {
      const img = slide.slideBackground?.image;
      if (img && !resolvedImageCache.has(img)) {
        const resolved = await resolveLocalImage(img, document, true);
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
