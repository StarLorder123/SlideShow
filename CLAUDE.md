# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with this repository.

## Project Overview

**SlideShow** (package name: `slideshow`) is a VS Code extension that transforms Markdown files into HTML-based presentation slides using Reveal.js. It provides live preview with hot-reload, three preview modes, standalone HTML export, and supports YAML frontmatter + HTML comments for per-presentation and per-slide overlays/backgrounds.

## Package Manager

This project uses **pnpm** for all package management. Never use npm.

## Architecture

```
src/
├── extension.ts          # Entry point — activates extension, registers 8 commands, status bar, outline tree view
├── previewManager.ts     # Singleton `PreviewPanel` — webview lifecycle, rendering pipeline, hot-reload (300ms debounce), export, 3 preview modes
├── outlineProvider.ts    # TreeDataProvider — parses slides into sidebar outline with click-to-navigate
├── mdCompiler.ts         # `parseSlides()`, `compileMarkdown()`, `extractFrontmatter()` — YAML + markdown processing
├── slideTemplate.ts      # `SlideTemplate.build()` — full HTML page with Reveal.js CDN, overlay CSS, and inline script
├── types.ts              # All shared types: `CornerPosition`, `SlideBackground`, `SlideInfo`, `SlideMetadata`, `SlideBuildOptions`
├── metadataResolver.ts   # `resolveMetadata()` — merges frontmatter + VS Code settings (priority: frontmatter > settings)
├── imageResolver.ts      # `resolveLocalImage()` / `fileToBase64()` — resolves local images to webview URIs or base64 data URIs
└── htmlEscape.ts         # `escapeHtml()` / `escapeAttr()` — shared HTML sanitization
```

**Data flow:** Editor edit → `onDidChangeTextDocument` → debounce (300ms) → `extractFrontmatter()` → `resolveMetadata()` → `compileMarkdown(body, options)` → `SlideTemplate.build()` → `webview.postMessage({ command: 'update', htmlContent, version })` → Webview updates `.slides` innerHTML and calls `Reveal.sync()`.

If frontmatter metadata changes (logo/title/position/background), the hot-reload path falls back to a full `render()` (page reload) instead of partial update, so the overlay is recreated. If only slide content changes, a partial update is sent via postMessage.

**Key patterns:**
- `PreviewPanel` is a Singleton. All hot-reload disposables are registered on `this.disposables[]` and cleaned up in `dispose()`. The singleton instance is nulled on dispose and recreated on next `getInstance()`.
- `SlideTemplate.build()` takes a `SlideBuildOptions` object (`{ theme?, logoUrl?, logoPosition?, title? }`).
- Three preview modes controlled by `showPreview(doc, mode)`: `"fullscreen"` (closes md tab), `"split"` (side-by-side), `"window"` (detached native window).
- `md2slide.previewActive` context key controls visibility of preview-dependent UI (outline view, toolbar buttons).
- Hot-reload uses a monotonic `updateVersion` counter to reject stale async results.

## Commands

| Command | Description |
|---------|-------------|
| `pnpm run compile` | Type-check + bundle via esbuild → `dist/extension.js` |
| `pnpm run watch` | Run esbuild + tsc in watch mode (via `npm-run-all`) |
| `pnpm run package` | Production build (minified, no sourcemaps) |

**Debugging:** Press F5 in VS Code to launch an Extension Development Host window with the extension loaded.

## YAML Frontmatter

Users specify logo, title, position, and global backgrounds in the `.md` frontmatter. All fields optional. Priority: **frontmatter > VS Code settings**.

```yaml
---
logo: ./assets/logo.png
logoPosition: top-right     # top-left | top-right | bottom-left | bottom-right
title: My Presentation
backgroundColor: "#1a1a2e"
backgroundImage: ./bg.jpg
backgroundSize: cover
backgroundPosition: center
backgroundRepeat: no-repeat
backgroundOpacity: 0.5
---
```

**Logo & background image resolution:**
- `http(s)://` URLs → passed through unchanged
- Local paths → resolved relative to the `.md` file
  - Preview/webview: converted via `webview.asWebviewUri()`
  - Export: read from disk, embedded as base64 data URI

**Frontmatter parsing:** Uses `js-yaml`. Malformed YAML is caught and logged as a warning; pipeline proceeds without metadata. Frontmatter is stripped before `parseSlides()` runs.

## Per-Slide Features (HTML Comments)

### Per-Slide Title Overlay

Override or set the overlay title on individual slides:

```markdown
<!-- slide-title: My Custom Title | top-right -->

# Slide Heading
Content
```

### Per-Slide Background

Override the global background per slide:

```markdown
<!-- slide-bg: color=#ff0000 | image=./bg.jpg | size=cover | opacity=0.3 -->

# Slide Heading
Content
```

Per-slide values override global values for that slide only. Comments are stripped from rendered HTML.

## Dependencies

- **Runtime:** `markdown-it` (^14.1.0), `js-yaml` (^4.1.0)
- **Dev:** `esbuild`, `typescript` (^5.5.4), `@types/vscode`, `@types/markdown-it`, `@types/js-yaml`, `@types/node`, `npm-run-all`

## Important Constraints

- `moduleResolution` is `Node16` (defaults from `module: Node16`), so use `import X from 'module'` with `esModuleInterop: true`.
- `external: ['vscode']` in esbuild — the `vscode` module is provided by the extension host at runtime, never bundle it.
- Reveal.js assets load from cdnjs CDN — exported HTML requires internet access for Reveal.js, but local images are base64-embedded.
- The preview Webview uses `retainContextWhenHidden: true` to preserve Reveal.js state when the panel is hidden.
- This project uses **pnpm**, not npm.
- `type: "commonjs"` in package.json — all source files use ESM `import` syntax but esbuild bundles to CJS.
- `activationEvents: []` — extension activates via command calls, not on startup.
