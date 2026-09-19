<div align="center">

# 🎬 Reel Radar

**Search any film. See exactly where it's streaming where you are.**

Subscription, free, rent or buy — across every major service, in 27 countries.

</div>

---

## What it does

Type a film name and Reel Radar autocompletes as you go — poster, year and rating in the
dropdown, so you pick the right *Blade Runner* first time. Choose one and it shows every way
to watch it in your country, grouped by how you'd actually pay:

| Group | Meaning |
| --- | --- |
| **Included with subscription** | Already covered if you subscribe |
| **Free to watch** | Free, usually ad-supported |
| **Rent** | Pay once, watch within a window |
| **Buy** | Own it outright |

Results are region-aware and deep-linkable: `?film=335984&region=GB` restores the exact view,
so you can share "it's on Netflix here" as a link.

### Details worth knowing

- **Autocomplete that ranks sensibly.** TMDB's raw relevance buries famous films under obscure
  same-name ones, so exact title matches sort first, then prefix matches, then popularity.
- **Keyboard-complete.** `↑`/`↓` to move, `Enter` to pick, `Esc` to dismiss — a proper ARIA
  combobox, not a div with a click handler.
- **Mobile-first.** Built at 390px up. The country picker is a native `<select>`, so phones get
  the OS wheel rather than a custom dropdown that fights the keyboard.
- **Remembers you.** Your country and last six films persist locally; no account, no tracking.
- **Honest empty states.** "Not streaming in the United Kingdom" says so plainly, and suggests
  trying another country, rather than showing a blank shelf.

## Getting started

Reel Radar needs one free credential from [TMDB](https://www.themoviedb.org). Creating an
account and requesting a key takes about a minute and is free for non-commercial use.

```bash
git clone https://github.com/RobertThwaite/reel-radar.git
cd reel-radar
npm install

cp .env.example .env.local
# then put your TMDB v4 "API Read Access Token" in TMDB_ACCESS_TOKEN

npm run dev          # http://localhost:3000
```

If the credential is missing the app doesn't crash — it renders a short setup card telling you
exactly what to add.

### Environment

| Variable | Required | Purpose |
| --- | --- | --- |
| `TMDB_ACCESS_TOKEN` | one of these | TMDB v4 API Read Access Token (preferred) |
| `TMDB_API_KEY` | one of these | Legacy TMDB v3 API key; used only if no token is set |
| `NEXT_PUBLIC_DEFAULT_REGION` | no | Country shown before a visitor picks one. Default `GB` |
| `TMDB_BASE_URL` | no | Points the TMDB client somewhere else — used to run the UI against a fixture server in tests |

The credential is only ever read server-side, inside the API routes. It is never sent to the
browser.

## Running it on GitHub

**Codespaces — the quickest way to see it running.** Click *Code ▸ Codespaces ▸ Create
codespace*. The devcontainer installs dependencies, and Codespaces prompts you for a
`TMDB_ACCESS_TOKEN` secret the first time. Then `npm run dev` — port 3000 forwards automatically
and opens in a preview tab. Nothing to install locally.

**Actions.** Every push runs lint, typecheck, the unit tests and a production build. The build
needs no credential, so CI is green on a fresh fork.

**GitHub Pages can't host this one.** Pages serves static files only, and Reel Radar needs a
server process for its `/api/*` routes — that's what keeps your TMDB credential out of the
browser. Making it Pages-compatible would mean shipping the key in the client bundle, where
anyone could lift it from a public site. Use a host that runs Node instead.

## Deploying

It's a stock Next.js app, so anywhere that runs Node works. On Vercel (free tier is plenty):

1. Import the repository.
2. Add `TMDB_ACCESS_TOKEN` as an environment variable.
3. Deploy — no other configuration needed.

Netlify, Render, Railway and Fly all work the same way: set the one environment variable and
deploy.

## How it's put together

```
src/
├── app/
│   ├── api/search/route.ts       # autocomplete feed
│   ├── api/movie/[id]/route.ts   # details + watch providers, one round trip
│   ├── page.tsx                  # server shell
│   └── globals.css               # cinema theme: grain, vignette, marquee type
├── components/
│   ├── Finder.tsx                # orchestrates URL state, region and fetching
│   ├── SearchBar.tsx             # the ARIA combobox
│   ├── MoviePanel.tsx            # the result card
│   ├── ProviderShelf.tsx         # one row of services
│   └── Backdrop.tsx              # crossfading blurred still
└── lib/
    ├── tmdb.ts                   # server-only TMDB client
    ├── providers.ts              # normalises TMDB's payloads (unit tested)
    ├── store.ts                  # localStorage prefs as an external store
    └── regions.ts                # supported countries
```

Two deliberate choices:

**The API key stays on the server.** The browser talks to `/api/*`, never to TMDB. That keeps the
credential out of the bundle and lets responses be cached at the edge — details for an hour,
searches for five minutes.

**State is derived, not synchronised.** Fetched results are tagged with what they were fetched
for, so "are these results current?" is a comparison rather than another piece of state to keep
in step. Nothing copies fetch results into state from an effect, which is what makes the
autocomplete immune to a slow early request landing after a newer one.

## Development

```bash
npm run dev        # dev server
npm run lint       # eslint
npm run typecheck  # tsc --noEmit
npm test           # vitest — 25 unit tests over the normalisation layer
npm run build      # production build
```

## Roadmap

- **Next on TV.** Broadcast listings ("it's on BBC Two at 9pm Thursday") were scoped out of v1:
  there's no free global EPG API. The intended route is an XMLTV adapter, since that's the format
  UK guide data is published in.
- TV series as well as films — TMDB exposes the same provider data for them.
- Price comparison across rental services.
- Notify me when this lands on a service I already pay for.

## Attribution

This product uses the TMDB API but is **not** endorsed or certified by TMDB. Streaming
availability is supplied by [JustWatch](https://www.justwatch.com) via TMDB.

## Licence

MIT — see [LICENSE](LICENSE).
