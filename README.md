# Speaker OS

Gamified keynote and seminar mastery. Version 0.1 of the playable core loop.

The computer does not replace the speaker. It trains the speaker.

**Generate first. Organize later.**

Repository: [kingofthewisdomrealm-hub/WORLD-CLASS-SPEAKER](https://github.com/kingofthewisdomrealm-hub/WORLD-CLASS-SPEAKER)

## What 0.1 includes

1. Game Start
2. Speaker profile + speech project
3. Level 1 interview / brain dump
4. Idea cards with XP
5. Classify cards into speech components
6. Organize those into nested section cards (introduction, body, conclusion)
7. Speaker scoreboard
8. Session history persisted in the browser

Practice gyms, boss battles, and full speech assembly come later.

## Run it

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## AI (optional)

The game is playable without a model. The host falls back to a long-form question bank, and idea capture still works.

For a live interviewer and smarter extraction, add a Vercel AI Gateway key:

```bash
cp .env.example .env.local
```

```env
AI_GATEWAY_API_KEY=your_key_here
```

Then restart `npm run dev`.

## Persistence

Speaker, project, interview, cards, clusters, themes, XP, and sessions are stored in `localStorage` under `speaker-os-v1`. No account is required for this version.
