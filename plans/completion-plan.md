# MeterFlow — 100% Completion Plan

Source: full audit (2026-10-05) against the FlyRank capstone brief (`Usage Metering Billing Engine Live Capstone.pdf`).
Goal: every Section 6 requirement, Section 10 file, Section 12 Layer 1 + Layer 2 probe, and Shared Requirement 1–7 green. One UI/UX polish phase included. Deployment not required.

---

## Git Workflow (applies to every phase)

- `main` — stable, submission-facing. Only receives merges from `dev`, always via PR. Never direct commits.
- `dev` — integration branch. All phase branches start and end here.
- Per phase: create `phase-N-<slug>` from latest `dev` → work in small conventional commits → open PR into `dev` → merge PR.
- Branches are never deleted (full audit trail preserved).
- Final step: one PR `dev` → `main`, then tag `v1.0.0` on `main`.

```
main ──────────────────────────────────────► (PR: dev → main, tag v1.0.0)
        ▲
dev ──●──●──●──●──●──●──●──
       ▲  ▲  ▲  ▲  ▲  ▲  ▲
  phase-1 … phase-7 (each: branch from dev, PR back into dev)
```

Standing rules: no secrets ever committed; conventional commit messages; `npm run typecheck` + `npm test` green before every PR merge.

---

## Phase 1 — Crash-Safety & Atomic Concurrency (P0)

Branch: `phase-1-crash-safety` · Effort: ~4–6h
Fixes the live-reproduced crash: concurrent same-`Idempotency-Key` requests reach `usageEvent.create` together; loser throws Prisma `P2002`; Express 4 does not catch async rejections; process dies.

Tasks:
1. Async error containment — `express-async-errors` (or handler wrappers). Global error handler `src/app.ts:71` must catch every async rejection. No code path may kill the process.
2. Atomic idempotency reservation in `MeterService.recordUsage`:
   - Replace check-then-upsert with single upsert; catch `P2002` on race.
   - Race loser re-reads record: `COMPLETED` → replay cached response; `IN_PROGRESS` → 409.
   - Stale `IN_PROGRESS` past `expiresAt` → reclaim, not 409.
3. Webhook dedup in `StripePaymentService.processWebhookEvent`:
   - `create` race → catch `P2002` → `duplicate_ignored`.
   - `FAILED` record on Stripe retry → reprocess, not ignore.
4. Fail-closed secrets: `getStripe` / `constructWebhookEvent` throw when env missing. Remove `sk_test_placeholder_key` / `whsec_placeholder_secret` fallbacks.
5. `QuotaService`: `tenant_not_found` returns 404, not 429.
6. Prepare `costMicrocents` → `costNanoDollars` rename (applied in Phase 2 migration to avoid double migration; adjust code references now or in Phase 2 — pick one commit point).

Gate:
- 12 parallel same-key requests → exactly 1 usage event, mix of 200/409, zero crashes, server alive.
- Sequential replay → mirrored response (`X-Idempotent-Replayed: true`).
- `npm run typecheck` + `npm test` green.

---

## Phase 2 — Migrations & Stranger-Runnable Packaging

Branch: `phase-2-migrations-packaging` · Effort: ~3–4h
Fixes Layer 1 (run command must boot) and "a stranger can run it".

Tasks:
1. `prisma migrate dev --name init` → commit `prisma/migrations/`. Include the unit-rename column change here.
2. `docker-compose.yml`: Postgres healthcheck; optional one-shot migrate service.
3. New `npm run up` — single command: compose up → wait-for-db → `migrate deploy` → seed → build → start. Must work on a fresh clone with only `.env` copied from `.env.example`.
4. README: https clone URL (drop `git@github-personal:` SSH alias).
5. CI: replace `prisma db push` with `prisma migrate deploy`.
6. `capstone.yaml`: `run: "npm run up"` (verified on clean clone); keep seed/test/base_url/endpoints accurate.

Gate:
- Fresh clone to a new directory + `npm run up` boots; `/health` green; all probes pass against it.

---

## Phase 3 — Test Hardening (Proof Engine)

