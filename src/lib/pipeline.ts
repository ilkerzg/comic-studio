"use client";

import { buildSystemPrompt } from "@/lib/agent/system-prompt";
import { configureFal, defaultModel, openaiViaFal, fal, type StoryboardPanel } from "@/lib/fal-browser";
import { isSecureHttpUrl } from "@/lib/utils";
import type { Brief } from "@/lib/types";

type FalErrorKind = "content_policy_violation" | "file_download_error";
type FalDetail = {
  msg?: string;
  type?: string;
  input?: unknown;
};


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

function normalizeText(input: string, maxLength = 1400): string {
  return input
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\r?\n/g, " ")
    .trim()
    .slice(0, maxLength);
}

function stripUnsafePhrases(input: string): string {
  return input
    .replace(/\b(sexual|explicit|violence|violent|gore|nude|naked|porn|blood)\b/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function safePortraitPromptText(input: string): string {
  const base = normalizeText(stripUnsafePhrases(input), 1500);
  if (/family[- ]friendly|non[- ]violent|no gore|no nudity/i.test(base)) return base;
  return `${base} Family-friendly, non-violent, non-sexual, non-graphic, no gore, no nudity, no hateful, safe comic-book style image.`;
}

function normalizeImageRefs(urls: string[]) {
  const cleaned = urls
    .map((value) => value?.trim())
    .filter((value): value is string => !!value)
    .filter(isSecureHttpUrl);
  return [...new Set(cleaned)];
}

function detectFalErrorKind(error: unknown, depth = 0): FalErrorKind | undefined {
  if (!error || depth > 3) return undefined;
  if (typeof error === "string") {
    try {
      const parsed = JSON.parse(error) as unknown;
      return detectFalErrorKind(parsed, depth + 1);
    } catch {
      if (error.includes("content_policy_violation")) return "content_policy_violation";
      if (error.includes("file_download_error")) return "file_download_error";
      return undefined;
    }
  }

  if (error instanceof Error) {
    const message = error.message;
    if (message.includes("content_policy_violation")) return "content_policy_violation";
    if (message.includes("file_download_error")) return "file_download_error";
    return detectFalErrorKind((error as { cause?: unknown }).cause, depth + 1);
  }

  if (typeof error !== "object") return undefined;

  const payload = error as Record<string, unknown>;
  const detail = payload.detail;
  if (Array.isArray(detail)) {
    for (const d of detail) {
      const entry = d as FalDetail;
      if (entry?.type === "content_policy_violation") return "content_policy_violation";
      if (entry?.type === "file_download_error") return "file_download_error";
    }
  }

  const nested = [payload.response, payload.data, payload.error, payload.cause];
  for (const item of nested) {
    const kind = detectFalErrorKind(item, depth + 1);
    if (kind) return kind;
  }

  return undefined;
}

function falErrorMessage(error: unknown): string {
  if (typeof error === "string") return error;
  if (error instanceof Error) return error.message || "Fal request failed";
  try {
    return JSON.stringify(error);
  } catch {
    return "Fal request failed";
  }
}

function sizeFor(aspect: Brief["aspect"]) {
  if (aspect === "landscape") return "landscape_16_9";
  if (aspect === "square") return "square_hd";
  return "portrait_16_9";
}

function normalizeCharacterPromptLines(name: string) {
  return normalizeText(name, 70) || "Character";
}

function normalizePanelPrompt(input: string, maxLength = 2400): string {
  return input
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, " ")
    .split(/\r?\n/)
    .map((line) => line.trim().replace(/\s+/g, " "))
    .filter(Boolean)
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, maxLength);
}

function ensureLineEndings(input: string) {
  return input
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .join("\n");
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
      const safeName = normalizeCharacterPromptLines(charName);
      const safeCue = normalizeText(cue, 120);
      fallbackLines.push(`#image${idx} ${safeName} is saying ${safeCue ? `"${safeCue}"` : "and acting"}.`);
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
      const safeName = normalizeCharacterPromptLines(charName);
      const safeCue = normalizeText(cue, 120);
      fallbackLines.push(`#image${idx} ${safeName} is saying ${safeCue ? `"${safeCue}"` : "and acting"}.`);
    }
  }

  const styleLineExists = lines.some((line) => styleLinePattern.test(line));
  if (!styleLineExists) {
    fallbackLines.push("style reference: #image1");
  }

  if (fallbackLines.length === 0) {
    const withoutExistingStyleLine = lines.filter((line) => !styleLinePattern.test(line));
    const trimmedLines = withoutExistingStyleLine.map((line) => line.trim());
    const styleLineIsLast = trimmedLines.length > 0 && styleLinePattern.test(trimmedLines[trimmedLines.length - 1]);
    if (styleLineIsLast) return base;
    return `${ensureLineEndings(withoutExistingStyleLine.join("\n"))}\nstyle reference: #image1`;
  }

  const out = [...lines, ...fallbackLines].filter((line) => line.trim().length > 0);
  const withoutExistingStyleLine = out.filter((line) => !styleLinePattern.test(line));
  return `${ensureLineEndings(withoutExistingStyleLine.join("\n"))}\nstyle reference: #image1`;
}

