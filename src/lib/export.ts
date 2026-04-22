"use client";

import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import type { ComicProject, PanelState } from "./types";

async function fetchImage(url: string): Promise<{ bytes: Uint8Array; type: "png" | "jpg" }> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`fetch ${url} failed`);
  const buf = new Uint8Array(await res.arrayBuffer());
  const ct = res.headers.get("content-type") || "";
  const type = ct.includes("jpeg") || ct.includes("jpg") ? "jpg" : "png";
  return { bytes: buf, type };
}

function safeName(s: string, fallback: string) {
  const cleaned = s.replace(/[^a-z0-9-_]+/gi, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
  return cleaned || fallback;
}

export async function exportPdf(project: ComicProject) {
  const panels = project.panels.filter((p) => p.imageUrl) as (PanelState & { imageUrl: string })[];
  if (panels.length === 0) throw new Error("No rendered pages to export");

  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.HelveticaBold);
  const monoFont = await doc.embedFont(StandardFonts.Courier);

  const cover = doc.addPage([1200, 1600]);
  cover.drawRectangle({ x: 0, y: 0, width: 1200, height: 1600, color: rgb(0.05, 0.05, 0.06) });
  const title = "Comic Studio";
  cover.drawText(title, { x: 80, y: 1400, size: 72, font, color: rgb(1, 1, 1) });
  cover.drawText(`${panels.length} pages`, {
    x: 80,
    y: 1340,
    size: 24,
    font: monoFont,
    color: rgb(0.78, 0.78, 0.78),
  });
  const brief = project.brief.story.slice(0, 480);
  cover.drawText(brief, { x: 80, y: 1260, size: 18, font: monoFont, color: rgb(0.75, 0.75, 0.75), maxWidth: 1040, lineHeight: 26 });

  for (const p of panels) {
    const { bytes, type } = await fetchImage(p.imageUrl);
    const img = type === "jpg" ? await doc.embedJpg(bytes) : await doc.embedPng(bytes);
    const { width: iw, height: ih } = img;
    const page = doc.addPage([iw, ih + 80]);
    page.drawRectangle({ x: 0, y: 0, width: iw, height: ih + 80, color: rgb(0.04, 0.04, 0.05) });
    page.drawImage(img, { x: 0, y: 80, width: iw, height: ih });
    page.drawText(`#${String(p.index).padStart(2, "0")}`, {
      x: 24,
      y: 32,
      size: 20,
      font: monoFont,
      color: rgb(0.72, 0.72, 0.74),
    });
    if (p.beat?.title) {
      page.drawText(p.beat.title.slice(0, 80), {
        x: 100,
        y: 32,
        size: 18,
        font,
        color: rgb(0.92, 0.92, 0.94),
      });
    }
  }

  const pdf = await doc.save();
  const name = safeName(project.brief.story.slice(0, 40), `comic-${project.id.slice(-6)}`);
  saveAs(new Blob([new Uint8Array(pdf)], { type: "application/pdf" }), `${name}.pdf`);
}

export async function exportCbz(project: ComicProject) {
  const panels = project.panels.filter((p) => p.imageUrl) as (PanelState & { imageUrl: string })[];
  if (panels.length === 0) throw new Error("No rendered pages to export");
  const zip = new JSZip();
  const folderName = safeName(project.brief.story.slice(0, 40), `comic-${project.id.slice(-6)}`);
  const folder = zip.folder(folderName)!;
  for (const p of panels) {
    const { bytes, type } = await fetchImage(p.imageUrl);
    folder.file(`${String(p.index).padStart(3, "0")}.${type === "jpg" ? "jpg" : "png"}`, bytes);
  }
  const meta = [
    `Comic Studio export`,
    `Pages: ${panels.length}`,
    `Style: ${project.brief.styleId}`,
    `Format: ${project.brief.format}`,
    `Generated: ${new Date(project.createdAt).toISOString()}`,
    ``,
    `Story:`,
    project.brief.story,
  ].join("\n");
  folder.file("README.txt", meta);
  const blob = await zip.generateAsync({ type: "blob", mimeType: "application/vnd.comicbook+zip" });
  saveAs(blob, `${folderName}.cbz`);
}
