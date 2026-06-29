import * as vscode from "vscode";

// ── Types ───────────────────────────────────────────────────────────

export interface InsertComponent {
  id: string;
  label: string;
  description: string;
  icon: string;
  snippet: string;
}

export interface ComponentCategory {
  id: string;
  label: string;
  icon: string;
  components: InsertComponent[];
}

// ── Component Definitions ───────────────────────────────────────────

const COMPONENT_CATEGORIES: ComponentCategory[] = [
  {
    id: "layout",
    label: "Layout",
    icon: "layout",
    components: [
      {
        id: "new-slide",
        label: "New Slide",
        description: "Insert slide separator (---)",
        icon: "add",
        snippet: "\n---\n$0",
      },
      {
        id: "title-slide",
        label: "Title Slide",
        description: "Title slide with subtitle and author",
        icon: "home",
        snippet: "---\n\n# ${1:Presentation Title}\n\n## ${2:Subtitle}\n\n${3:Author}\n\n$0",
      },
      {
        id: "two-column",
        label: "Two-Column Layout",
        description: "Side-by-side columns using flexbox",
        icon: "split-horizontal",
        snippet:
          '\n<div style="display: flex; gap: 20px;">\n  <div style="flex: 1;">\n    ${1:Left content}\n  </div>\n  <div style="flex: 1;">\n    ${2:Right content}\n  </div>\n</div>\n$0',
      },
    ],
  },
  {
    id: "content",
    label: "Content",
    icon: "note",
    components: [
      {
        id: "heading-1",
        label: "Heading 1",
        description: "Top-level section heading",
        icon: "symbol-keyword",
        snippet: "\n# ${1:Heading}\n$0",
      },
      {
        id: "heading-2",
        label: "Heading 2",
        description: "Sub-section heading",
        icon: "symbol-keyword",
        snippet: "\n## ${1:Heading}\n$0",
      },
      {
        id: "heading-3",
        label: "Heading 3",
        description: "Sub-sub-section heading",
        icon: "symbol-keyword",
        snippet: "\n### ${1:Heading}\n$0",
      },
      {
        id: "bullet-list",
        label: "Bullet List",
        description: "Unordered list with 3 items",
        icon: "list-unordered",
        snippet:
          "\n- ${1:First item}\n- ${2:Second item}\n- ${3:Third item}\n$0",
      },
      {
        id: "numbered-list",
        label: "Numbered List",
        description: "Ordered list with 3 items",
        icon: "list-ordered",
        snippet:
          "\n1. ${1:First item}\n1. ${2:Second item}\n1. ${3:Third item}\n$0",
      },
      {
        id: "blockquote",
        label: "Blockquote",
        description: "Quoted text with attribution",
        icon: "quote",
        snippet: "\n> ${1:Quote text}\n>\n> — ${2:Author}\n$0",
      },
      {
        id: "code-block",
        label: "Code Block",
        description: "Fenced code block with language picker",
        icon: "code",
        snippet:
          '\n```${1|javascript,typescript,python,html,css,bash,json,markdown,yaml|}\n${2:code}\n```\n$0',
      },
      {
        id: "table",
        label: "Table",
        description: "3-column table template",
        icon: "table",
        snippet:
          "\n| ${1:Header 1} | ${2:Header 2} | ${3:Header 3} |\n| ${4:------} | ${5:------} | ${6:------} |\n| ${7:Cell 1} | ${8:Cell 2} | ${9:Cell 3} |\n$0",
      },
    ],
  },
  {
    id: "media",
    label: "Media",
    icon: "file-media",
    components: [
      {
        id: "image",
        label: "Image",
        description: "Markdown image syntax",
        icon: "file-media",
        snippet: "![${1:Alt text}](${2:./image.png})$0",
      },
      {
        id: "bg-image",
        label: "Background Image",
        description: "Per-slide background image comment",
        icon: "device-camera",
        snippet:
          "\n<!-- slide-bg: image=${1:./background.jpg} | size=${2:cover} -->\n$0",
      },
      {
        id: "bg-color",
        label: "Background Color",
        description: "Per-slide background color comment",
        icon: "color-mode",
        snippet:
          "\n<!-- slide-bg: color=${1:#1a1a2e} -->\n$0",
      },
    ],
  },
  {
    id: "effects",
    label: "Effects",
    icon: "zap",
    components: [
      {
        id: "fragment-fade",
        label: "Fragment (fade-in)",
        description: "Reveal.js fade-in animation",
        icon: "sparkle",
        snippet:
          '<!-- .element: class="fragment fade-in" -->$0',
      },
      {
        id: "fragment-highlight",
        label: "Fragment (highlight)",
        description: "Reveal.js highlight animation",
        icon: "sparkle",
        snippet:
          '<!-- .element: class="fragment highlight-red" -->$0',
      },
      {
        id: "speaker-notes",
        label: "Speaker Notes",
        description: "Reveal.js speaker notes (hidden from audience)",
        icon: "comment",
        snippet:
          '\n<aside class="notes">\n${1:Speaker notes content}\n</aside>\n$0',
      },
    ],
  },
];

// ── Tree Node ───────────────────────────────────────────────────────

class ComponentNode extends vscode.TreeItem {
  constructor(
    label: string,
    collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly component?: InsertComponent,
    public readonly categoryId?: string
  ) {
    super(label, collapsibleState);

    if (component) {
      // Leaf node — click inserts the component
      this.description = component.description;
      this.tooltip = `${component.label}: ${component.description}`;
      this.iconPath = new vscode.ThemeIcon(component.icon);
      this.command = {
        command: "md2slide.insertComponent",
        title: `Insert ${component.label}`,
        arguments: [component.snippet],
      };
    } else if (categoryId) {
      // Category node — expandable group
      const cat = COMPONENT_CATEGORIES.find((c) => c.id === categoryId);
      this.iconPath = new vscode.ThemeIcon(cat?.icon ?? "symbol-namespace");
      this.contextValue = "category";
    }
  }
}

// ── TreeDataProvider ────────────────────────────────────────────────

export class ComponentProvider
  implements vscode.TreeDataProvider<ComponentNode>
{
  private _onDidChangeTreeData = new vscode.EventEmitter<
    ComponentNode | undefined | null | void
  >();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  getTreeItem(element: ComponentNode): vscode.TreeItem {
    return element;
  }

  getChildren(element?: ComponentNode): ComponentNode[] {
    if (!element) {
      // Root: return collapsed category nodes
      return COMPONENT_CATEGORIES.map(
        (cat) =>
          new ComponentNode(
            cat.label,
            vscode.TreeItemCollapsibleState.Collapsed,
            undefined,
            cat.id
          )
      );
    }

    if (element.categoryId) {
      // Category: return leaf component nodes
      const category = COMPONENT_CATEGORIES.find(
        (c) => c.id === element.categoryId
      );
      if (category) {
        return category.components.map(
          (comp) =>
            new ComponentNode(
              comp.label,
              vscode.TreeItemCollapsibleState.None,
              comp
            )
        );
      }
    }

    // Leaf nodes have no children
    return [];
  }

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }
}
