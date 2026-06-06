import MarkdownIt from "markdown-it";

export interface SlideInfo {
  index: number;
  title: string;
  startLine: number;
  html: string;
}

/**
 * Parse markdown text into structured slide data.
 * Splits on `\n---\n`, extracts first heading as title,
 * renders HTML, and tracks starting line number.
 */
export function parseSlides(text: string): SlideInfo[] {
  const md = new MarkdownIt({ html: true, breaks: false });

  if (!text || text.trim().length === 0) {
    return [];
  }

  // Split on \n---\n and track raw segments
  const rawSegments = text.split(/(\n---\n)/g);
  const segments: string[] = [];
  let currentLine = 0;

  // Merge content segments and track line offsets
  for (const segment of rawSegments) {
    if (segment === "\n---\n") {
      // Skip delimiter, just advance line counter
      currentLine += 3;
    } else if (segment.trim().length > 0) {
      const startLine = currentLine;
      currentLine += segment.split("\n").length;
      segments.push(segment);
    } else {
      // Empty segment between delimiters
      currentLine += segment.split("\n").length - 1;
    }
  }

  const slides: SlideInfo[] = [];
  let lineOffset = 0;

  for (let i = 0; i < segments.length; i++) {
    const trimmed = segments[i].trim();
    if (!trimmed) continue;

    // Extract first heading (# ... or ## ...)
    const titleMatch = trimmed.match(/^#{1,6}\s+(.+)$/m);
    const title = titleMatch
      ? titleMatch[1].trim()
      : `Slide ${i + 1}`;

    // Calculate start line by counting newlines before this segment
    let startLine = 0;
    if (i > 0) {
      // Count lines in all previous segments + delimiters
      let charCount = 0;
      for (let j = 0; j < i; j++) {
        charCount += segments[j].length + 5; // +5 for \n---\n
      }
      startLine = text.substring(0, charCount).split("\n").length - 1;
    }

    slides.push({
      index: i,
      title,
      startLine,
      html: `<section>${md.render(trimmed)}</section>`,
    });
  }

  return slides;
}

/**
 * Compile markdown into a single HTML string of <section> elements.
 * (Backwards-compatible with existing code.)
 */
export function compileMarkdown(text: string): string {
  const slides = parseSlides(text);
  return slides.map((s) => s.html).filter(Boolean).join("\n");
}