function buildSafePolicyPrompt(prompt: string) {
  const base = normalizeText(prompt, 1800);
  if (!base) return base;
  if (/safe|family|non[- ]violent|no gore|no sexual/i.test(base)) return base;
  return `${base} This is a safe, non-offensive, family-friendly comic illustration request.`;
}

function enforcePanelPromptSafety(input: string): string {
  const base = normalizePanelPrompt(input, 2400);
  if (!base) return base;
  if (/safe|family|non[- ]violent|no gore|no sexual/i.test(base)) return base;
  return `${base}\nSafety note: family-friendly, non-violent, no sexual content, no gore, no explicit content.`;
}

async function runImageJob({
  falKey,
  prompt,
  imageUrls,
  imageSize,
  quality = "low",
  numImages = 1,
}: {
  falKey: string;
  prompt: string;
  imageUrls: string[];
  imageSize: ReturnType<typeof sizeFor>;
  quality?: "low" | "medium" | "high";
  numImages?: number;
}) {
  configureFal(falKey);
  const refs = normalizeImageRefs(imageUrls);
  const safePrompt = normalizeText(prompt, 2200);
  let requestPrompt = safePrompt;
  let appliedPolicyFix = false;
  let fileErrorStep = 0;

  while (true) {
    const requestRefs = fileErrorStep === 0 ? refs : fileErrorStep === 1 ? refs.slice(1) : [];
    const hasRefs = requestRefs.length > 0;
    const endpoint = hasRefs ? "openai/gpt-image-2/edit" : "openai/gpt-image-2";
    const input: Record<string, unknown> = {
      prompt: requestPrompt,
      image_size: hasRefs ? "auto" : imageSize,
      quality,
      num_images: numImages,
      output_format: "png",
    };
    if (hasRefs) input.image_urls = requestRefs;

    try {
      const result = (await fal.subscribe(endpoint, { input, logs: false })) as unknown as {
        data: { images?: { url: string; width?: number; height?: number }[] };
      };
      const image = result.data.images?.[0];
      if (!image?.url) throw new Error("No image returned");
      return { url: image.url, width: image.width, height: image.height };
    } catch (error) {
      const kind = detectFalErrorKind(error);
      if (kind === "content_policy_violation" && !appliedPolicyFix) {
        requestPrompt = buildSafePolicyPrompt(safePrompt);
        appliedPolicyFix = true;
        continue;
      }

      if (kind === "file_download_error") {
        if (fileErrorStep < 2) {
          fileErrorStep += 1;
          continue;
        }
        if (refs.length === 0) throw new Error(falErrorMessage(error));
        throw new Error(`file_download_error: ${falErrorMessage(error)}`);
      }

      throw new Error(falErrorMessage(error));
    }
  }
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
  const safeName = normalizeCharacterPromptLines(name);
  const safeRole = normalizeText(role, 30) || "character";
  const safeDescription = normalizeText(description, 300);
  const baseStyle = stylePrompt ? `${normalizeText(stylePrompt, 320)}. ` : "";
  const sourceClause = sourcePhotoUrl
    ? "Match the uploaded reference photo and preserve the character identity."
    : "Create this character from text only, no source photo.";
  return normalizeText(
    [
      `Comic book character portrait of ${safeName}, role ${safeRole}.`,
      baseStyle + sourceClause,
      `Description: ${safeDescription || "clean contemporary character design."}`,
      "Style: comic book production, consistent silhouette and facial structure, clean readable outlines, no watermark, no logo, no text.",
      "Single character full-body portrait, plain neutral studio background.",
    ].join(" "),
    1900,
  );
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
  const imageUrls = photoUrl ? normalizeImageRefs([photoUrl]) : [];
  const out = await runImageJob({
    falKey,
    prompt: safePortraitPromptText(prompt),
    imageUrls,
    imageSize: "square_hd",
    quality: "low",
    numImages: 1,
  });
  return { url: out.url, width: out.width, height: out.height };
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
}) {
  const normalizedPrompt = normalizePanelPrompt(prompt, 2400);
  const out = await runImageJob({
    falKey,
    prompt: enforcePanelPromptSafety(buildSafePolicyPrompt(normalizedPrompt)),
    imageUrls,
    imageSize: sizeFor(aspect),
    quality,
    numImages: 1,
  });
  return { url: out.url, width: out.width, height: out.height };
}
