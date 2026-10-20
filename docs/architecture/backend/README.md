# AutoNexa / CAMP — Backend Architecture Decision Pack

> Status: **Draft for team review** · Prepared: 2026-10-19 · Inputs: SRS v1.0 (Nexar Sol), `context/*.md`, current Next.js 16 frontend

This pack answers three questions from the backend team:

1. Which tech stack and architecture best fit this platform, given its requirements, expected load, and the level of professionalism expected?
2. Can the backend be built in **Next.js**? If yes, what is the stack?
3. If we go Next.js-first, should we use **Supabase** or **Firebase**?

## How to read this pack

| # | File | What it covers |
|---|---|---|
| — | [MASTER-RECOMMENDATION.md](./MASTER-RECOMMENDATION.md) | **Start here.** Decision matrix, the "choose X if…" guide, the recommended reference architecture |
| 00 | [00-requirements-and-workload.md](./00-requirements-and-workload.md) | SRS NFRs, the derived load model, the "hard problems" every option is scored against |
| 1 | [01-custom-backend-vercel.md](./01-custom-backend-vercel.md) | Custom API + own DB, frontend on **Vercel**, API on Railway/Render/Fly |
| 1b | [01b-custom-backend-vercel-aws.md](./01b-custom-backend-vercel-aws.md) | Same, but the API runs on **AWS ca-central-1** |
| 2 | [02-custom-backend-self-hosted-vps.md](./02-custom-backend-self-hosted-vps.md) | Everything on a **VPS** (SRS-faithful Hostinger / Canadian VPS) |
| 2b | [02b-custom-backend-aws-full.md](./02b-custom-backend-aws-full.md) | Everything on **AWS ca-central-1** (enterprise variant) |
| 3 | [03-nextjs-supabase-vercel.md](./03-nextjs-supabase-vercel.md) | **Next.js + Supabase** on Vercel (recommended BaaS) |
| 3b | [03b-nextjs-firebase-vercel.md](./03b-nextjs-firebase-vercel.md) | Next.js + Firebase on Vercel (documented, **not recommended**) |
| 3c | [03c-nextjs-fullstack-own-db-vercel.md](./03c-nextjs-fullstack-own-db-vercel.md) | Next.js *as* the backend without a BaaS (Prisma + Postgres + SaaS glue) |
| 4 | [04-nextjs-supabase-self-hosted-app.md](./04-nextjs-supabase-self-hosted-app.md) | Next.js + Supabase Cloud, app hosted **off Vercel** (container/VPS) |
| 4b | [04b-self-hosted-supabase.md](./04b-self-hosted-supabase.md) | Fully **self-hosted Supabase** + Next.js |

Every scenario document follows the same 11-section template, so they can be compared side by side:

1. Summary & when to choose · 2. Architecture diagram · 3. Tech stack · 4. Critical flows · 5. NFR matrix · 6. Residency & compliance · 7. Scaling path · 8. Cost bands · 9. Effort & time-to-MVP · 10. Risks / lock-in / exit · 11. Impact on current frontend

## Decision criteria (weights used in the master matrix)

| Criterion | Weight | Why it matters for CAMP |
|---|---|---|
| Domain fit (relational, ACID, geo) | 15% | Bids, matches, subscriptions are strongly relational; bids need row locks; dealer radius needs geo queries |
| Durable jobs & exact timers | 12% | The auction closes at T+24h and the acceptance window at T+24h. Both must survive restarts (FR-X-02) |
| Realtime (bid count, countdown) | 10% | Live bid counts for sellers and dealers over SSE/WebSocket, up to ~5k connections |
| NFR compliance (perf, 99.9%, RPO/RTO, MFA, audit) | 13% | SRS §5 is contractual |
| Canadian data residency | 10% | PIPEDA, Quebec Law 25, NFR-09 |
| Time-to-MVP | 12% | Business pressure to demo |
| Cost (MVP and growth) | 8% | Fixed vs usage-based billing |
| Ops burden | 8% | Size of the team that has to keep it running |
| Lock-in / exit strategy | 6% | Ability to migrate later without a rewrite |
| Team fit (TypeScript-first) | 6% | The frontend is already TypeScript, Zod, TanStack |

## Labels used

- **✅** meets the requirement natively · **⚠️** meets it with extra work or a caveat · **❌** does not meet it without changing the architecture
- **🔎 Verify before commit**: vendor facts (regions, pricing, limits) that change often. Confirm them on the vendor site when the decision is made.

## Glossary

| Term | Meaning |
|---|---|
| BaaS | Backend-as-a-Service (Supabase, Firebase): managed DB + auth + storage + functions |
| BFF | Backend-for-Frontend: a thin server layer (Next.js Route Handlers) that shapes data for the UI |
| Modular monolith | One deployable API split into strict internal modules (auth, listings, bids…); scales by running more copies |
| RLS | Postgres Row-Level Security, which enforces per-row access rules inside the DB |
| PITR | Point-in-time recovery for databases |
| Sealed-bid invariant | Bid amounts are never exposed while an auction is `ACTIVE`; only `bidCount` |
