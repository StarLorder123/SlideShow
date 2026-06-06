import * as vscode from "vscode";
import { PreviewPanel } from "./previewManager";
import { OutlineProvider, SlideNode } from "./outlineProvider";

let statusBar: vscode.StatusBarItem;
let outlineProvider: OutlineProvider;

function updateStatusBarVisibility(): void {
  const editor = vscode.window.activeTextEditor;
  if (editor && editor.document.languageId === "markdown") {
    statusBar.show();
  } else {
    statusBar.hide();
  }
}

export function activate(context: vscode.ExtensionContext) {
  // Status bar button for markdown files
  statusBar = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    100
  );
  statusBar.text = "$(screen-full) Preview Slides";
  statusBar.command = "md2slide.showPreview";
  statusBar.tooltip = "Open Markdown Slide Preview";
  context.subscriptions.push(statusBar);

  // Toggle status bar on editor change
  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor(() => {
      updateStatusBarVisibility();
    })
  );

  // Toggle status bar on document open
  context.subscriptions.push(
    vscode.workspace.onDidOpenTextDocument(() => {
      updateStatusBarVisibility();
    })
  );

  updateStatusBarVisibility();

  // Outline provider
  outlineProvider = new OutlineProvider();
  const outlineTreeView = vscode.window.createTreeView("md2slideOutline", {
    treeDataProvider: outlineProvider,
  });
  context.subscriptions.push(outlineTreeView);
  PreviewPanel.getInstance().setOutlineProvider(outlineProvider);

  // Register the show-preview command
  const showPreviewCmd = vscode.commands.registerCommand(
    "md2slide.showPreview",
    () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showWarningMessage("No active editor found.");
        return;
      }
      PreviewPanel.getInstance().showPreview(editor.document);
    }
  );

  // Register the export-html command
  const exportHtmlCmd = vscode.commands.registerCommand(
    "md2slide.exportHtml",
    async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showWarningMessage("No active editor found.");
        return;
      }
      await PreviewPanel.getInstance().exportHtml(editor.document);
    }
  );

  // Register the toggle-overview command
  const toggleOverviewCmd = vscode.commands.registerCommand(
    "md2slide.toggleOverview",
    () => {
      PreviewPanel.getInstance().toggleOverview();
    }
  );

  // Register the outline goto-slide command
  const gotoSlideCmd = vscode.commands.registerCommand(
    "md2slide.outline.gotoSlide",
    async (args: { documentUri?: vscode.Uri; startLine: number }) => {
      if (!args || !args.documentUri) {
        return;
      }
      const doc = await vscode.workspace.openTextDocument(args.documentUri);
      const editor = await vscode.window.showTextDocument(doc);
      const position = new vscode.Position(args.startLine, 0);
      editor.selection = new vscode.Selection(position, position);
      editor.revealRange(
        new vscode.Range(position, position),
        vscode.TextEditorRevealType.InCenter
      );

      // Also navigate the webview to the same slide
      PreviewPanel.getInstance().navigateToSlide(args.startLine);
    }
  );

  // Register the refresh-outline command
  const refreshOutlineCmd = vscode.commands.registerCommand(
    "md2slide.refreshOutline",
    () => {
      outlineProvider.refresh();
    }
  );

  context.subscriptions.push(
    showPreviewCmd,
    exportHtmlCmd,
    toggleOverviewCmd,
    gotoSlideCmd,
    refreshOutlineCmd
  );
}

export function deactivate() {
  PreviewPanel.getInstance().dispose();
}
