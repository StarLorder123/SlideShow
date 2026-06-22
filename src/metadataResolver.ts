import * as vscode from "vscode";
import { SlideMetadata } from "./types";

/**
 * Merge frontmatter and VS Code settings into a single SlideMetadata object.
 * Priority: frontmatter > VS Code settings.
 */
export function resolveMetadata(
  frontMatterMeta: SlideMetadata,
  config: vscode.WorkspaceConfiguration
): SlideMetadata {
  return {
    logo:
      (frontMatterMeta.logo ?? config.get<string>("logo")) || undefined,
    logoPosition:
      frontMatterMeta.logoPosition ??
      (config.get<string>("logoPosition") as SlideMetadata["logoPosition"]) ??
      undefined,
    title:
      (frontMatterMeta.title ??
        config.get<string>("presentationTitle")) ||
      undefined,
    backgroundColor:
      (frontMatterMeta.backgroundColor ??
        config.get<string>("backgroundColor")) ||
      undefined,
    backgroundImage:
      (frontMatterMeta.backgroundImage ??
        config.get<string>("backgroundImage")) ||
      undefined,
    backgroundSize:
      (frontMatterMeta.backgroundSize ??
        config.get<string>("backgroundSize")) ||
      undefined,
    backgroundPosition:
      (frontMatterMeta.backgroundPosition ??
        config.get<string>("backgroundPosition")) ||
      undefined,
    backgroundRepeat:
      (frontMatterMeta.backgroundRepeat ??
        config.get<string>("backgroundRepeat")) ||
      undefined,
    backgroundOpacity:
      (frontMatterMeta.backgroundOpacity ??
        config.get<number>("backgroundOpacity")) ||
      undefined,
  };
}
