---
title: Background Showcase
backgroundColor: "#1a1a2e"
backgroundSize: cover
backgroundPosition: center
backgroundRepeat: no-repeat
---

# Global Background Color

The frontmatter sets `backgroundColor: "#1a1a2e"` for **all slides**.

This is a deep navy color applied globally.

---

# Per-Slide Background Color

<!-- slide-bg: color=#2d6a4f -->

This slide overrides the background color to a **forest green** using:

`<!-- slide-bg: color=#2d6a4f -->`

---

# Per-Slide Gradient Background

<!-- slide-bg: color=linear-gradient(135deg, #667eea 0%, #764ba2 100%) -->

CSS gradients work too! This slide uses a purple-blue gradient:

`<!-- slide-bg: color=linear-gradient(135deg, #667eea 0%, #764ba2 100%) -->`

---

# Background Image (Global)

The frontmatter can set a global `backgroundImage`.
Per-slide `image=` in `<!-- slide-bg: ... -->` overrides it.

Example frontmatter:
```yaml
backgroundImage: https://example.com/bg.jpg
backgroundSize: cover
backgroundOpacity: 0.3
```

---

# Background with Opacity

<!-- slide-bg: color=#e63946 | opacity=0.85 -->

This slide uses a semi-transparent red:

`<!-- slide-bg: color=#e63946 | opacity=0.85 -->`

Full opacity is `1.0`, transparent is `0.0`.

---

# Background with Size & Position

<!-- slide-bg: color=#1d3557 | size=contain | position=top left -->

Control how backgrounds render:

`<!-- slide-bg: color=#1d3557 | size=contain | position=top left -->`

Options for `size`: `cover`, `contain`, `auto`, or any CSS value.
Options for `position`: `center`, `top`, `bottom`, `left`, `right`, etc.

---

# Background with Repeat

<!-- slide-bg: color=#2b2b2b | repeat=repeat -->

Enable tiling with `repeat`:

`<!-- slide-bg: color=#2b2b2b | repeat=repeat -->`

Options: `no-repeat`, `repeat`, `repeat-x`, `repeat-y`.

---

# All Background Properties

<!-- slide-bg: color=#264653 | image=https://placehold.co/200x200/2a9d8f/white?text=Pattern | size=200px | position=top right | repeat=repeat | opacity=0.5 -->

Combining all available keys in one comment:

```
<!-- slide-bg:
  color=#264653 |
  image=https://placehold.co/200x200/2a9d8f/white?text=Pattern |
  size=200px |
  position=top right |
  repeat=repeat |
  opacity=0.5
-->
```

---

# Global Background Summary

Frontmatter keys for slide-wide defaults:

| Key                  | Example Value        |
|----------------------|----------------------|
| `backgroundColor`    | `"#1a1a2e"`          |
| `backgroundImage`    | `"./assets/bg.jpg"`  |
| `backgroundSize`     | `"cover"`            |
| `backgroundPosition` | `"center"`           |
| `backgroundRepeat`   | `"no-repeat"`        |
| `backgroundOpacity`  | `0.5`                |

Per-slide `<!-- slide-bg: ... -->` always overrides the matching global value.
