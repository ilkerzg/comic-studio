import { fal } from "@fal-ai/client";
import { createOpenAIViaFal, resolveModel } from "@/lib/agent/openai";
import { buildSystemPrompt } from "@/lib/agent/system-prompt";
import type { Brief } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 600;

type StoryboardPanel = {
  title: string;
  composition: string;
  beat: string;
  characters: string[];
  dialog: { speaker?: string; text: string }[];
  prompt: string;
};

type Body = {
  brief: Brief;
  falKey: string;
  refs: string[];
  concurrency?: number;
};

const tools = [
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

export async function POST(req: Request) {
  const { brief, falKey, refs, concurrency = 4 } = (await req.json()) as Body;
  if (!falKey) return new Response(JSON.stringify({ error: "Missing fal key" }), { status: 401 });
  if (!brief?.story?.trim()) return new Response(JSON.stringify({ error: "Missing story" }), { status: 400 });

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const emit = (event: string, data: unknown) => {
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      };

      try {
        emit("phase", { phase: "outlining" });
        const client = createOpenAIViaFal(falKey);
        const completion = await client.chat.completions.create({
          model: resolveModel(),
          messages: [
            { role: "system", content: buildSystemPrompt(brief) },
            { role: "user", content: `Generate the storyboard now. Panel count: ${brief.panelCount}.` },
          ],
          tools,
          tool_choice: { type: "function", function: { name: "create_storyboard" } },
        });

        const call = completion.choices[0]?.message.tool_calls?.[0];
        if (!call || call.type !== "function") throw new Error("Model did not return a storyboard");
        const parsed = JSON.parse(call.function.arguments) as { panels: StoryboardPanel[] };
        const panels = (parsed.panels ?? []).slice(0, brief.panelCount).map((p, i) => ({
          index: i + 1,
          title: String(p.title ?? ""),
          composition: String(p.composition ?? ""),
          beat: String(p.beat ?? ""),
          characters: Array.isArray(p.characters) ? p.characters.map(String) : [],
          dialog: Array.isArray(p.dialog) ? p.dialog : [],
          prompt: String(p.prompt ?? ""),
          imageRefs: refs,
        }));

        emit("storyboard", { panels });
        emit("phase", { phase: "rendering" });

        fal.config({ credentials: falKey });
        const hasRefs = refs.length > 0;
        const endpoint = hasRefs ? "openai/gpt-image-2/edit" : "openai/gpt-image-2";

        let cursor = 0;
        async function worker() {
          while (true) {
            const i = cursor++;
            if (i >= panels.length) return;
            const panel = panels[i];
            emit("panel_start", { index: panel.index });
            try {
              const input: Record<string, unknown> = {
                prompt: panel.prompt,
                image_size: hasRefs ? "auto" : sizeFor(brief.aspect),
                quality: "high",
                num_images: 1,
                output_format: "png",
              };
              if (hasRefs) input.image_urls = refs;
              const res = (await fal.subscribe(endpoint, { input, logs: false })) as unknown as {
                data: { images?: { url: string; width?: number; height?: number }[] };
              };
              const img = res.data.images?.[0];
              if (!img?.url) throw new Error("No image returned");
              emit("panel_done", {
                index: panel.index,
                url: img.url,
                width: img.width,
                height: img.height,
              });
            } catch (err) {
              emit("panel_failed", {
                index: panel.index,
                error: err instanceof Error ? err.message : String(err),
              });
            }
          }
        }

        await Promise.all(
          Array.from({ length: Math.min(concurrency, panels.length) }, () => worker()),
        );

        emit("phase", { phase: "done" });
        controller.close();
      } catch (err) {
        emit("error", { message: err instanceof Error ? err.message : String(err) });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
