import * as vscode from "vscode";
import { PreviewPanel } from "./previewManager";

export function activate(context: vscode.ExtensionContext) {
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
