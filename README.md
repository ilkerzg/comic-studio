# Comic Studio

Comic Studio is a local-browser workflow for producing comic book and manga-style pages with Fal + `openai/gpt-image-2`.

## What it does

1. Pick a **style card**.
2. Add your characters (name, role, description, optional reference photo).
3. Generate one portrait for each character with `openai/gpt-image-2` (low quality) and use those as references.
4. Write the topic and choose how many panels to generate.
5. The agent writes the storyboard, then generates each panel with `openai/gpt-image-2/edit`.

No server-side Fal key is used. Your Fal key is stored only in browser `localStorage`.

## Core flow

- Style cards are the only visual style selector.
- There is no separate comic type selector in the flow.
- Character references are reused across all panels.
- Generated projects and history stay in local storage.
- The prompt for each panel must include fixed markers:
  - `#image1 ...` for style reference
  - `#image2`, `#image3`, ... for character portraits
  - `style reference: #image1` as the closing line

## Run

```bash
pnpm install
pnpm dev
```

Open:
- `http://localhost:3000` for a new project
- `/settings` to save / replace your key
- `/history` to view local projects

## Env

Create `.env.local` if needed:

```bash
NEXT_PUBLIC_MODEL_ID=anthropic/claude-3.5-sonnet
```

`NEXT_PUBLIC_MODEL_ID` is optional. It only changes the storyboard LLM model.
