# FORMA

Personal improvement system — diagnose → prioritize → daily actions → adapt.

**Not a habit tracker. Not medical software.**

## Stack

- Next.js 16 (App Router) + TypeScript + Tailwind CSS v4
- Zustand (persisted client store for MVP)
- Zod-validated AI contracts
- Prisma schema ready for PostgreSQL (runtime MVP is local-first)
- Mock `AIService` — swap OpenAI/Anthropic without UI changes

## Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## MVP surfaces

- Onboarding (5 stages) → Personal State
- Today + adaptive tasks
- Daily check-in
- Progress / achievements / momentum
- AI Coach (context + safety layer)
- Weekly review
- Subscription architecture (free/premium mock)

## AI

`src/lib/ai/service.ts` — interface  
`src/lib/ai/mock.ts` — deterministic mock provider  
`src/lib/ai/schemas.ts` — Zod structured outputs  

Replace via `setAIService(realProvider)`.

## AI (Timeweb DeepSeek)

Серверный ключ Timeweb AI Gateway. Фронт ходит в `/api/ai`, ключ не попадает в браузер.

```bash
TIMEWEB_AI_API_KEY=tw_...
TIMEWEB_AI_MODEL=deepseek/deepseek-chat   # точное имя из панели Timeweb
TIMEWEB_AI_BASE_URL=https://api.timeweb.ai/v1
```

Если ключа нет — используется mock AI с той же схемой данных.

Для Mini App на GitHub Pages задай backend:

```bash
NEXT_PUBLIC_AI_API_BASE=https://<твой-vercel>.vercel.app
```


Bot: [@kostya_health_bot](https://t.me/kostya_health_bot)

Production URL (GitHub Pages):
https://selivanovkp-create.github.io/diz-web/

Menu button opens FORMA as a Mini App. `/start` returns an inline WebApp button (via `scripts/telegram-poll.mjs`).

```bash
export TELEGRAM_BOT_TOKEN=...
export APP_URL=https://selivanovkp-create.github.io/diz-web
node scripts/telegram-poll.mjs
```

To rebuild Pages:

```bash
GITHUB_PAGES=1 npm run build
# publish ./out to gh-pages branch
```
