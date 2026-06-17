---
title: Per-Slide Overlay Demo
---

# Per-Slide Title Overlays

<!-- slide-title: Overview -->

Each slide can have its **own overlay title** using HTML comments.
They appear in the same overlay bar as the global title.

---

# Top-Right Position

<!-- slide-title: Top-Right Corner | top-right -->

This slide uses the `top-right` position (the default).

Use `<!-- slide-title: text | top-right -->` to set it.

---

# Top-Left Position

<!-- slide-title: Top-Left Corner | top-left -->

This slide uses `top-left` positioning.

Use `<!-- slide-title: text | top-left -->` for this layout.

---

# Bottom-Right Position

<!-- slide-title: Bottom-Right Corner | bottom-right -->

This slide positions the overlay at `bottom-right`.

---

# Bottom-Left Position

<!-- slide-title: Bottom-Left Corner | bottom-left -->

And this one uses `bottom-left`.

---

# Override Global Title

<!-- slide-title: 🚀 Custom Per-Slide Title -->

If you set a global `title` in frontmatter, a per-slide `<!-- slide-title: ... -->`
**overrides** it for that slide. If you omit the position, the global default applies.

---

# Slides Without Overlay

This slide has no `<!-- slide-title: ... -->` comment.
It falls back to the **global frontmatter title** set at the top of this file.

---

# Mix & Match

<!-- slide-title: Mixed Strategy | bottom-right -->

You can freely mix slides with and without per-slide titles.
Only slides with the comment get custom overlays — the rest use the global default.
