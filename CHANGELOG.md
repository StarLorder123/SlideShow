# Change Log

## [Unreleased]

### Added

- Logo & title overlay via YAML frontmatter (`logo`, `logoPosition`, `title`)
- `md2slide.logo`, `md2slide.logoPosition`, `md2slide.presentationTitle` VS Code configuration
- Editor toolbar button (left of layout actions) + keyboard shortcut `Ctrl+Shift+M` for quick preview launch
- `example.md` demonstrating frontmatter and preview features
- Git-commit skill with CHANGELOG auto-update
- Explorer context menu: right-click `.md` file → "Open Presentation Preview"

### Changed

- `SlideTemplate.build()` signature: second argument changed from `theme: string` to `options: SlideBuildOptions`
- tsconfig: added `"types": ["node"]` for explicit Node.js type resolution
- README added with full feature documentation

### Fixed

- Unused `parseSlides` import removed from `previewManager.ts`
- `@types/node` type resolution on Node.js v24

## 0.0.1

- Initial release: Markdown → Reveal.js preview, hot-reload, HTML export, slide outline
