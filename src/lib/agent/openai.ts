import OpenAI from "openai";

export function createOpenAIViaFal(falKey: string) {
  return new OpenAI({
    apiKey: "noop",
    baseURL: "https://fal.run/openrouter/router/openai/v1",
    fetch: async (input, init) => {
      const headers = new Headers(init?.headers);
      headers.set("Authorization", `Key ${falKey}`);
      return fetch(input, { ...init, headers });
    },
  });
}

export function resolveModel() {
  return process.env.MODEL_ID ?? "anthropic/claude-sonnet-4-6";
}
