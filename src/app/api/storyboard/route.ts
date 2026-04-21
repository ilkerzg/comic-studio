import { NextResponse } from "next/server";
import { createOpenAIViaFal, resolveModel } from "@/lib/agent/openai";
import { buildSystemPrompt } from "@/lib/agent/system-prompt";
import type { Brief } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 120;

type StoryboardPanel = {
  title: string;
  composition: string;
  beat: string;
  characters: string[];
  dialog: { speaker?: string; text: string }[];
  prompt: string;
};

const tools = [
  {
    type: "function" as const,
    function: {
      name: "create_storyboard",
      description: "Return the full list of panels for the comic in order.",
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
                    properties: {
                      speaker: { type: "string" },
                      text: { type: "string" },
                    },
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

export async function POST(req: Request) {
  const { brief, falKey } = (await req.json()) as { brief: Brief; falKey: string };
  if (!falKey) return NextResponse.json({ error: "Missing fal key" }, { status: 401 });
  if (!brief?.story?.trim()) return NextResponse.json({ error: "Missing story" }, { status: 400 });

  const client = createOpenAIViaFal(falKey);
  const system = buildSystemPrompt(brief);

  const completion = await client.chat.completions.create({
    model: resolveModel(),
    messages: [
      { role: "system", content: system },
      {
        role: "user",
        content: `Generate the storyboard now. Panel count: ${brief.panelCount}.`,
      },
    ],
    tools,
    tool_choice: { type: "function", function: { name: "create_storyboard" } },
  });

  const call = completion.choices[0]?.message.tool_calls?.[0];
  if (!call || call.type !== "function") {
    return NextResponse.json({ error: "Model did not return a storyboard" }, { status: 502 });
  }

  let parsed: { panels: StoryboardPanel[] };
  try {
    parsed = JSON.parse(call.function.arguments);
  } catch {
    return NextResponse.json({ error: "Invalid storyboard JSON" }, { status: 502 });
  }

  const panels = (parsed.panels ?? []).slice(0, brief.panelCount).map((p, i) => ({
    index: i + 1,
    title: String(p.title ?? ""),
    composition: String(p.composition ?? ""),
    beat: String(p.beat ?? ""),
    characters: Array.isArray(p.characters) ? p.characters.map(String) : [],
    dialog: Array.isArray(p.dialog) ? p.dialog : [],
    prompt: String(p.prompt ?? ""),
  }));

  return NextResponse.json({ panels });
}
