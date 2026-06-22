import MarkdownIt from "markdown-it";
import * as yaml from "js-yaml";
import { CornerPosition, SlideBackground, SlideInfo, SlideMetadata } from "./types";
import { escapeHtml, escapeAttr } from "./htmlEscape";

/**
 * Extract YAML frontmatter from the beginning of markdown text.
 * Returns parsed metadata and the remaining body (ready for slide parsing).
 * If no frontmatter is found, returns empty metadata and the original text.
 */
export function extractFrontmatter(text: string): {
  metadata: SlideMetadata;
  body: string;
} {
  if (!text || !text.startsWith("---")) {
    return { metadata: {}, body: text };
  }

  // Find the closing --- that ends frontmatter.
  // Start searching from index 3 to skip the opening ---.
  const closingIdx = text.indexOf("\n---", 3);
  if (closingIdx === -1) {
    // No closing delimiter found — treat as regular content
    return { metadata: {}, body: text };
  }

  // Extract YAML block (skip "---\n" = 4 chars, up to closingIdx)
  const yamlBlock = text.substring(4, closingIdx);
  // Extract body (skip "\n---\n" = 5 chars)
  const body = text.substring(closingIdx + 5).trimStart();

  const metadata: SlideMetadata = {};
  try {
    const parsed = yaml.load(yamlBlock);
    if (parsed && typeof parsed === "object") {
      const obj = parsed as Record<string, unknown>;
      if (typeof obj.logo === "string") {
        metadata.logo = obj.logo;
      }
      if (
        obj.logoPosition === "top-left" ||
        obj.logoPosition === "top-right" ||
        obj.logoPosition === "bottom-left" ||
        obj.logoPosition === "bottom-right"
      ) {
        metadata.logoPosition = obj.logoPosition;
      }
      if (typeof obj.title === "string") {
        metadata.title = obj.title;
      }
      // Background fields
      if (typeof obj.backgroundColor === "string") {
        metadata.backgroundColor = obj.backgroundColor;
      }
      if (typeof obj.backgroundImage === "string") {
        metadata.backgroundImage = obj.backgroundImage;
      }
      if (typeof obj.backgroundSize === "string") {
        metadata.backgroundSize = obj.backgroundSize;
      }
      if (typeof obj.backgroundPosition === "string") {
        metadata.backgroundPosition = obj.backgroundPosition;
      }
      if (typeof obj.backgroundRepeat === "string") {
        metadata.backgroundRepeat = obj.backgroundRepeat;
      }
      if (typeof obj.backgroundOpacity === "number") {
        metadata.backgroundOpacity = obj.backgroundOpacity;
      }
    }
  } catch (e) {
    // Malformed YAML — log warning, continue without metadata
    console.warn("MD2Slide: Failed to parse YAML frontmatter:", e);
  }

  return { metadata, body };
}

/** Regex to detect per-slide title: <!-- slide-title: text | position --> */
const SLIDE_TITLE_RE =
  /<!--\s*slide-title:\s*(.+?)\s*(?:\|\s*(top-left|top-right|bottom-left|bottom-right))?\s*-->/;

/** Regex to detect per-slide background: <!-- slide-bg: key=value | ... --> */
const SLIDE_BG_RE = /<!--\s*slide-bg:\s*(.+?)\s*-->/;

/** Build the overlay HTML element for a per-slide title. */
function buildSlideOverlayHtml(
  title: string,
  position: CornerPosition
): string {
  return `<div class="md2slide-slide-overlay md2slide-slide-overlay--${position}"><span class="md2slide-slide-title">${escapeHtml(title)}</span></div>`;
}

/**
 * Parse the inner content of <!-- slide-bg: ... --> into a SlideBackground.
 * Format: key=value | key=value | ...
 */
function parseSlideBg(raw: string): SlideBackground {
  const bg: SlideBackground = {};
  const pairs = raw.split(/\s*\|\s*/);
  for (const pair of pairs) {
    const eqIdx = pair.indexOf("=");
    if (eqIdx === -1) continue;
    const key = pair.substring(0, eqIdx).trim();
    const value = pair.substring(eqIdx + 1).trim();
    if (!value) continue;
    switch (key) {
      case "color":
        bg.color = value;
        break;
      case "image":
        bg.image = value;
        break;
      case "size":
        bg.size = value;
        break;
      case "position":
        bg.position = value;
        break;
      case "repeat":
        bg.repeat = value;
        break;
      case "opacity":
        bg.opacity = parseFloat(value);
        break;
    }
  }
  return bg;
}

/**
 * Build data-background-* HTML attributes from a SlideBackground.
 */
