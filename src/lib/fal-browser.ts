"use client";

import { fal } from "@fal-ai/client";

export function configureFal(key: string) {
  fal.config({ credentials: key });
}

export { fal };

export function defaultModel() {
  return process.env.NEXT_PUBLIC_MODEL_ID ?? "anthropic/claude-sonnet-4-6";
}

export async function uploadToFalStorage(key: string, file: File): Promise<string> {
  configureFal(key);
  return await fal.storage.upload(file);
}

export type StoryboardPanel = {
  title: string;
  composition: string;
  beat: string;
  characters: string[];
  dialog: { speaker?: string; text: string }[];
  prompt: string;
};