Branch: `phase-3-test-hardening` · Effort: ~4–5h
Tests become the source of every EVIDENCE.md proof.

Tasks:
1. Concurrency suite: parallel same-key flood on `/v1/meter/billable`; parallel duplicate webhooks; forged+valid interleaving. Assert exactly-once and survival.
2. Probe 5 exactness: assert exact nano totals against `PRICING_CONFIG` (e.g. 1200 fresh / 400 cached / 600 output / 250 reasoning → deterministic `totalCostNano`); assert `/v1/usage` equals pinned math.
3. Token-quota boundary test (currently only API-call boundary covered): drive token usage to limit → 429 with `metric: "ai_tokens"`.
4. Edge cases: stale `IN_PROGRESS` reclaim, `FAILED` webhook reprocess, payload-mismatch 422, missing header 400s, unknown tenant 404, `PAST_DUE` 402.
5. TTL reclaim test using short `IDEMPOTENCY_TTL_SECONDS` or injected clock.

Gate:
- `npm test` — 20+ deterministic tests, one command, green. Output pasted into EVIDENCE.md.

---

## Phase 4 — Stripe Test Mode First-Class

Branch: `phase-4-stripe-test-mode` · Effort: ~4–6h
Brief expects real Stripe test mode as the primary path.

Tasks:
1. `MOCK_STRIPE=false` default in `.env.example`. Mock documented as fallback (Pakistan/no-account note stays in README + BUILDLOG).
2. README documents full real flow: `stripe listen --forward-to localhost:3000/v1/webhooks/stripe` → checkout session → test card `4242 4242 4242 4242` → webhook → Free→Pro. Checkout uses seeded `stripePriceId` instead of inline `price_data`.
3. `checkout.session.completed`: period dates taken from the Stripe subscription object when present, not calendar-month guess.
4. Reconciliation worker upgrade (the chosen stretch goal): periodic diff of DB subscriptions vs `stripe.subscriptions.list()` → repair drift from missed webhooks → real failure alert (fatal log + persisted alert record). Retries + alert = Shared Requirement #3 fully green.
5. EVIDENCE: paste `stripe trigger checkout.session.completed` transcript.

Gate:
- `stripe trigger` flips tenant Free→Pro through the forwarded signed webhook; forged → 400; replay → ignored.
- Mock path still passes in CI (no Stripe account needed there).

---

## Phase 5 — UI/UX Polish & Homepage Journey Redesign

Branch: `phase-5-ui-polish` · Effort: ~6–8h
Keep the obsidian/champagne identity. Homepage gets a full redesign around a guided learning journey; the rest of the app gets consistency and accessibility fixes.

### Homepage redesign (primary goal)
Problem today: 7 dense sections, 3 CTAs + 4 badges crammed into the hero, marketing jargon. A first-time visitor cannot tell what the system is or what to do first.

Redesign principles:
- **One major idea per viewport**; sections separated by large vertical gaps (`min-h` sections, `py-24+`), narrow reading columns (`max-w-3xl`).
- **Progressive disclosure following the user's understanding**: each section answers the question the visitor just formed, then naturally raises the next question.
- **Never an unexplained action**: every button/CTA carries a one-line explainer of what will happen and what you will learn.

Section journey (each = the question it answers):
1. **Hero** — "What is this?" One sentence, one primary CTA (begin guided walkthrough → scrolls), quiet secondary link (jump to console). No badges, no CTA row.
2. **The problem** — "Why does this exist?" Three concrete failure modes (retry double-charge, boundary leakage, float drift) with real examples.
3. **How it works** — "What does it actually do?" Request lifecycle as 4 numbered steps (billable request → idempotency reservation → quota gate → record + price), plus the payment-sync side path.
4. **The guarantees** — "Why can I trust it?" Four guarantees, each with a one-line "why it matters" and a link into the matching guide.
5. **Try it yourself** — "Show me." Numbered 3-step guided walkthrough: (1) open the console (explains the pre-seeded tenants), (2) push the boundary tenant past 1,000 calls and watch the 429, (3) simulate a signed webhook upgrade Free→Pro. Each step: what you will see, why it matters, button with microcopy.
6. **Go deeper** — "Where do I learn more?" Guides hub, OpenAPI docs, GitHub, health.
7. Footer with full link set.