function buildDataBgAttrs(bg: SlideBackground): string {
  let attrs = "";
  if (bg.color) {
    attrs += ` data-background-color="${escapeHtml(bg.color)}"`;
  }
  if (bg.image) {
    attrs += ` data-background-image="${escapeHtml(bg.image)}"`;
  }
  if (bg.size) {
    attrs += ` data-background-size="${escapeHtml(bg.size)}"`;
  }
  if (bg.position) {
    attrs += ` data-background-position="${escapeHtml(bg.position)}"`;
  }
  if (bg.repeat) {
    attrs += ` data-background-repeat="${escapeHtml(bg.repeat)}"`;
  }
  if (bg.opacity !== undefined && !isNaN(bg.opacity)) {
    attrs += ` data-background-opacity="${bg.opacity}"`;
  }
  return attrs;
}

/**
 * Parse markdown text into structured slide data.
 * Splits on `\n---\n`, extracts first heading as title,
 * renders HTML, and tracks starting line number.
 * Also detects per-slide <!-- slide-title: ... --> comments.
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
      currentLine += segment.split("\n").length;
      segments.push(segment);
    } else {
      // Empty segment between delimiters
      currentLine += segment.split("\n").length - 1;
    }
  }

  const slides: SlideInfo[] = [];

  for (let i = 0; i < segments.length; i++) {
    const trimmed = segments[i].trim();
    if (!trimmed) continue;

    // Detect per-slide title comment: <!-- slide-title: text | position -->
    let modifiedContent = trimmed;
    const overlayMatch = trimmed.match(SLIDE_TITLE_RE);
    let slideOverlay: SlideInfo["slideOverlay"] = undefined;

    if (overlayMatch) {
      slideOverlay = {
        title: overlayMatch[1].trim(),
        position: overlayMatch[2] as CornerPosition | undefined,
      };
      // Strip the comment so it does not appear in rendered HTML
      modifiedContent = modifiedContent.replace(SLIDE_TITLE_RE, "").trim();
    }

    // Detect per-slide background comment: <!-- slide-bg: key=value | ... -->
    const bgMatch = modifiedContent.match(SLIDE_BG_RE);
    let slideBackground: SlideBackground | undefined;

    if (bgMatch) {
      slideBackground = parseSlideBg(bgMatch[1]);
      // Strip the comment from content
      modifiedContent = modifiedContent.replace(SLIDE_BG_RE, "").trim();
    }

    // Extract first heading (# ... or ## ...) from modified content
    const titleMatch = modifiedContent.match(/^#{1,6}\s+(.+)$/m);
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
      html: `<section>${md.render(modifiedContent)}</section>`,
      slideOverlay,
      slideBackground,
    });
  }

  return slides;
}

/**
 * Compile markdown into a single HTML string of <section> elements.
 * Injects data-background-* and data-slide-title/data-slide-title-position
 * attributes on each <section> tag.
 */
export function compileMarkdown(
  text: string,
  options?: {
    globalTitle?: string;
    globalPosition?: CornerPosition;
    globalBackground?: SlideBackground;
    resolveImageUrl?: (path: string) => string | undefined;
  }
): string {
  const slides = parseSlides(text);
  const globalPos = options?.globalPosition ?? "top-right";
  const globalBg = options?.globalBackground;

  return slides
    .map((s) => {
      // --- Merge backgrounds: per-slide overrides global ---
      const effectiveBg: SlideBackground = {};
      if (globalBg?.color) effectiveBg.color = globalBg.color;
      if (globalBg?.image) effectiveBg.image = globalBg.image;
      if (globalBg?.size) effectiveBg.size = globalBg.size;
      if (globalBg?.position) effectiveBg.position = globalBg.position;
      if (globalBg?.repeat) effectiveBg.repeat = globalBg.repeat;
      if (globalBg?.opacity !== undefined) effectiveBg.opacity = globalBg.opacity;

      if (s.slideBackground) {
        if (s.slideBackground.color !== undefined) effectiveBg.color = s.slideBackground.color;
        if (s.slideBackground.image !== undefined) effectiveBg.image = s.slideBackground.image;
        if (s.slideBackground.size !== undefined) effectiveBg.size = s.slideBackground.size;
        if (s.slideBackground.position !== undefined) effectiveBg.position = s.slideBackground.position;
        if (s.slideBackground.repeat !== undefined) effectiveBg.repeat = s.slideBackground.repeat;
        if (s.slideBackground.opacity !== undefined) effectiveBg.opacity = s.slideBackground.opacity;
      }

      if (effectiveBg.image && options?.resolveImageUrl) {
        const resolved = options.resolveImageUrl(effectiveBg.image);
        if (resolved) effectiveBg.image = resolved;
      }

      // --- Build extra attributes for <section> tag ---
      let extraAttrs = buildDataBgAttrs(effectiveBg);

      const effectiveTitle = s.slideOverlay?.title ?? options?.globalTitle;
      if (effectiveTitle) {
        const position = s.slideOverlay?.position ?? globalPos;
        extraAttrs += ` data-slide-title="${escapeAttr(effectiveTitle)}"`;
        extraAttrs += ` data-slide-title-position="${position}"`;
      }

      // Inject attributes into <section> tag
      if (extraAttrs) {
        return s.html.replace(/^(<section)(>)/, `$1${extraAttrs}$2`);
      }
      return s.html;
    })
    .filter(Boolean)
    .join("\n");
}
