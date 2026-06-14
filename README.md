# MD2Slide

> Live-preview and export Markdown as stunning web-based slides. Built for developers who prefer code over PowerPoint.

A VS Code extension that transforms Markdown files into [Reveal.js](https://revealjs.com/) presentations with hot-reload preview and standalone HTML export.

## Features

- **Live Preview** — See slides update in real-time as you type (300ms debounce)
- **YAML Frontmatter** — Set logo, title, and position per-presentation
- **Logo & Title Overlay** — Fixed header on every slide with logo image and/or title text
- **Quick Launch** — Toolbar button in editor title bar + keyboard shortcut `Ctrl+Shift+M`
- **Slide Outline** — Sidebar view listing all slides with click-to-navigate
- **Overview Mode** — Thumbnail grid of all slides (`Ctrl+Shift+O`)
- **Export HTML** — Standalone HTML file with embedded assets

## Quick Start

1. Open any `.md` file in VS Code
2. Press `Ctrl+Shift+M` or click the 📺 button in the editor title bar
3. Edit the markdown — preview updates instantly
4. Export: `Ctrl+Shift+P` → `MD2Slide: Export to Standalone HTML`

## Slide Splitting

Use `---` on its own line to split content into separate slides:

```markdown
# Slide 1
Content here

---

# Slide 2
More content
```

## YAML Frontmatter

Add logo and title overlay to all slides via frontmatter at the top of your `.md` file:

```yaml
---
logo: ./assets/logo.png   # local path or URL
logoPosition: top-right    # "top-left" or "top-right"
title: My Presentation
---
```

| Field | Description | Default |
|-------|-------------|---------|
| `logo` | Image URL or local path | (none) |
| `logoPosition` | `top-left` or `top-right` | `top-right` |
| `title` | Presentation title text | (none) |

**Local paths** are resolved relative to the `.md` file. On export, images are embedded as base64 — the output HTML is fully self-contained.

**VS Code settings** (`md2slide.logo`, `md2slide.logoPosition`, `md2slide.presentationTitle`) provide global defaults. Frontmatter values override them.

## Commands

| Command | Keybinding |
|---------|------------|
| `MD2Slide: Open Presentation Preview` | `Ctrl+Shift+M` |
| `MD2Slide: Export to Standalone HTML` | — |
| `MD2Slide: Toggle Slide Overview` | `Ctrl+Shift+O` |
| `MD2Slide: Refresh Outline` | — |

## Configuration

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `md2slide.theme` | `string` | `black` | Reveal.js theme: `black`, `white`, `league`, `beige`, `night`, `serif`, `simple` |
| `md2slide.logo` | `string` | `""` | Default logo path or URL |
| `md2slide.logoPosition` | `string` | `top-right` | `top-left` or `top-right` |
| `md2slide.presentationTitle` | `string` | `""` | Default presentation title |

## Development

```bash
pnpm install        # Install dependencies
pnpm run compile    # Type-check + bundle
pnpm run watch      # Watch mode
```

Press **F5** in VS Code to launch the Extension Development Host.

## Tech Stack

- [Reveal.js](https://revealjs.com/) — Presentation framework
- [markdown-it](https://github.com/markdown-it/markdown-it) — Markdown parser
- [js-yaml](https://github.com/nodeca/js-yaml) — YAML frontmatter parser
- TypeScript + esbuild
