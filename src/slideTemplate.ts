import { SlideBuildOptions } from "./types";
import { escapeHtml, escapeAttr } from "./htmlEscape";

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
        .md2slide-overlay--top-left     { top: 0; left: 0; flex-direction: row; }
        .md2slide-overlay--top-right    { top: 0; right: 0; flex-direction: row-reverse; }
        .md2slide-overlay--bottom-left  { bottom: 0; left: 0; flex-direction: row; }
        .md2slide-overlay--bottom-right { bottom: 0; right: 0; flex-direction: row-reverse; }
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
        var lastUpdateVersion = 0;

        Reveal.initialize({
            controls: true,
            progress: true,
            center: true,
            hash: true,
            overview: true
        });

        function updateSlideTitle(slide) {
            var titleEl = document.querySelector('.md2slide-overlay .md2slide-title');
            var overlay = document.querySelector('.md2slide-overlay');
            if (!overlay) return;

            var slideTitle = slide ? slide.getAttribute('data-slide-title') : null;
            var slidePos = slide ? slide.getAttribute('data-slide-title-position') : null;

            // If overlay has no title span but we have a slide title, create one
            if (slideTitle && !titleEl) {
                titleEl = document.createElement('span');
                titleEl.className = 'md2slide-title';
                overlay.appendChild(titleEl);
            }

            if (titleEl && slideTitle) {
                titleEl.textContent = slideTitle;
            }

            // Update position class if specified
            if (slidePos) {
                overlay.className = overlay.className.replace(/md2slide-overlay--\\S+/g, '');
                overlay.classList.add('md2slide-overlay--' + slidePos);
            }
        }

        // Auto-detect overflow slides and wrap content in r-stretch for auto-scaling.
        // Runs once per section lifecycle — skipped if user already added r-stretch manually.
        function autoFitSection(section) {
            if (!section || section.dataset.autoFit) return;
            section.dataset.autoFit = '1';

            // Skip if user already uses r-stretch manually
            if (section.querySelector('.r-stretch')) return;

            // Check content overflow (5px tolerance for sub-pixel rounding)
            if (section.scrollHeight > section.clientHeight + 5) {
                var wrapper = document.createElement('div');
                wrapper.className = 'r-stretch';
                while (section.firstChild) {
                    wrapper.appendChild(section.firstChild);
                }
                section.appendChild(wrapper);
            }
        }

        function autoFitAllSections() {
            document.querySelectorAll('.reveal .slides > section').forEach(autoFitSection);
        }

        Reveal.on('slidechanged', function(event) {
            updateSlideTitle(event.currentSlide);
        });

        Reveal.on('ready', function(event) {
            // Defer auto-fit so Reveal's initial layout has settled,
            // then sync once more so r-stretch elements are processed.
            requestAnimationFrame(function() {
                autoFitAllSections();
                Reveal.sync();
            });
            updateSlideTitle(event.currentSlide);
        });

        window.addEventListener('message', event => {
            const message = event.data;
            if (message.command === 'update') {
                // Ignore stale updates that arrive out of order
                if (message.version !== undefined && message.version <= lastUpdateVersion) {
                    return;
                }
                lastUpdateVersion = message.version;
                // Replace slide content, then auto-fit BEFORE sync so
                // Reveal.js sees r-stretch wrappers from the first layout pass.
                document.querySelector('.slides').innerHTML = message.htmlContent;
                autoFitAllSections();
                Reveal.sync();
                // Re-trigger title update after partial content refresh
                updateSlideTitle(Reveal.getCurrentSlide());
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

    const posClass = `md2slide-overlay--${options.logoPosition ?? "top-right"}`;

    let inner = "";
    if (hasLogo) {
      inner += `<img class="md2slide-logo" src="${escapeAttr(options.logoUrl!)}" alt="logo" onerror="this.style.display='none'" />`;
    }
    if (hasTitle) {
      inner += `<span class="md2slide-title">${escapeHtml(options.title!)}</span>`;
    }

    return `<div class="md2slide-overlay ${posClass}">${inner}</div>`;
  }
}
