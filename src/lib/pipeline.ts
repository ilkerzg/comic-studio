"use client";

import { buildSystemPrompt } from "@/lib/agent/system-prompt";
import {
  configureFal,
  defaultModel,
  openaiViaFal,
  fal,
  uploadToFalStorage,
  type StoryboardPanel,
} from "@/lib/fal-browser";
import type { Brief } from "@/lib/types";

const falAssetCache = new Map<string, Promise<string>>();

async function resolveRefUrl(falKey: string, url: string): Promise<string> {
  if (!url) return url;
  if (/^(https?:|data:|blob:)/i.test(url)) return url;
  const cached = falAssetCache.get(url);
  if (cached) return cached;
  const p = (async () => {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Could not fetch local asset ${url} (${res.status})`);
    const blob = await res.blob();
    const name = url.split("/").pop() || "asset.png";
    const file = new File([blob], name, { type: blob.type || "image/png" });
    return await uploadToFalStorage(falKey, file);
  })();
  falAssetCache.set(url, p);
  try {
    return await p;
  } catch (e) {
    falAssetCache.delete(url);
    throw e;
  }
}

async function resolveRefUrls(falKey: string, urls: string[]): Promise<string[]> {
  return Promise.all(urls.map((u) => resolveRefUrl(falKey, u)));
}

function contentPolicyReason(err: unknown): string | null {
  const seen = new Set<unknown>();
  const walk = (node: unknown): string | null => {
    if (!node || typeof node !== "object" || seen.has(node)) return null;
    seen.add(node);
    const obj = node as Record<string, unknown>;
    if (obj.type === "content_policy_violation") {
      return typeof obj.msg === "string" ? obj.msg : "content_policy_violation";
    }
    for (const v of Object.values(obj)) {
      const hit = walk(v);
      if (hit) return hit;
    }
    return null;
  };
  const fromObj = walk(err);
  if (fromObj) return fromObj;
  const msg = (err as { message?: unknown })?.message;
  if (typeof msg === "string" && /content[\s_-]?policy/i.test(msg)) return msg;
  return null;
}

async function sanitizeFlaggedPrompt({
  falKey,
  original,
  reason,
  preserveMarkers = false,
}: {
  falKey: string;
  original: string;
  reason: string;
  preserveMarkers?: boolean;
}): Promise<string> {
  const client = openaiViaFal(falKey);
  const system = [
    "You rewrite image-generation prompts that a content safety filter has rejected.",
    "Preserve the creative intent, scene, style, characters, and composition.",
    "Remove or soften anything that could trigger filters (real people, celebrities, copyrighted characters, minors, nudity, weapons, violence, graphic content, gore, slurs).",
    "Keep it concise and concrete. Output ONLY the revised prompt — no preface, no quotes, no markdown.",
    preserveMarkers
      ? "CRITICAL: preserve every #imageN token exactly, and keep the final line `style reference: #image1` unchanged."
      : "",
  ]
    .filter(Boolean)
    .join(" ");
  const user = `Filter reason: ${reason}\n\nOriginal prompt:\n${original}\n\nReturn the rewritten prompt only.`;
  const completion = await client.chat.completions.create({
    model: defaultModel(),
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
  });
  const out = completion.choices[0]?.message?.content?.trim();
  if (!out) throw new Error("Agent did not return a revised prompt");
  return out;
}

async function runWithPolicyRetry<T>({
  falKey,
  initialPrompt,
  preserveMarkers,
  maxRetries = 2,
  attempt,
}: {
  falKey: string;
  initialPrompt: string;
  preserveMarkers?: boolean;
  maxRetries?: number;
  attempt: (prompt: string) => Promise<T>;
}): Promise<T> {
  let prompt = initialPrompt;
  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await attempt(prompt);
    } catch (err) {
      const reason = contentPolicyReason(err);
      if (!reason || i === maxRetries) throw err;
      prompt = await sanitizeFlaggedPrompt({ falKey, original: prompt, reason, preserveMarkers });
    }
  }
  throw new Error("unreachable");
}

const storyboardTools = [
  {
    type: "function" as const,
    function: {
      name: "create_storyboard",
      description: "Return the full page list. Each entry is one full comic page with multiple sub-panels.",
      parameters: {
        type: "object",
        properties: {
          pages: {
            type: "array",
            items: {
              type: "object",
              properties: {
                title: { type: "string" },
                layout: { type: "string" },
                subPanels: {
                  type: "array",
                  minItems: 3,
                  maxItems: 6,
                  items: {
                    type: "object",
                    properties: {
                      position: { type: "string" },
                      composition: { type: "string" },
                      action: { type: "string" },
                      dialog: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            speaker: { type: "string" },
                            text: { type: "string" },
                          },
                          required: ["text"],
                        },
                      },
                      sfx: { type: "string" },
                    },
                    required: ["position", "composition", "action", "dialog"],
                  },
                },
                prompt: { type: "string" },
              },
              required: ["title", "layout", "subPanels", "prompt"],
            },
          },
        },
        required: ["pages"],
      },
    },
  },
];

