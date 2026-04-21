import type { Brief } from "../types";
import { styleById } from "../styles";

export function buildSystemPrompt(brief: Brief): string {
  const style = styleById(brief.styleId);
  const cast = brief.characters
    .map(
      (c) =>
        `- ${c.name} (${c.role})${c.sheetUrl ? ` - character sheet: ${c.sheetUrl}` : ""}${
          c.description ? `\n  ${c.description}` : ""
        }`,
    )
    .join("\n");

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
    `Format: ${brief.format} (${aspectHint}).`,
    `Language for all in-panel text and dialog: ${brief.language}.`,
    ``,
    `Cast:`,
    cast || "- Solo story with no named characters.",
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
    `- characters: the ids of cast members present in this panel (use their provided ids)`,
    `- prompt: the full rendering prompt. Start with the style prompt stub, then describe the scene with concrete visual detail, explicit character actions, and explicit any in-panel typography (signs, banners, lettering) spelled verbatim in quotes. Do not include speech bubbles inside the prompt text; bubbles are overlaid later. End with constraints: "No watermark. No page numbers. No border."`,
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
