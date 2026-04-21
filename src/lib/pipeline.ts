"use client";

import { buildSystemPrompt } from "@/lib/agent/system-prompt";
import {
  configureFal,
  defaultModel,
  openaiViaFal,
  fal,
  type StoryboardPanel,
} from "@/lib/fal-browser";
import type { Brief } from "@/lib/types";

const storyboardTools = [
  {
    type: "function" as const,
    function: {
      name: "create_storyboard",
      description: "Return the full panel list.",
      parameters: {
        type: "object",
        properties: {
          panels: {
            type: "array",
            items: {
              type: "object",
              properties: {
                title: { type: "string" },
                composition: { type: "string" },
                beat: { type: "string" },
                characters: { type: "array", items: { type: "string" } },
                dialog: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: { speaker: { type: "string" }, text: { type: "string" } },
                    required: ["text"],
                  },
                },
                prompt: { type: "string" },
              },
              required: ["title", "composition", "beat", "characters", "dialog", "prompt"],
            },
          },
        },
        required: ["panels"],
      },
    },
  },
];

function sizeFor(aspect: Brief["aspect"]) {
  if (aspect === "landscape") return "landscape_16_9";
  if (aspect === "square") return "square_hd";
  return "portrait_16_9";
}

function ensureImageMarkers(panel: StoryboardPanel, brief: Brief) {
  const markerPattern = /#image\d+/i;
  const styleLinePattern = /^\s*style reference:\s*#image1\s*$/i;
  const base = panel.prompt?.trim() ?? "";
  const fallbackLines: string[] = [];
  const lines = panel.prompt?.split(/\r?\n/) ?? [];

  const characterIndexByName = new Map(
    brief.characters
      .map((c, i) => [c.name.toLowerCase(), i + 2] as const)
      .filter(([name]) => name.length > 0),
  );

  if (!markerPattern.test(base)) {
    for (const charName of panel.characters) {
      const idx = characterIndexByName.get(charName.toLowerCase()) ?? (2 + fallbackLines.length);
      const cue =
        panel.dialog?.find((d) => (d.speaker ?? "").toLowerCase().trim() === charName.toLowerCase())?.text ??
        "is in this scene";
      fallbackLines.push(`#image${idx} ${charName} is saying ${cue ? `"${cue}"` : "and acting"}.`);
    }
  } else {
    const missingCharacters = panel.characters.filter((name) => {
      const safe = name.trim().toLowerCase();
      if (!safe) return false;
      return !lines.some((line) =>
        new RegExp(`^\\s*#image\\d+\\s+${safe.replace(/[.*+?^${}()|[\]\\]/g, "\\\\$&")}\\b`, "i").test(
          line.trim(),
        ),
      );
    });
    for (const charName of missingCharacters) {
      const idx = characterIndexByName.get(charName.toLowerCase()) ?? (2 + fallbackLines.length);
      const cue =
        panel.dialog?.find((d) => (d.speaker ?? "").toLowerCase().trim() === charName.toLowerCase())?.text ??
        "is in this scene";
      fallbackLines.push(`#image${idx} ${charName} is saying ${cue ? `"${cue}"` : "and acting"}.`);
    }
  }

  const styleLineExists = lines.some((line) => styleLinePattern.test(line));
  if (!styleLineExists) {
    fallbackLines.push("style reference: #image1");
  }

  if (fallbackLines.length === 0) {
    const trimmedLines = lines.map((line) => line.trim());
    const withoutExistingStyleLine = lines.filter((line) => !styleLinePattern.test(line));
    const styleLineIsLast =
      trimmedLines.length > 0 && styleLinePattern.test(trimmedLines[trimmedLines.length - 1]);
    if (styleLineIsLast) return base;
    return `${withoutExistingStyleLine.join("\n")}\nstyle reference: #image1`;
  }
  const out = [...lines, ...fallbackLines].filter((line) => line.trim().length > 0);
  const withoutExistingStyleLine = out.filter((line) => !styleLinePattern.test(line));
  return `${withoutExistingStyleLine.join("\n")}\nstyle reference: #image1`;
}