Supporting changes:
- Slim sticky nav (brand + Console/Guides/API); drop the announcement bar.
- Scroll-reveal (IntersectionObserver fade-up), respecting `prefers-reduced-motion`.
- `src/views/shared.ts`: design tokens (Tailwind config + base CSS) + shared nav/footer shell, so all pages can import one identity source.
- Semantic HTML: `<section aria-labelledby>`, heading hierarchy, skip link, visible focus states, AA contrast.
- SEO/meta description; consistent terminology ("idempotency key", "usage event") matching the API.

### Consistency & accessibility (secondary)
1. Dashboard usable at 768px/375px; gauges and probe labs intact.
2. AA contrast, focus states, aria-labels on interactive labs, keyboard-operable tabs.
3. Dashboard helper API failures render inline errors, never blank panes; probe results carry status-code badges.
4. Dashboard/guides adopt the shared tokens module (markup stays in place; full `src/views/` extraction of the 913-line dashboard controller is explicitly deferred — not worth the regression risk this phase).

Gate:
- Manual check: homepage reads as one idea per screen at 375/768/1440; keyboard-only walkthrough works; every CTA has explanatory microcopy; reveal animations disabled under reduced motion; suite still green.

---

## Phase 6 — Evidence, Docs & Repo Finalization

Branch: `phase-6-evidence-docs` · Effort: ~3–4h

Tasks:
1. Re-run all probes → regenerate `EVIDENCE.md`: one pasted proof per Section 6 box, per Section 12 probe, per Shared Requirement 1–7. Numbers consistent after unit rename.
2. README: updated architecture diagram (metering flow + webhook path), exact run steps (`npm run up`), limitations note, plan/quota table.
3. BUILDLOG: append entries per phase — crash bug found, atomic redesign, migrations, reconciliation worker. Keep honest AI attribution.
4. `DESIGN.md`: sync with implemented state (ADRs: integer unit choice, reservation protocol, mock adapter).
5. Repo naming: one name everywhere (repo, README, package.json).
6. Cleanup: remove debris scripts (race probe now lives in the test suite), verify `.gitignore` covers `.claude/`, `.env`, caches.

Gate: Section 6 + Section 12 checklist — every box ticked with a working evidence link.

---

## Phase 7 — Final Self-Check & Submission Prep

Branch: `phase-7-final-check` · Effort: ~1–2h

1. Clean-machine simulation: fresh clone, `.env` from example, `npm run up`, run all 5 probes via curl; transcripts appended to EVIDENCE.md.
2. Every `capstone.yaml` probe command verified once.
3. Secret scan of full history (`git log -p` — only placeholders appear).
4. `dev` → `main` PR merged; CI green on `main`; tag `v1.0.0`.

Gate: submission-ready. Portal link paste = project complete.

---

## Definition of Done — PDF Requirement Mapping

| PDF requirement | Covered by |
|---|---|
| S6 Metering exactly-once + proof | Ph 1, 3, 6 |
| S6 Quotas 429/402 honest | Ph 1 (404 fix), 3 |
| S6 Cost rules + pinned config + proof | Ph 1 (unit fix), 3 (exact asserts), 6 |
| S6 Stripe checkout + 3 webhooks + verify + dedup | Ph 1, 4, 6 |
| S6 Data model + tenant isolation | Ph 2 (migrations), existing schema |
| S10 all 5 required files | Ph 2, 6 |
| S12 Layer 1 pack + run boots | Ph 2 |
| S12 Layer 2 five probes | Ph 3, 4 — verified Ph 7 |
| Shared 1–7 (layers, no-500, bg job, migrations, idempotency, secrets, cost) | Ph 1, 2, 4, 5 |
| S10 GitHub rules (branches, PRs, stranger-run) | Git Workflow + Ph 2 |
| UI/UX polish (project add-on) | Ph 5 |

Total estimate: ~23–33 focused hours. Critical path: Phase 1 → 2 → 3.