function sizeFor(aspect: Brief["aspect"]) {
  if (aspect === "landscape") return "landscape_16_9";
  if (aspect === "square") return "square_hd";
  return "portrait_16_9";
}

function ensureStyleMarker(rawPrompt: string): string {
  const styleLine = "style reference: #image1";
  const styleLinePattern = /^\s*style reference:\s*#image1\s*$/i;
  const prompt = (rawPrompt ?? "").trim();
  if (!prompt) return styleLine;
  const lines = prompt.split(/\r?\n/);
  const withoutStyle = lines.filter((line) => !styleLinePattern.test(line));
  return `${withoutStyle.join("\n").trimEnd()}\n\n${styleLine}`;
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
  const initialPrompt = buildPortraitPrompt({
    name,
    role,
    description,
    stylePrompt: styleStub,
    sourcePhotoUrl: photoUrl,
  });
  configureFal(falKey);
  const resolvedPhoto = photoUrl ? await resolveRefUrl(falKey, photoUrl) : null;
  const hasRef = !!resolvedPhoto;
  const endpoint = hasRef ? "openai/gpt-image-2/edit" : "openai/gpt-image-2";

  const img = await runWithPolicyRetry({
    falKey,
    initialPrompt,
    attempt: async (prompt) => {
      const input: Record<string, unknown> = {
        prompt,
        image_size: hasRef ? "auto" : "square_hd",
        quality: "low",
        num_images: 1,
        output_format: "png",
      };
      if (resolvedPhoto) input.image_urls = [resolvedPhoto];
      const result = (await fal.subscribe(endpoint, { input, logs: false })) as unknown as {
        data: { images?: { url: string; width?: number; height?: number }[] };
      };
      const image = result.data.images?.[0];
      if (!image?.url) throw new Error("No portrait returned");
      return image;
    },
  });
  return { url: img.url, width: img.width, height: img.height };
}

export async function generateStoryboard(brief: Brief, falKey: string): Promise<StoryboardPanel[]> {
  const client = openaiViaFal(falKey);
  const completion = await client.chat.completions.create({
    model: defaultModel(),
    messages: [
      { role: "system", content: buildSystemPrompt(brief) },
      { role: "user", content: `Generate the storyboard now. Page count: ${brief.panelCount}. Each page must be a full comic page with 3 to 6 sub-panels arranged in a grid.` },
    ],
    tools: storyboardTools,
    tool_choice: { type: "function", function: { name: "create_storyboard" } },
  });
  const call = completion.choices[0]?.message?.tool_calls?.[0];
  if (!call || call.type !== "function" || !call.function?.arguments) {
    throw new Error("Model did not return a storyboard");
  }
  const raw = JSON.parse(call.function.arguments) as { pages: StoryboardPanel[] | string };
  const arr: StoryboardPanel[] = Array.isArray(raw.pages)
    ? raw.pages
    : typeof raw.pages === "string"
      ? (JSON.parse(raw.pages) as StoryboardPanel[])
      : [];
  const prepared = arr.map((page) => ({
    ...page,
    prompt: ensureStyleMarker(page.prompt || ""),
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
  const resolvedUrls = await resolveRefUrls(falKey, imageUrls);
  const hasRefs = resolvedUrls.length > 0;
  const endpoint = hasRefs ? "openai/gpt-image-2/edit" : "openai/gpt-image-2";

  const img = await runWithPolicyRetry({
    falKey,
    initialPrompt: prompt,
    preserveMarkers: true,
    attempt: async (p) => {
      const input: Record<string, unknown> = {
        prompt: p,
        image_size: hasRefs ? "auto" : sizeFor(aspect),
        quality,
        num_images: 1,
        output_format: "png",
      };
      if (hasRefs) input.image_urls = resolvedUrls;
      const res = (await fal.subscribe(endpoint, { input, logs: false })) as unknown as {
        data: { images?: { url: string; width?: number; height?: number }[] };
      };
      const image = res.data.images?.[0];
      if (!image?.url) throw new Error("No image returned");
      return image;
    },
  });
  return { url: img.url, width: img.width, height: img.height };
}
