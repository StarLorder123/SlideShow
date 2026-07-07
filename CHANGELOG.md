# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added

- Quick Insert sidebar panel with 15 component snippets across 4 categories (Layout, Content, Media, Effects)

### Added

- Auto-detection of overflow slides — content exceeding slide height is wrapped in `r-stretch` for auto-scaling

### Fixed

- Unhandled promise rejection from non-existent `workbench.action.maximizeEditor` command
- Hot-reload rendering issues caused by double `Reveal.sync()` calls after partial updates
- Sidebar views not appearing due to empty `activationEvents` and restrictive `when` clauses on views
- Slides Outline showing empty on activation (only loaded during preview)
- Slides Outline clearing when focus moved to preview webview

## [0.1.0] - Initial release

- Markdown-to-slide preview with Reveal.js
- Three preview modes: fullscreen, split, and new-window
- Hot-reload with 300ms debounce
- YAML frontmatter for logo, title, backgrounds
- Per-slide overlays and backgrounds via HTML comments
- Standalone HTML export
- Slide outline tree view
- Status bar preview button
