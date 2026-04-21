import "dotenv/config";
import { fal } from "@fal-ai/client";
import fs from "node:fs";
import path from "node:path";
import { STYLES } from "../src/lib/styles.js";

const OUT = path.join(process.cwd(), "public", "styles");
fs.mkdirSync(OUT, { recursive: true });

const key = process.env.FAL_KEY;
if (!key) throw new Error("FAL_KEY missing");
fal.config({ credentials: key });

async function downloadTo(path: string, url: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`download ${url} failed: ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(path, buf);
}

async function main() {
  await Promise.all(
    STYLES.map(async (style) => {
      const prompt = [
        style.promptStub,
        "A vertical poster-style reference image of a single character from the chest up, embodying the style, neutral background, no text, no watermark, no logos.",
      ].join(" ");
      console.log(`[${style.id}] submitting...`);
      const res = (await fal.subscribe("openai/gpt-image-2", {
        input: {
          prompt,
          image_size: "portrait_4_3",
          quality: "high",
          num_images: 1,
          output_format: "png",
        },
      })) as { data: { images: { url: string }[] } };
      const url = res.data.images?.[0]?.url;
      if (!url) throw new Error(`no image for ${style.id}`);
      const dest = path.join(OUT, `${style.id}.png`);
      await downloadTo(dest, url);
      console.log(`[${style.id}] saved ${dest}`);
    }),
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
