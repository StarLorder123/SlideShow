/**
 * Generates the full HTML template for a Reveal.js presentation.
 */
export class SlideTemplate {
  private static readonly REVEAL_VERSION = "4.5.0";
  private static readonly CDN_BASE = `https://cdnjs.cloudflare.com/ajax/libs/reveal.js/${SlideTemplate.REVEAL_VERSION}`;

  /**
   * Build a complete HTML string with Reveal.js injected.
   */
  static build(htmlContent: string, theme: string = "black"): string {
    return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="${SlideTemplate.CDN_BASE}/reveal.min.css">
    <link rel="stylesheet" href="${SlideTemplate.CDN_BASE}/theme/${theme}.min.css" id="theme">
</head>
<body>
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
}
