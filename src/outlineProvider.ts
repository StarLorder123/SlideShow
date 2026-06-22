import * as vscode from "vscode";
import { parseSlides, extractFrontmatter } from "./mdCompiler";
import { SlideInfo } from "./types";

/**
 * TreeDataProvider that shows the slide outline in a sidebar view.
 * Each node represents one slide, displaying its title and index.
 */
export class OutlineProvider
  implements vscode.TreeDataProvider<SlideNode>
{
  private _onDidChangeTreeData: vscode.EventEmitter<
    SlideNode | undefined | null | void
  > = new vscode.EventEmitter<SlideNode | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<
    SlideNode | undefined | null | void
  > = this._onDidChangeTreeData.event;

  private document: vscode.TextDocument | null = null;
  private slides: SlideInfo[] = [];

  /**
   * Set the document to parse. Call refresh() afterward.
   */
  setDocument(doc: vscode.TextDocument | null): void {
    this.document = doc;
    if (doc && doc.languageId === "markdown") {
      const { body } = extractFrontmatter(doc.getText());
      this.slides = parseSlides(body);
    } else {
      this.slides = [];
    }
  }

  /**
   * Notify the tree view to refresh.
   */
  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: SlideNode): vscode.TreeItem {
    return element;
  }

  getChildren(element?: SlideNode): SlideNode[] {
    if (element) {
      return [];
    }
    return this.slides.map(
      (s) =>
        new SlideNode(
          s.index + 1,
          s.title,
          s.startLine,
          this.document
        )
    );
  }
}

/**
 * Represents a single slide in the outline tree.
 */
export class SlideNode extends vscode.TreeItem {
  constructor(
    public readonly index: number,
    public readonly title: string,
    public readonly startLine: number,
    private readonly document: vscode.TextDocument | null
  ) {
    super(title, vscode.TreeItemCollapsibleState.None);
    this.tooltip = `Slide ${index} (line ${startLine + 1})`;
    this.description = `#${index}`;
    this.iconPath = new vscode.ThemeIcon("file-submodule");

    // Click: navigate editor to slide position
    this.command = {
      command: "md2slide.outline.gotoSlide",
      title: "Go to Slide",
      arguments: [{ documentUri: document?.uri, startLine }],
    };
  }
}