export function buildPortraitPrompt({
  name,
  role,
  description,
  stylePrompt,
  sourcePhotoUrl,
}: {
  name: string;
  role: string;
  description: string;
  stylePrompt: string;
  sourcePhotoUrl?: string | null;
}) {
  const baseStyle = stylePrompt ? `${stylePrompt}. ` : "";
  const sourceClause = sourcePhotoUrl
    ? "Match the uploaded visual direction and preserve identity."
    : "Create this character from text only, no source photo.";
  return [
    `Comic book character portrait of ${name}, role ${role}.`,
    baseStyle + sourceClause,
    `Description: ${description}`,
    "Style: comic book production, consistent silhouette and facial structure, clean readable outlines, no watermark, no logo, no text.",
    "Single character full-body portrait, plain neutral studio background.",
  ].join(" ");
}

export async function generateCharacterPortrait({
  falKey,
  name,
  description,
  role,
  styleStub,
  photoUrl,
}: {
  falKey: string;
  name: string;
  description: string;
  role: string;
  styleStub: string;
  photoUrl?: string | null;
}) {
  const prompt = buildPortraitPrompt({
    name,
    role,
    description,
    stylePrompt: styleStub,
    sourcePhotoUrl: photoUrl,
  });
  configureFal(falKey);
  const hasRef = !!photoUrl;
  const endpoint = hasRef ? "openai/gpt-image-2/edit" : "openai/gpt-image-2";
  const input: Record<string, unknown> = {
    prompt,
    image_size: hasRef ? "auto" : "square_hd",
    quality: "low",
    num_images: 1,
    output_format: "png",
  };
  if (hasRef) input.image_urls = [photoUrl];
  const result = (await fal.subscribe(endpoint, { input, logs: false })) as unknown as {
    data: { images?: { url: string; width?: number; height?: number }[] };
  };
  const img = result.data.images?.[0];
  if (!img?.url) throw new Error("No portrait returned");
  return { url: img.url, width: img.width, height: img.height };
}

export async function generateStoryboard(brief: Brief, falKey: string): Promise<StoryboardPanel[]> {
  const client = openaiViaFal(falKey);
  const completion = await client.chat.completions.create({
    model: defaultModel(),
    messages: [
      { role: "system", content: buildSystemPrompt(brief) },
      { role: "user", content: `Generate the storyboard now. Panel count: ${brief.panelCount}.` },
    ],
    tools: storyboardTools,
    tool_choice: { type: "function", function: { name: "create_storyboard" } },
  });
  const call = completion.choices[0]?.message?.tool_calls?.[0];
  if (!call || call.type !== "function" || !call.function?.arguments) {
    throw new Error("Model did not return a storyboard");
  }
  const raw = JSON.parse(call.function.arguments) as { panels: StoryboardPanel[] | string };
  const arr: StoryboardPanel[] = Array.isArray(raw.panels)
    ? raw.panels
    : typeof raw.panels === "string"
      ? (JSON.parse(raw.panels) as StoryboardPanel[])
      : [];
  const prepared = arr.map((panel) => ({
    ...panel,
    prompt: ensureImageMarkers(panel, brief),
  }));
  return prepared.slice(0, brief.panelCount);
}

export async function renderPanel({
  falKey,
  prompt,
  imageUrls,
  aspect,
  quality = "high",
}: {
  falKey: string;
  prompt: string;
  imageUrls: string[];
  aspect: Brief["aspect"];
  quality?: "low" | "medium" | "high";
}): Promise<{ url: string; width?: number; height?: number }> {
  configureFal(falKey);
  const hasRefs = imageUrls.length > 0;
  const endpoint = hasRefs ? "openai/gpt-image-2/edit" : "openai/gpt-image-2";
  const input: Record<string, unknown> = {
    prompt,
    image_size: hasRefs ? "auto" : sizeFor(aspect),
    quality,
    num_images: 1,
    output_format: "png",
  };
  if (hasRefs) input.image_urls = imageUrls;
  const res = (await fal.subscribe(endpoint, { input, logs: false })) as unknown as {
    data: { images?: { url: string; width?: number; height?: number }[] };
  };
  const img = res.data.images?.[0];
  if (!img?.url) throw new Error("No image returned");
  return { url: img.url, width: img.width, height: img.height };
}
