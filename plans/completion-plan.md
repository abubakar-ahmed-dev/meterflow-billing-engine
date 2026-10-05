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

## Phase 5 — UI/UX Polish

Branch: `phase-5-ui-polish` · Effort: ~4–6h
Keep the obsidian/champagne identity. Fix inconsistency and fragility, not the design direction.

Tasks:
1. Consolidate design tokens into a single CSS variables file; remove hardcoded hex values from `home/dashboard/guide` controllers.
2. Responsive: dashboard usable at 768px and 375px; gauges and probe labs must not break.
3. Accessibility: AA contrast on gold-on-obsidian, visible focus states, aria-labels on interactive labs, keyboard-operable tabs.
4. Copy pass: identical terminology across `/`, `/dashboard`, `/guides` and the API ("idempotency key", "usage event").
5. Loading/error states: dashboard helper API failures render inline errors, never blank panes; probe results show status-code badges.
6. Structure: extract page markup from the 913-line `dashboard.controller.ts` into `src/views/` templates; dedupe repeated markup.
7. Homepage links to `/docs` (Swagger) and `/health`.

Gate:
- Manual check: 375/768/1440 widths clean; keyboard-only walkthrough of dashboard labs works; zero hardcoded palette values outside the tokens file; consistent identity on all pages.

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
