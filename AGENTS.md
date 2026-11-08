# Rising StarAi

Arabic-first AI hub for the Egyptian market, built with Next.js (App Router, JavaScript) and deployed on Vercel. Every push to `main` deploys to production at rising-star-ai.vercel.app.

## Stack

- Next.js 15, React 19, plain CSS modules. No TypeScript in the app.
- Server routes in `app/api/*/route.js`. Shared server code in `lib/`.
- Model calls go through `lib/groq.js` (provider chain: Gemini, Groq, DeepInfra, OpenRouter, Pollinations).
- Web search goes through `lib/websearch.js` (Serper, then Tavily, Gemini, DuckDuckGo).

## Rules

- The interface is Arabic, right-to-left, written in Egyptian Arabic. Model and company names are shown where visitors pick a model (model cards, `/models`); never show keys, provider routing or raw provider errors.
- Keys live only in Vercel environment variables. Refer to them by name (for example `SERPER_API_KEY`); never write a value into code, commits, chat or docs.
- Numbers shown to customers (prices, scores, counts) are computed in code from real data. Models explain and filter; they never invent figures, sources or links.
- Every paid call needs a per-visitor hourly limit (`rateLimiter` in `lib/groq.js`) and, where it can repeat, a cache.
- Vercel Hobby: `export const maxDuration` must be 60 or less, or the whole deploy fails.
- Use the design tokens in `app/globals.css` (`--fs-*` type scale, `--r-*` radius scale, colour variables). Do not add new hard-coded font sizes or radii.
- New pages go in `app/sitemap.js`; new seller tools also go in `components/seller/Showcase.js` and the seller `match` lists in `components/Chrome.js` and `components/BottomNav.js`.

## Checks before pushing

`npm install` may be unavailable in the agent workspace. At minimum:

1. Parse every changed file with esbuild (`--loader:.js=jsx --jsx=automatic`) and bundle-check new routes with `--tsconfig=jsconfig.json`.
2. Test new API routes with mocked `fetch` responses (success, empty, upstream error, bad input).
3. After pushing, confirm the Vercel commit status is `success`, not just that the push went through.

## Commits

- Keep each change focused; do not mix unrelated features in one commit.
- Never commit credentials, `.env` files, generated recordings, `node_modules` or machine-specific paths.

## Agent skills

Project skills live in `.claude/skills/<name>/`, each self-contained with its own references, kit and licence. They are tooling for agents and are excluded from Vercel deploys by `.vercelignore`.

- `stageshow`: faux product UI stills and animated demos (React + Vite, its own `package.json`). Use it for marketing visuals of Rising StarAi features: feature cards, hero demos, short cursor walkthroughs. Run it from its own folder (`npm install`, `npm run dev`); its kit is TypeScript and React 18, so do not import it into the Next.js app without converting it. Do not use its bundled third-party app icons or brand marks.
