# Comic Studio

Comic Studio is a local-first Next.js app for generating short comics with fal.ai. Choose a style, define up to four characters, write a brief, and the app creates a storyboard, renders the panels, and opens the result in a reader.

## What it does

- Style presets for a consistent visual direction
- One to four characters, with optional photo-based reference sheets
- Storyboard generation through fal OpenRouter
- Panel rendering with `openai/gpt-image-2` and `openai/gpt-image-2/edit`
- Reader modes for comic, manga, and webtoon
- Project state and fal key stored in browser `localStorage`

## Run locally

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

Open `http://localhost:3000`, save your fal API key in `/settings`, and start a comic.

## Configuration

`.env.example`

```bash
MODEL_ID=anthropic/claude-sonnet-4-6
```

`MODEL_ID` is optional and only changes the storyboard model. Rendering still uses your fal API key.
