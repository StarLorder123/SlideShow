export interface SlideBuildOptions {
  theme?: string;
  logoUrl?: string;
  logoPosition?: "top-left" | "top-right";
  title?: string;
}

/**
 * Generates the full HTML template for a Reveal.js presentation.
 */
export class SlideTemplate {
  private static readonly REVEAL_VERSION = "4.5.0";
  private static readonly CDN_BASE = `https://cdnjs.cloudflare.com/ajax/libs/reveal.js/${SlideTemplate.REVEAL_VERSION}`;

  /**
   * Build a complete HTML string with Reveal.js injected.
   */
  static build(
    htmlContent: string,
    options: SlideBuildOptions = {}
  ): string {
    const theme = options.theme ?? "black";
    const overlayHtml = SlideTemplate.buildOverlay(options);

    return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="${SlideTemplate.CDN_BASE}/reveal.min.css">
    <link rel="stylesheet" href="${SlideTemplate.CDN_BASE}/theme/${theme}.min.css" id="theme">
    <style>
        .md2slide-overlay {
            position: fixed;
            z-index: 30;
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 16px 24px;
            pointer-events: none;
        }
        .md2slide-overlay--top-left  { top: 0; left: 0; flex-direction: row; }
        .md2slide-overlay--top-right { top: 0; right: 0; flex-direction: row-reverse; }
        .md2slide-logo {
            max-height: 36px;
            max-width: 140px;
            object-fit: contain;
        }
        .md2slide-title {
            font-size: 18px;
            font-weight: 600;
            color: rgba(255,255,255,0.9);
            text-shadow: 0 1px 3px rgba(0,0,0,0.5);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            max-width: 400px;
        }
    </style>
</head>
<body>
    ${overlayHtml}
    <div class="reveal">
        <div class="slides">
            ${htmlContent}
        </div>
    </div>
    <script src="${SlideTemplate.CDN_BASE}/reveal.js"></script>
    <script>
        Reveal.initialize({
            controls: true,
            progress: true,
            center: true,
            hash: true,
            overview: true
        });
        window.addEventListener('message', event => {
            const message = event.data;
            if (message.command === 'update') {
                document.querySelector('.slides').innerHTML = message.htmlContent;
                Reveal.sync();
            } else if (message.command === 'toggleOverview') {
                Reveal.toggleOverview();
            } else if (message.command === 'navigate') {
                Reveal.slide(message.index);
            }
        });
    </script>
</body>
</html>`;
  }

  /**
   * Build the overlay HTML for logo and title.
   * Returns an empty string if neither logo nor title is provided.
   */
  private static buildOverlay(options: SlideBuildOptions): string {
    const hasLogo = !!options.logoUrl;
    const hasTitle = !!options.title;
    if (!hasLogo && !hasTitle) {
      return "";
    }

    const posClass =
      options.logoPosition === "top-left"
        ? "md2slide-overlay--top-left"
        : "md2slide-overlay--top-right";

    let inner = "";
    if (hasLogo) {
      inner += `<img class="md2slide-logo" src="${SlideTemplate.escapeAttr(options.logoUrl!)}" alt="logo" onerror="this.style.display='none'" />`;
    }
    if (hasTitle) {
      inner += `<span class="md2slide-title">${SlideTemplate.escapeHtml(options.title!)}</span>`;
    }

    return `<div class="md2slide-overlay ${posClass}">${inner}</div>`;
  }

  /** Escape a string for safe use in an HTML attribute value. */
  private static escapeAttr(value: string): string {
    return value
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  /** Escape a string for safe use in HTML text content. */
  private static escapeHtml(value: string): string {
    return value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }
}
