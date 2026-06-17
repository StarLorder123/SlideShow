---
title: MD2Slide — Full Feature Demo
logo: https://placehold.co/160x40/555/white?text=MD2Slide
logoPosition: top-right
backgroundColor: "#0d1117"
---

# Full Feature Demo 🚀

<!-- slide-title: Welcome | top-right -->

Everything MD2Slide can do — in one presentation.

This file demonstrates: frontmatter, per-slide overlays, backgrounds,
code blocks, tables, images, and more.

---

# Text Formatting

<!-- slide-title: Typography | top-left -->

- **Bold text** for emphasis
- *Italic text* for subtlety
- ~~Strikethrough~~ for corrections
- `inline code` for commands or variables
- [Links](https://revealjs.com) for references
- > Blockquotes for citations

---

# Lists — Ordered & Unordered

<!-- slide-title: Lists Demo -->

## Unordered
- First item
- Second item
  - Nested item A
  - Nested item B
- Third item

## Ordered
1. Step one — Install
2. Step two — Configure
3. Step three — Deploy

---

# Code — Multi-Language

<!-- slide-title: Code Examples | bottom-left -->

```javascript
// JavaScript
const app = express();
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", uptime: process.uptime() });
});
```

```go
// Go
func HealthCheck(w http.ResponseWriter, r *http.Request) {
    json.NewEncoder(w).Encode(map[string]interface{}{
        "status": "ok",
    })
}
```

---

# Tables & Data

<!-- slide-title: Data Display | bottom-right -->

| Language   | Speed  | Typing    | Use Case       |
|------------|--------|-----------|----------------|
| Rust       | ⚡⚡⚡  | Static    | Systems        |
| TypeScript | ⚡⚡    | Gradual   | Web/Fullstack  |
| Python     | ⚡      | Dynamic   | Data/AI        |
| Go         | ⚡⚡⚡  | Static    | Backend/CLI    |

---

# Images

<!-- slide-title: Media -->

![Placeholder](https://placehold.co/600x300/444/white?text=Sample+Image)

Images work with standard Markdown syntax.
Local paths are resolved relative to the `.md` file.

---

# Overlay Positions

<!-- slide-title: Four Corners | top-right -->

| Position        | Syntax                                          |
|-----------------|-------------------------------------------------|
| Top-Left        | `<!-- slide-title: text | top-left -->`         |
| Top-Right       | `<!-- slide-title: text | top-right -->`        |
| Bottom-Left     | `<!-- slide-title: text | bottom-left -->`      |
| Bottom-Right    | `<!-- slide-title: text | bottom-right -->`     |

The overlay bar is **fixed** — it never scrolls and stays
on top of every slide.

---

# Per-Slide Backgrounds

<!-- slide-bg: color=#1b4332 | opacity=0.9 -->

This slide has a **dark green** background via:

`<!-- slide-bg: color=#1b4332 | opacity=0.9 -->`

It overrides the global `backgroundColor: "#0d1117"` from frontmatter.

---

# Gradient Background

<!-- slide-bg: color=linear-gradient(to right, #0f0c29, #302b63, #24243e) -->

CSS gradients in the `color` key:

`<!-- slide-bg: color=linear-gradient(to right, #0f0c29, #302b63, #24243e) -->`

---

# Slide without Override

This slide has **no per-slide comments** at all.
It inherits the global `title` and `backgroundColor` from frontmatter.

---

# Export & Share

<!-- slide-title: Deployment -->

```bash
# Export to standalone HTML
# (Use the command palette: MD2Slide: Export to Standalone HTML)

# The exported file includes everything — share it as a single .html
```

Key features of the exported HTML:
- ✅ **Zero dependencies** — all assets from CDN
- ✅ **Self-contained** — single `.html` file
- ✅ **Logo & title overlay** preserved
- ✅ **All themes supported**

---

# Keyboard Shortcuts

<!-- slide-title: Cheatsheet -->

| Shortcut          | Action                      |
|-------------------|-----------------------------|
| `Ctrl+Shift+M`    | Open preview                |
| `Ctrl+Shift+O`    | Toggle slide overview       |
| `Esc`             | Slide overview (in preview) |
| `←` / `→`         | Navigate slides             |
| `F`               | Fullscreen                  |

---

# Themes

<!-- slide-bg: color=#1a1a2e -->

MD2Slide supports all 7 Reveal.js themes:

`black` · `white` · `league` · `beige` · `night` · `serif` · `simple`

Set via the VS Code setting `md2slide.theme`.

---

# Thank You! 🎉

<!-- slide-title: The End -->

**MD2Slide** — Presentations for developers who prefer code.

- 📝 Write in Markdown
- 👀 Live preview with hot-reload
- 🎨 Fully customizable
- 📤 Export to HTML
