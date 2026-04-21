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
  return arr.slice(0, brief.panelCount);
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

export async function renderCharacterSheet({
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
  const prompt = [
    "Character reference sheet for a comic book production.",
    styleStub,
    `Character name: ${name}.`,
    `Role: ${role}.`,
    `Description: ${description}`,
    "Show a full-body front pose on the left third, a three-quarter pose in the middle, and a close-up head shot on the right. Plain neutral background. No text, no labels, no watermark.",
  ].join(" ");
  return renderPanel({
    falKey,
    prompt,
    imageUrls: photoUrl ? [photoUrl] : [],
    aspect: "landscape",
  });
}
