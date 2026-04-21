# comic-studio

Direct a whole comic with one brief. Pick a style, cast up to four characters, write the story, the agent plans every panel and renders it on `openai/gpt-image-2` through fal. Finished book opens in a flipbook (manga right-to-left, Western left-to-right, or vertical webtoon).

**Live:** ships to Vercel, bring your own fal key at [/settings](https://fal.ai/dashboard/keys). No Supabase, no account, state lives in localStorage.

## How it runs

1. **Key gate** — paste a fal API key once; it is kept in localStorage and sent only to fal endpoints from your browser.
2. **Wizard** — pick a style (eight presets), add 1–4 characters (optional photo upload becomes a stylized character sheet via `openai/gpt-image-2/edit`), write the story brief + tone + dialog language, set panel count (2–50) and format (manga, western comic, webtoon).
3. **Studio** — one LLM call writes the full storyboard (panel beats, composition, dialog, rendering prompts) through fal's OpenRouter proxy (Claude Sonnet 4.6 by default). Panels are then rendered in parallel against `openai/gpt-image-2/edit` with the style reference + every character sheet passed as `image_urls`. Rendered panels stream back onto the studio board.
4. **Reader** — the flipbook opens with the finished pages; speech bubbles are overlaid as SVG-ish strips on top of each panel so the art stays clean.

## Stack

- Next.js 15 App Router + React 19 + TypeScript
- Tailwind CSS 4
- `@fal-ai/client` for the image endpoints
- `openai` + fal's OpenRouter router (`https://fal.run/openrouter/router/openai/v1`) for the storyboard agent
- `zustand` (persisted) for the brief and project state
- `lucide-react` icons, comic-book display font (Bangers)

## Quick start

```bash
pnpm install
cp .env.example .env.local   # optional: MODEL_ID to override Claude Sonnet 4.6
pnpm dev
```

Open http://localhost:3000 and paste a fal key at `/settings`.

## Endpoints

| Surface | fal endpoint |
|---|---|
| Storyboard agent | `https://fal.run/openrouter/router/openai/v1` (Chat Completions, model via `MODEL_ID`) |
| Panel render (with refs) | `openai/gpt-image-2/edit` |
| Panel render (no refs) | `openai/gpt-image-2` |
| Photo upload | `fal.storage.upload` |

Agent prompt and tool schema live in `src/lib/agent/`.

## Roadmap

- PDF / CBZ export of finished books
- Speech-bubble layout engine (tail direction, reading order)
- Variable panel aspect per spread
- Character-sheet re-render (rebuild when style changes)
- Local fal key encryption with a passphrase

## License

MIT on the code. Prompt text CC0. Rendered images are billed to your own fal account and served from `v3b.fal.media`; re-render from your account if you want to redistribute.
