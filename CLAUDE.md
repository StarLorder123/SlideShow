# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with this repository.

## Project Overview

**MD2Slide** (package name: `slideshow`) is a VS Code extension that transforms Markdown files into HTML-based presentation slides using Reveal.js. It provides live preview with hot-reload, standalone HTML export, and supports YAML frontmatter for per-presentation logo/title overlays.

## Package Manager

This project uses **pnpm** for all package management. Never use npm.

## Architecture

```
src/
├── extension.ts          # Entry point — registers 5 commands, status bar, outline tree view
├── previewManager.ts     # Singleton `PreviewPanel` — Webview lifecycle, rendering, hot-reload (300ms debounce), export, logo path resolution
├── outlineProvider.ts    # TreeDataProvider — parses slides into a sidebar outline with click-to-navigate
├── compiler/
│   └── mdCompiler.ts     # `parseSlides()` splits on `/\n---\n/g`, renders via markdown-it; `extractFrontmatter()` parses YAML frontmatter
└── template/
    └── slideTemplate.ts  # `SlideTemplate.build(htmlContent, options)` — returns full HTML string with Reveal.js CDN assets, overlay CSS, and template
```

**Data flow:** Editor edit → `onDidChangeTextDocument` → debounce (300ms) → `extractFrontmatter()` → `compileMarkdown(body)` → `SlideTemplate.build()` → `webview.postMessage({ command: 'update', htmlContent })` → Webview updates `.slides` innerHTML and calls `Reveal.sync()`.

If frontmatter metadata changes (logo/title/position), the hot-reload path falls back to a full `render()` (page reload) instead of partial update, so the overlay is recreated.

**Key patterns:**
- `PreviewPanel` is a Singleton. All hot-reload disposables are registered on `this.disposables[]` and cleaned up in `dispose()`. The singleton instance is nulled on dispose and recreated on next `getInstance()`.
- `SlideTemplate.build()` now takes a `SlideBuildOptions` object (`{ theme?, logoUrl?, logoPosition?, title? }`) instead of a positional `theme` string. All callers are in `previewManager.ts`.

## Commands

| Command | Description |
|---------|-------------|
| `pnpm run compile` | Type-check + bundle via esbuild → `dist/extension.js` |
| `pnpm run watch` | Run esbuild + tsc in watch mode |
| `pnpm run package` | Production build (minified, no sourcemaps) |

**Debugging:** Press F5 in VS Code to launch an Extension Development Host window with the extension loaded.

## YAML Frontmatter (Logo & Title Overlay)

Users can specify a logo and/or presentation title in the `.md` file frontmatter. These appear as a fixed overlay on every slide.

```markdown
---
logo: ./assets/logo.png   # URL (https://...) or local path (relative to .md file)
logoPosition: top-right    # "top-left" or "top-right" (default: top-right)
title: My Presentation     # plain text shown next to the logo
---

# Slide 1
Content
```

All fields are optional. Priority: **frontmatter > VS Code settings** (`md2slide.logo`, `md2slide.logoPosition`, `md2slide.presentationTitle`).

**Logo resolution:**
- `http(s)://` URLs → passed through unchanged
- Local paths → resolved relative to the `.md` file location
  - In preview/webview: converted via `panel.webview.asWebviewUri()`
  - In export: read from disk and embedded as base64 data URI

**Overlay CSS:** `position: fixed; z-index: 30; pointer-events: none` — sits above slides, never blocks interaction. White text with `text-shadow` for readability on all Reveal.js themes.

**Frontmatter parsing:** Uses `js-yaml`. Malformed YAML is caught and logged as a warning; the pipeline proceeds without metadata. The frontmatter is stripped before `parseSlides()` runs, so frontmatter content never becomes a spurious slide.

## Dependencies

- **Runtime:** `markdown-it` (^14.1.0), `js-yaml` (^4.1.0)
- **Dev:** `esbuild` (bundler), `typescript` (^5.5.4), `@types/vscode`, `@types/markdown-it`, `@types/js-yaml`, `npm-run-all`

## Important Constraints

- `moduleResolution` is `Node16` (defaults from `module: Node16`), so use `import X from 'module'` with `esModuleInterop: true`.
- `external: ['vscode']` in esbuild — the `vscode` module is provided by the extension host at runtime, never bundle it.
- Reveal.js assets load from cdnjs CDN — the exported HTML requires internet access unless assets are vendored.
- The preview Webview uses `retainContextWhenHidden: true` to preserve Reveal.js state when the panel is hidden.
- This project uses **pnpm**, not npm. All install/run commands must use `pnpm`.
