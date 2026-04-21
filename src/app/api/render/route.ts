import { NextResponse } from "next/server";
import { fal } from "@fal-ai/client";

export const runtime = "nodejs";
export const maxDuration = 300;

type Body = {
  falKey: string;
  prompt: string;
  imageUrls?: string[];
  aspect?: "portrait" | "landscape" | "square";
  quality?: "low" | "medium" | "high";
};

function sizeFor(aspect: Body["aspect"]) {
  if (aspect === "landscape") return "landscape_16_9";
  if (aspect === "square") return "square_hd";
  return "portrait_16_9";
}

export async function POST(req: Request) {
  const body = (await req.json()) as Body;
  if (!body.falKey) return NextResponse.json({ error: "Missing fal key" }, { status: 401 });
  if (!body.prompt?.trim()) return NextResponse.json({ error: "Missing prompt" }, { status: 400 });

  fal.config({ credentials: body.falKey });

  const hasRefs = Array.isArray(body.imageUrls) && body.imageUrls.length > 0;
  const endpoint = hasRefs ? "openai/gpt-image-2/edit" : "openai/gpt-image-2";

  const input: Record<string, unknown> = {
    prompt: body.prompt,
    image_size: hasRefs ? "auto" : sizeFor(body.aspect),
    quality: body.quality ?? "high",
    num_images: 1,
    output_format: "png",
  };
  if (hasRefs) input.image_urls = body.imageUrls;

  try {
    const res = (await fal.subscribe(endpoint, { input, logs: false })) as unknown as {
      data: { images?: { url: string; width?: number; height?: number }[] };
      requestId: string;
    };
    const img = res.data.images?.[0];
    if (!img?.url) return NextResponse.json({ error: "No image returned" }, { status: 502 });
    return NextResponse.json({ url: img.url, width: img.width, height: img.height });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
