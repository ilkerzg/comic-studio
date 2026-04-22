import { config as dotenvConfig } from "dotenv";
dotenvConfig({ path: ".env.local" });
dotenvConfig();
import { fal } from "@fal-ai/client";
import fs from "node:fs";
import path from "node:path";
import { STYLES } from "../src/lib/styles.js";

const OUT = path.join(process.cwd(), "public", "styles");
fs.mkdirSync(OUT, { recursive: true });

const key = process.env.FAL_KEY;
if (!key) throw new Error("FAL_KEY missing");
fal.config({ credentials: key });

const FORCE = process.env.FORCE === "1";
const BASE_PATH = path.join(OUT, "_base.png");

const BASE_PROMPT = [
  "Single comic book page, tall portrait layout, printed on clean white paper.",
  "This page is a STYLE SAMPLE. It must showcase linework, paneling, color palette, and lettering — not any specific character identity.",
  "4 panels arranged in a clear grid with thin white gutters between them:",
  "Panel 1 (top, full-width wide shot): An atmospheric cityscape at dusk with dramatic clouds and glowing windows; no humans visible.",
  "Panel 2 (middle-left, medium shot): Extreme close-up of gloved hands holding an antique pocket watch, warm rim light; only the hands are visible.",
  "Panel 3 (middle-right, dynamic angle): A low-angle shot of a fluttering flag against a windswept sky, expressive motion lines.",
  "Panel 4 (bottom, full-width wide shot): A silhouetted figure walking away down a lamp-lit cobbled street, rain-slicked surfaces reflecting lights. Face is not visible. One short speech bubble reads \"Impossible...\".",
  "Balanced readable composition showing the art style clearly. No identifiable faces, no named characters, no watermark, no logo, no signature, no page number.",
].join(" ");

async function downloadTo(dest: string, url: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`download ${url} failed: ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(dest, buf);
}

async function ensureBase(): Promise<string> {
  const existing = fs.statSync(BASE_PATH, { throwIfNoEntry: false });
  if (existing && existing.size > 5000) {
    console.log(`[base] cached (${existing.size} bytes)`);
  } else {
    console.log("[base] rendering reference comic page...");
    const res = (await fal.subscribe("openai/gpt-image-2", {
      input: {
        prompt: BASE_PROMPT,
        image_size: "portrait_4_3",
        quality: "high",
        num_images: 1,
        output_format: "png",
      },
    })) as { data: { images: { url: string }[] } };
    const url = res.data.images?.[0]?.url;
    if (!url) throw new Error("no base image returned");
    await downloadTo(BASE_PATH, url);
    console.log(`[base] saved ${BASE_PATH}`);
  }
  const bytes = fs.readFileSync(BASE_PATH);
  const file = new File([new Uint8Array(bytes)], "_base.png", { type: "image/png" });
  const uploadedUrl = await fal.storage.upload(file);
  console.log(`[base] uploaded to fal storage`);
  return uploadedUrl;
}

async function renderStyle(baseUrl: string, style: (typeof STYLES)[number]) {
  const dest = path.join(OUT, `${style.id}.png`);
  if (!FORCE) {
    const existing = fs.statSync(dest, { throwIfNoEntry: false });
    if (existing && existing.size > 5000) {
      console.log(`[${style.id}] cached (${existing.size} bytes), skipping`);
      return;
    }
  }
  const prompt = [
    "Re-render this exact comic book page in the following art style, preserving the 4-panel grid, composition, poses, gutters, and speech bubble placement:",
    style.promptStub,
    "Keep the same panel layout and gutters. Maintain the readable speech bubble with the same short text. No watermark, no logo, no signature, no extra text.",
  ].join(" ");
  console.log(`[${style.id}] editing base into style...`);
  const res = (await fal.subscribe("openai/gpt-image-2/edit", {
    input: {
      prompt,
      image_urls: [baseUrl],
      image_size: "auto",
      quality: "high",
      num_images: 1,
      output_format: "png",
    },
  })) as { data: { images: { url: string }[] } };
  const url = res.data.images?.[0]?.url;
  if (!url) throw new Error(`no image for ${style.id}`);
  await downloadTo(dest, url);
  console.log(`[${style.id}] saved ${dest}`);
}

async function main() {
  const baseUrl = await ensureBase();
  const results = await Promise.allSettled(STYLES.map((s) => renderStyle(baseUrl, s)));
  const failed: string[] = [];
  results.forEach((r, i) => {
    if (r.status === "rejected") {
      failed.push(STYLES[i].id);
      const body = (r.reason as { body?: unknown })?.body;
      console.error(`[${STYLES[i].id}] FAILED:`, body ?? r.reason);
    }
  });
  if (failed.length) console.log(`\n${failed.length} failed: ${failed.join(", ")}`);
  else console.log("\nall styles rendered");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
