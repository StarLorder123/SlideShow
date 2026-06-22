# Change Log

## [Unreleased]

### Added

- **Split-view preview mode**: `$(split-horizontal)` toolbar button opens preview beside the markdown editor, keeping both visible side by side (`md2slide.showPreviewSplit` command)
- **New-window preview mode**: `$(empty-window)` toolbar button detaches the preview into its own native window (`md2slide.showPreviewWindow` command)
- Fullscreen icon changed from `$(screen-full)` to `$(eye)` across command, toolbar, and status bar
- Samples directory with 5 categorized demo files (`01-basic-presentation`, `02-corporate-branded`, `03-per-slide-titles`, `04-background-showcase`, `05-full-feature-demo`)
- Full-area preview mode: opens in same editor column, closes markdown tab, fills entire editor area
- Toggle button on preview webview tab to return to markdown editor (`md2slide.closePreview`)
- Logo & title overlay via YAML frontmatter (`logo`, `logoPosition`, `title`)
- `md2slide.logo`, `md2slide.logoPosition`, `md2slide.presentationTitle` VS Code configuration
- Editor toolbar button (left of layout actions) + keyboard shortcut `Ctrl+Shift+M` for quick preview launch
- `example.md` demonstrating frontmatter and preview features
- Git-commit skill with CHANGELOG auto-update
- Explorer context menu: right-click `.md` file → "Open Presentation Preview"
- MIT license added, package metadata updated (`license` field, version bump to 0.1.0)
- Chinese README (`README.zh-CN.md`)
- Package metadata: repository, bugs, homepage, keywords, author, publisher, gallery banner
- Background configuration settings documented in README

### Changed

- **Source structure refactored**: flat layout with single-responsibility modules — extracted `types.ts`, `htmlEscape.ts`, `metadataResolver.ts`, `imageResolver.ts`; flattened `compiler/`, `template/` single-file folders into `src/` root
- `previewManager.ts` slimmed from 692 to 512 lines by delegating metadata resolution, image handling, and HTML escaping to standalone modules
- Hot-reload now skips scheduling when an update is already in-flight, preventing update pile-up during fast typing
- Partial webview updates carry a monotonic version counter to reject stale async results arriving out of order
- `SlideTemplate.build()` signature: second argument changed from `theme: string` to `options: SlideBuildOptions`
- tsconfig: added `"types": ["node"]` for explicit Node.js type resolution
- README added with full feature documentation

### Fixed

- Git-commit skill: replace PowerShell here-string syntax with POSIX-compatible `-m` flags for multi-line commit messages
- Unused `parseSlides` import removed from `previewManager.ts`
- `@types/node` type resolution on Node.js v24

## 0.0.1

- Initial release: Markdown → Reveal.js preview, hot-reload, HTML export, slide outline
