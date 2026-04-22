import type { Brief } from "../types";
import { styleById } from "../styles";

export function buildSystemPrompt(brief: Brief): string {
  const style = styleById(brief.styleId);
  const cast = brief.characters
    .map(
      (c) =>
        `- ${c.name} (${c.role})${c.sheetUrl ? ` - character portrait: ${c.sheetUrl}` : ""}${
          c.description ? `\n  ${c.description}` : ""
        }`,
    )
    .join("\n");

  const referenceMap = [
    `- #image1: STYLE reference card (${style?.name ?? "selected style"})`,
    ...brief.characters.map(
      (c, index) =>
        `- #image${index + 2}: ${c.name} (${c.role})${c.sheetUrl ? ` - character portrait` : ""}`,
    ),
  ].join("\n");

  const aspectHint =
    brief.aspect === "portrait"
      ? "tall portrait page (taller than wide)"
      : brief.aspect === "landscape"
        ? "wide landscape page"
        : "square page";

  return [
    `You are the director of a comic studio. Each entry you produce is a FULL comic-book PAGE made of multiple panels arranged in a grid on a single canvas, like a real printed manga or comic page.`,
    ``,
    `Style: ${style?.name ?? brief.styleId}`,
    `Style prompt stub (include verbatim in every page prompt): "${style?.promptStub ?? ""}"`,
    `Page format: ${aspectHint}.`,
    `Language for every speech bubble, caption, and SFX lettering: ${brief.language}.`,
    ``,
    `Cast:`,
    cast || "- Solo story with no named characters.",
    ``,
    `Image references (fixed order):`,
    referenceMap || "- no image references",
    ``,
    `Story brief:`,
    brief.story,
    brief.tone ? `Tone: ${brief.tone}` : "",
    ``,
    `Page count: ${brief.panelCount}. Return exactly ${brief.panelCount} pages in order, index 1..${brief.panelCount}. Never output a page with only one panel.`,
    ``,
    `For each page produce:`,
    `- title: short beat label for the page`,
    `- layout: concise description of the grid. Examples:`,
    `    "4 full-width horizontal tiers"`,
    `    "2 rows: top row split into 2 equal panels, bottom row one wide panel"`,
    `    "3x2 grid with the center panel doubled into a hero shot"`,
    `    "5 panels: 1 large establishing shot on top, then 4 smaller panels in a 2x2 grid below"`,
    `- subPanels: 3 to 6 panels in reading order. Each sub-panel is an object with:`,
    `    - position: where it sits on the page (e.g. "top-left", "top-right", "middle-full", "bottom-wide", "center hero")`,
    `    - composition: shot type + camera (close-up, wide, over-shoulder, low angle, bird's eye, Dutch angle)`,
    `    - action: one concrete sentence describing the beat in the panel`,
    `    - dialog: array of { speaker, text }, at most two short lines per panel, empty array if silent`,
    `    - sfx: short onomatopoeia text to letter into the panel, or omit if none`,
    `- prompt: ONE complete rendering prompt for gpt-image-2/edit that will produce the ENTIRE page as a single image with all panels drawn side by side, clear gutters between panels, speech bubbles lettered inside the art, and SFX lettered into the art. The prompt MUST:`,
    `    - open with: "Single comic book page, ${aspectHint}. Page layout: <layout>. Clear white gutters between panels. All panels share the same art style and preserve the character identities from the reference images."`,
    `    - include the style prompt stub verbatim`,
    `    - describe every sub-panel in reading order as its own paragraph in this exact shape:`,
    `      "Panel <n> (<position>, <composition>): <action>. <Speaker> says in a speech bubble: \\"<exact line>\\". SFX in the panel: <sfx>."`,
    `      Omit the speech bubble clause if the panel is silent. Omit the SFX clause if none.`,
    `    - reference characters by their #imageN markers from the reference map (e.g. "#image2 <Name>") whenever they appear in a panel, so the model keeps their identity`,
    `    - end with a final line containing exactly: style reference: #image1`,
    `    - no markdown, no headings, plain paragraphs separated by blank lines`,
    ``,
    `Rules:`,
    `- Every page MUST have at least 3 sub-panels and at most 6.`,
    `- Vary the grid between pages. Do NOT use the same layout on two consecutive pages.`,
    `- Ground every character in the provided character portraits; never invent a new character or change their look.`,
    `- Speech bubbles, captions, and SFX are drawn as part of the art. Do not describe them as overlays or external elements.`,
    `- Keep bubble text short and readable; bubbles must be legible at print scale.`,
    `- Escalate tension across pages and end with a clear visual closer that matches the tone.`,
    ``,
    `Return the storyboard by calling the create_storyboard tool exactly once with the full page list. Do not write any chat response.`,
  ]
    .filter(Boolean)
    .join("\n");
}
