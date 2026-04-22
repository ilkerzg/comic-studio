"use client";

import { fal } from "@fal-ai/client";
import OpenAI from "openai";

export function configureFal(key: string) {
  fal.config({ credentials: key });
}

export { fal };

export function openaiViaFal(key: string) {
  return new OpenAI({
    apiKey: "noop",
    baseURL: "https://fal.run/openrouter/router/openai/v1",
    dangerouslyAllowBrowser: true,
    fetch: async (input, init) => {
      const headers = new Headers(init?.headers);
      headers.set("Authorization", `Key ${key}`);
      return fetch(input, { ...init, headers });
    },
  });
}

export function defaultModel() {
  return process.env.NEXT_PUBLIC_MODEL_ID ?? process.env.MODEL_ID ?? "anthropic/claude-opus-4.6";
}

export async function uploadToFalStorage(key: string, file: File): Promise<string> {
  configureFal(key);
  return await fal.storage.upload(file);
}

export type StoryboardSubPanel = {
  position: string;
  composition: string;
  action: string;
  dialog: { speaker?: string; text: string }[];
  sfx?: string;
};

export type StoryboardPanel = {
  title: string;
  layout: string;
  subPanels: StoryboardSubPanel[];
  prompt: string;
};
