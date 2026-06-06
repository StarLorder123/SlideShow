# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with this repository.

## Project Overview

**MD2Slide** (package name: `slideshow`) is a VS Code extension that transforms Markdown files into HTML-based presentation slides using Reveal.js. It provides live preview with hot-reload and standalone HTML export.

## Architecture

```
src/
├── extension.ts          # Entry point — registers `md2slide.showPreview` and `md2slide.exportHtml` commands
├── previewManager.ts     # Singleton `PreviewPanel` — Webview lifecycle, rendering, hot-reload (300ms debounce), export
├── compiler/
│   └── mdCompiler.ts     # `compileMarkdown(text)` — splits on `/\n---\n/g`, wraps each chunk in `<section>`, renders via markdown-it
└── template/
    └── slideTemplate.ts  # `SlideTemplate.build(htmlContent, theme)` — returns full HTML string with Reveal.js CDN assets
```

**Data flow:** Editor edit → `onDidChangeTextDocument` → debounce (300ms) → `compileMarkdown()` → `SlideTemplate.build()` → `webview.postMessage({ command: 'update', htmlContent })` → Webview updates `.slides` innerHTML and calls `Reveal.sync()`.

**Key pattern:** `PreviewPanel` uses a Singleton. All hot-reload disposables are registered on `this.disposables[]` and cleaned up in `dispose()`. The singleton instance is nulled on dispose and recreated on next `getInstance()`.

## Commands

| Command | Description |
|---------|-------------|
| `npm run compile` | Type-check + bundle via esbuild → `dist/extension.js` |
| `npm run watch` | Run esbuild + tsc in watch mode (Ctrl+Shift+B in VS Code) |
| `npm run package` | Production build (minified, no sourcemaps) |

**Debugging:** Press F5 in VS Code to launch an Extension Development Host window with the extension loaded.

## Dependencies

- **Runtime:** `markdown-it` (^14.1.0)
- **Dev:** `esbuild` (bundler), `typescript` (^5.5.4), `@types/vscode`, `@types/markdown-it`, `npm-run-all`

## Important Constraints

- `moduleResolution` is `Node16` (defaults from `module: Node16`), so use `import X from 'module'` with `esModuleInterop: true`.
- `external: ['vscode']` in esbuild — the `vscode` module is provided by the extension host at runtime, never bundle it.
- Reveal.js assets load from cdnjs CDN — the exported HTML requires internet access unless assets are vendored.
- The preview Webview uses `retainContextWhenHidden: true` to preserve Reveal.js state when the panel is hidden.
