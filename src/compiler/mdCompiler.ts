import MarkdownIt from "markdown-it";

/**
 * Split markdown text by `---` delimiters (surrounded by blank lines)
 * and wrap each section in `<section>` tags after rendering as HTML.
 */
export function compileMarkdown(text: string): string {
  const md = new MarkdownIt({ html: true, breaks: false });

  // Handle empty or null input gracefully
  if (!text || text.trim().length === 0) {
    return "";
  }

  const slides = text.split(/\n---\n/g);

  return slides
    .map((slide) => {
      const trimmed = slide.trim();
      if (trimmed.length === 0) {
        return "";
      }
      return `<section>${md.render(trimmed)}</section>`;
    })
    .filter(Boolean)
    .join("\n");
}
