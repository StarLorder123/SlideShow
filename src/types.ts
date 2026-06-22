/**
 * Shared type definitions for the MD2Slide extension.
 */

export type CornerPosition =
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right";

/** Per-slide or global background configuration. */
export interface SlideBackground {
  color?: string;
  image?: string;
  size?: string;
  position?: string;
  repeat?: string;
  opacity?: number;
}

export interface SlideInfo {
  index: number;
  title: string;
  startLine: number;
  html: string;
  /** Per-slide overlay title extracted from <!-- slide-title: ... --> comment. */
  slideOverlay?: {
    title: string;
    position?: CornerPosition;
  };
  /** Per-slide background extracted from <!-- slide-bg: ... --> comment. */
  slideBackground?: SlideBackground;
}

export interface SlideMetadata {
  logo?: string;
  logoPosition?: CornerPosition;
  title?: string;
  /** Global slide background. */
  backgroundColor?: string;
  backgroundImage?: string;
  backgroundSize?: string;
  backgroundPosition?: string;
  backgroundRepeat?: string;
  backgroundOpacity?: number;
}

export interface SlideBuildOptions {
  theme?: string;
  logoUrl?: string;
  logoPosition?: CornerPosition;
  title?: string;
}
