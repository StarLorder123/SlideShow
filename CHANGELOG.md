# Change Log

## [Unreleased]

### Added

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

- `SlideTemplate.build()` signature: second argument changed from `theme: string` to `options: SlideBuildOptions`
- tsconfig: added `"types": ["node"]` for explicit Node.js type resolution
- README added with full feature documentation

### Fixed

- Git-commit skill: replace PowerShell here-string syntax with POSIX-compatible `-m` flags for multi-line commit messages
- Unused `parseSlides` import removed from `previewManager.ts`
- `@types/node` type resolution on Node.js v24

## 0.0.1

- Initial release: Markdown → Reveal.js preview, hot-reload, HTML export, slide outline
