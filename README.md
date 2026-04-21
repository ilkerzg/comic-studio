# Comic Studio

Comic Studio is a Next.js app that creates comic panels in-browser with Fal’s `openai/gpt-image-2`.

## How it works

1. Pick a style card (style only).
2. Add 1-4 characters: name, role, description.
3. Upload a reference photo (optional) and generate one portrait per character with `openai/gpt-image-2` (quality: `low`).
4. Write the story topic and choose how many outputs/panels.
5. Generate storyboard with the agent and render every panel with `openai/gpt-image-2/edit`.

## Storage & secrets

- The Fal key is never sent to a backend.
- Key + projects are saved in browser `localStorage` only.
- No server-side key handling.

## Reference markers required by the storyboard prompt

Use these in generated panel prompts:
- `#image1 ...`
- `#image2`, `#image3`, ...
- `style reference: #image1` at the end

## Run locally

```bash
pnpm install
pnpm dev
```

Open:

- `/` for creation
- `/history` to see local projects
- `/library` for built-in references
- `/settings` to update the key

## Optional

- `NEXT_PUBLIC_MODEL_ID` can override the storyboard LLM, default is `anthropic/claude-opus-4.6`.
