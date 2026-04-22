"use client";

import type { AspectChoice } from "@/lib/types";

const FAL_PREFIXES = [
  "https://v3.fal.media/files/",
  "https://v2.fal.media/files/",
  "https://fal.media/files/",
];

type SharePayload = {
  v: 1;
  t?: string; // title
  a: "p" | "l" | "s"; // aspect
  u: string[]; // panel image URLs (optionally shortened)
};

export type DecodedShare = {
  title?: string;
  aspect: AspectChoice;
  panelUrls: string[];
};

function base64urlEncode(bytes: Uint8Array): string {
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
}

function base64urlDecode(str: string): Uint8Array {
  const s = str.replaceAll("-", "+").replaceAll("_", "/");
  const pad = s.length % 4 === 0 ? "" : "=".repeat(4 - (s.length % 4));
  const bin = atob(s + pad);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

function shortenUrl(url: string): string {
  for (let i = 0; i < FAL_PREFIXES.length; i++) {
    if (url.startsWith(FAL_PREFIXES[i])) {
      // `~0foo` → FAL_PREFIXES[0] + "foo"
      return `~${i}${url.slice(FAL_PREFIXES[i].length)}`;
    }
  }
  return url;
}

function expandUrl(token: string): string {
  const m = /^~(\d)(.*)$/.exec(token);
  if (m) {
    const idx = Number(m[1]);
    if (FAL_PREFIXES[idx]) return FAL_PREFIXES[idx] + m[2];
  }
  return token;
}

function aspectToCode(a: AspectChoice): "p" | "l" | "s" {
  return a === "landscape" ? "l" : a === "square" ? "s" : "p";
}

function aspectFromCode(a: "p" | "l" | "s"): AspectChoice {
  return a === "l" ? "landscape" : a === "s" ? "square" : "portrait";
}

async function gzip(str: string): Promise<Uint8Array> {
  const stream = new Blob([str]).stream().pipeThrough(new CompressionStream("gzip"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

async function gunzip(bytes: Uint8Array): Promise<string> {
  const buf = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(buf).set(bytes);
  const stream = new Blob([buf]).stream().pipeThrough(new DecompressionStream("gzip"));
  return await new Response(stream).text();
}

export async function encodeShare({
  title,
  aspect,
  panelUrls,
}: {
  title?: string;
  aspect: AspectChoice;
  panelUrls: string[];
}): Promise<string> {
  const payload: SharePayload = {
    v: 1,
    t: title,
    a: aspectToCode(aspect),
    u: panelUrls.map(shortenUrl),
  };
  const json = JSON.stringify(payload);
  const compressed = await gzip(json);
  return base64urlEncode(compressed);
}

export async function decodeShare(token: string): Promise<DecodedShare> {
  const bytes = base64urlDecode(token);
  const json = await gunzip(bytes);
  const payload = JSON.parse(json) as SharePayload;
  if (payload.v !== 1) throw new Error("Unsupported share version");
  return {
    title: payload.t,
    aspect: aspectFromCode(payload.a),
    panelUrls: (payload.u ?? []).map(expandUrl),
  };
}
