# Comic Studio

Comic Studio is a Next.js app for creating detailed comic books and manga with `gpt-image-2` through the fal API. Bring your own fal key, choose a style, define characters, write a story brief, and the app turns it into a multi-panel comic you can read in the browser.

## Features

- Create comics or manga from a single brief
- Use up to four characters with optional photo references
- Keep visual consistency with style presets and character sheets
- Generate storyboards through fal OpenRouter
- Render panels with `openai/gpt-image-2` and `openai/gpt-image-2/edit`
- Read the result in comic, manga, or webtoon mode
- Keep project state and fal key in browser `localStorage`

## Quick start

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

Open `http://localhost:3000`, save your fal API key in `/settings`, and start a comic.

## Optional configuration

`.env.example`

```bash
MODEL_ID=anthropic/claude-sonnet-4-6
```

`MODEL_ID` is optional and only changes the storyboard model. Rendering still uses your fal API key.
