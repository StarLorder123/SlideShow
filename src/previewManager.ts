import * as vscode from "vscode";
import { compileMarkdown } from "./compiler/mdCompiler";
import { SlideTemplate } from "./template/slideTemplate";

/**
 * Singleton that manages the lifecycle of the preview Webview panel.
 * Handles rendering, hot-reload with debounce, and export.
 */
export class PreviewPanel {
  private static instance: PreviewPanel | null = null;
  private panel: vscode.WebviewPanel | undefined;
  private debounceTimer: NodeJS.Timeout | undefined;
  private disposables: vscode.Disposable[] = [];

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
   * Show the preview panel for the given document.
   */
  showPreview(document: vscode.TextDocument): void {
    if (document.languageId !== "markdown") {
      return;
    }

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
  private render(document: vscode.TextDocument): void {
    if (!this.panel) {
      return;
    }

    const htmlContent = compileMarkdown(document.getText());
    const theme = vscode.workspace
      .getConfiguration("md2slide")
      .get<string>("theme", "black");

    this.panel.webview.html = SlideTemplate.build(htmlContent, theme);
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
   */
  private updateWebview(document: vscode.TextDocument): void {
    if (!this.panel) {
      return;
    }

    const htmlContent = compileMarkdown(document.getText());
    this.panel.webview.postMessage({
      command: "update",
      htmlContent,
    });
  }

  /**
   * Export the current markdown document as a standalone HTML file.
   */
  async exportHtml(document: vscode.TextDocument): Promise<void> {
    const htmlContent = compileMarkdown(document.getText());
    const theme = vscode.workspace
      .getConfiguration("md2slide")
      .get<string>("theme", "black");

    const fullHtml = SlideTemplate.build(htmlContent, theme);

    const uri = await vscode.window.showSaveDialog({
      filters: { "HTML Files": ["html", "htm"] },
      saveLabel: "Export Slides",
      defaultUri: vscode.Uri.file(
        document.fileName.replace(/\.md$/i, ".html")
      ),
    });

    if (uri) {
      await vscode.workspace.fs.writeFile(uri, Buffer.from(fullHtml, "utf-8"));
      vscode.window.showInformationMessage("Slides exported successfully!");
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
    PreviewPanel.instance = null;
  }
}
