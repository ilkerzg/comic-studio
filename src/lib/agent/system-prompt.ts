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
      ? "portrait panels, taller than wide"
      : brief.aspect === "landscape"
        ? "landscape panels, wider than tall"
        : "square panels";

  return [
    `You are the director of a comic studio. You receive a brief and must return a complete storyboard with one entry per panel.`,
    ``,
    `Style: ${style?.name ?? brief.styleId}`,
    `Style prompt stub (include verbatim in every panel prompt): "${style?.promptStub ?? ""}"`,
    `Panel format baseline: ${aspectHint}.`,
    `Language for all in-panel text and dialog: ${brief.language}.`,
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
    `Panel count: ${brief.panelCount}. Return exactly this many panels in order, index 1..${brief.panelCount}.`,
    ``,
    `For each panel produce:`,
    `- title: short label for the beat`,
    `- composition: shot type and camera (close-up, wide, over-shoulder, low angle, bird's eye, Dutch angle)`,
    `- beat: one sentence describing the action or emotion`,
    `- dialog: array of { speaker, text }, at most two lines per panel; empty array if silent`,
    `- characters: the names of cast members present in this panel (match names exactly as written above)`,
    `- prompt: a rich full rendering prompt for gpt-image-2/edit in the format below. It must use the fixed marker map above for every referenced visual entity.`,
    `  Use lines like these exactly in every panel:`,
    `  #image1 style reference: <one sentence about the selected style and what it enforces>`,
    `  #image2 <Character Name>: <what they are doing + exact dialogue line if they speak>`,
    `  #image3 <Character Name>: <their action or dialogue>`,
    `  ...`,
    `  style reference: #image1`,
    `  Rules for this prompt block:`,
    `  - Keep #image markers and marker indices aligned with the reference map.`,
    `  - #image1 is always the style reference image and must appear as the very last line.`,
    `  - Character lines should mention action and dialogue naturally (if a character speaks, include the exact line).`,
    `  - The panel prompt is plain text only. No markdown.`,
    ``,
    `Rules:`,
    `- Ground every character depiction in the provided character sheets; never invent a new character.`,
    `- Keep art style consistent by reusing the style stub.`,
    `- Avoid repeating the same composition two panels in a row.`,
    `- Escalate tension across the arc, end with a visual closer that matches the tone.`,
    ``,
    `Return the storyboard by calling the create_storyboard tool exactly once with the full panel list. Do not write any chat response.`,
  ]
    .filter(Boolean)
    .join("\n");
}
