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
