import * as vscode from "vscode";
import { PreviewPanel } from "./previewManager";

let statusBar: vscode.StatusBarItem;

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

  context.subscriptions.push(showPreviewCmd, exportHtmlCmd);
}

export function deactivate() {
  PreviewPanel.getInstance().dispose();
}
