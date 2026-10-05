import { Request, Response } from "express";
import { renderBase } from "../views/shared.js";

/**
 * GET /
 * Guided product homepage. One idea per viewport, ordered as a first-time
 * visitor understands the system: what it is -> why it exists -> how it works
 * -> why it is trustworthy -> how to prove it -> where to learn more.
 * Every action carries an explanation of what will happen and what you learn.
 */
export class HomeController {
  public static async renderHome(_req: Request, res: Response): Promise<void> {
    const content = `
    <!-- 1. HERO — what is this? -->
    <section class="relative overflow-hidden flex items-center min-h-[88vh] border-b border-obsidian-800/80" aria-labelledby="hero-title">
      <div class="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-champagne-500/5 blur-[120px] pointer-events-none rounded-full" aria-hidden="true"></div>
      <div class="max-w-3xl mx-auto px-4 sm:px-6 text-center relative z-10">
        <p class="reveal inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-obsidian-850 border border-champagne-500/30 text-champagne-300 text-xs font-semibold uppercase tracking-wider mb-8">
          <i class="fa-solid fa-shield-halved" aria-hidden="true"></i> Usage Metering &amp; Billing Engine
        </p>
        <h1 id="hero-title" class="reveal text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-sand-100 leading-[1.12]">
          Billing that never <br class="hidden md:inline"><span class="gold-gradient-text">double-charges anyone.</span>
        </h1>
        <p class="reveal mt-7 text-base sm:text-lg text-sand-300 leading-relaxed">
          MeterFlow records every billable action exactly once, enforces plan limits
          <em class="text-sand-100 not-italic font-semibold">before</em> the action runs, and prices AI
          tokens to the nano-dollar &mdash; correctly, even when network retries attack it.
        </p>
        <div class="reveal mt-10 flex flex-col items-center gap-3">
          <a href="#problem" class="px-7 py-3.5 rounded-xl bg-gradient-to-r from-champagne-400 via-champagne-500 to-champagne-600 hover:from-champagne-300 hover:to-champagne-500 text-obsidian-950 font-bold text-sm shadow-xl shadow-champagne-500/20 flex items-center gap-2.5 transition transform hover:-translate-y-0.5">
            <span>See how it works</span>
            <i class="fa-solid fa-arrow-down text-xs" aria-hidden="true"></i>
          </a>
          <p class="text-xs text-sand-400">A 2-minute walkthrough. No setup, no signup &mdash; everything runs on this page&rsquo;s engine.</p>
          <a href="/dashboard" class="mt-2 text-sm text-sand-300 hover:text-champagne-300 transition underline decoration-obsidian-600 underline-offset-4">
            In a hurry? Jump straight to the live console &rarr;
          </a>
        </div>
      </div>
    </section>

    <!-- 2. PROBLEM — why does this exist? -->
    <section id="problem" class="py-28 sm:py-36 border-b border-obsidian-800/80" aria-labelledby="problem-title">
      <div class="max-w-3xl mx-auto px-4 sm:px-6">
        <div class="reveal">
          <p class="text-xs font-bold uppercase tracking-wider text-champagne-400 mb-3">The problem</p>
          <h2 id="problem-title" class="text-3xl sm:text-4xl font-black text-sand-100 tracking-tight leading-tight">
            Three boring failures quietly drain money from every usage-based product.
          </h2>
        </div>
        <div class="mt-14 space-y-6">
          <div class="reveal bg-obsidian-900/80 border border-obsidian-800 rounded-2xl p-6 sm:p-7">
            <h3 class="text-lg font-bold text-sand-100 flex items-center gap-3">
              <span class="w-8 h-8 rounded-lg bg-obsidian-800 border border-obsidian-700 flex items-center justify-center text-amber-400 text-sm shrink-0"><i class="fa-solid fa-rotate" aria-hidden="true"></i></span>
              A retry becomes a double charge
            </h3>
            <p class="text-sm text-sand-300 leading-relaxed mt-3">
              The network blips, the client retries &mdash; and a naive backend records the same AI call twice.
              The customer pays twice for one answer. Real products have lost users over exactly this.
            </p>
          </div>
          <div class="reveal bg-obsidian-900/80 border border-obsidian-800 rounded-2xl p-6 sm:p-7">
            <h3 class="text-lg font-bold text-sand-100 flex items-center gap-3">
              <span class="w-8 h-8 rounded-lg bg-obsidian-800 border border-obsidian-700 flex items-center justify-center text-amber-400 text-sm shrink-0"><i class="fa-solid fa-door-open" aria-hidden="true"></i></span>
              Quotas checked too late
            </h3>
            <p class="text-sm text-sand-300 leading-relaxed mt-3">
              If the limit is checked <em class="text-sand-100 not-italic">after</em> calling the AI provider,
              you have already paid for the inference &mdash; for usage the plan never allowed. The gate must
              come first.
            </p>
          </div>
          <div class="reveal bg-obsidian-900/80 border border-obsidian-800 rounded-2xl p-6 sm:p-7">
            <h3 class="text-lg font-bold text-sand-100 flex items-center gap-3">
              <span class="w-8 h-8 rounded-lg bg-obsidian-800 border border-obsidian-700 flex items-center justify-center text-amber-400 text-sm shrink-0"><i class="fa-solid fa-calculator" aria-hidden="true"></i></span>
              Floating-point math loses cents
            </h3>
            <p class="text-sm text-sand-300 leading-relaxed mt-3">
              <code class="font-mono text-xs text-rose-300 bg-obsidian-850 px-1.5 py-0.5 rounded">0.1 + 0.2 = 0.30000000000000004</code>.
              Across millions of token events, that silent drift turns into real, unreconcilable money.
            </p>
          </div>
        </div>
        <p class="reveal mt-14 text-center text-sand-300 text-sm sm:text-base">
          MeterFlow is built so that none of these can happen. <a href="#how" class="text-champagne-300 font-semibold hover:text-champagne-200 underline decoration-champagne-500/40 underline-offset-4">Here is how &darr;</a>
        </p>
      </div>
    </section>

    <!-- 3. HOW IT WORKS — what does it do? -->
    <section id="how" class="py-28 sm:py-36 border-b border-obsidian-800/80 bg-obsidian-900/30" aria-labelledby="how-title">
      <div class="max-w-3xl mx-auto px-4 sm:px-6">
        <div class="reveal">
          <p class="text-xs font-bold uppercase tracking-wider text-champagne-400 mb-3">How it works</p>
          <h2 id="how-title" class="text-3xl sm:text-4xl font-black text-sand-100 tracking-tight leading-tight">
            One billable request, four honest steps.
          </h2>
          <p class="mt-5 text-sand-300 text-sm sm:text-base leading-relaxed">
            Every request to a billable endpoint walks this path. Each step exists to kill one of the
            failures you just read about.
          </p>
        </div>
        <ol class="mt-14 space-y-10">
          <li class="reveal flex gap-5">
            <span class="shrink-0 w-10 h-10 rounded-xl bg-champagne-400/10 border border-champagne-400/30 text-champagne-300 font-bold flex items-center justify-center" aria-hidden="true">1</span>
            <div>
              <h3 class="text-lg font-bold text-sand-100">Reserve the idempotency key</h3>
              <p class="text-sm text-sand-300 leading-relaxed mt-2">
                The request carries an <code class="font-mono text-xs text-champagne-300">Idempotency-Key</code> header.
                MeterFlow atomically reserves that key in PostgreSQL. A retry with the same key gets the
                <em class="text-sand-100 not-italic">original response back</em> and records nothing new &mdash;
                the retry storm is harmless.
              </p>
            </div>
          </li>
          <li class="reveal flex gap-5">
            <span class="shrink-0 w-10 h-10 rounded-xl bg-champagne-400/10 border border-champagne-400/30 text-champagne-300 font-bold flex items-center justify-center" aria-hidden="true">2</span>
            <div>
              <h3 class="text-lg font-bold text-sand-100">Check the quota before doing anything</h3>
              <p class="text-sm text-sand-300 leading-relaxed mt-2">
                Usage so far, plus what this request wants, against the plan limit. Over the limit the caller
                gets <code class="font-mono text-xs text-champagne-300">429 Too Many Requests</code> with a
                <code class="font-mono text-xs text-champagne-300">Retry-After</code> header; a lapsed
                subscription gets <code class="font-mono text-xs text-champagne-300">402 Payment Required</code>.
                Nothing runs, nothing leaks.
              </p>
            </div>
          </li>
          <li class="reveal flex gap-5">
            <span class="shrink-0 w-10 h-10 rounded-xl bg-champagne-400/10 border border-champagne-400/30 text-champagne-300 font-bold flex items-center justify-center" aria-hidden="true">3</span>
            <div>
              <h3 class="text-lg font-bold text-sand-100">Record exactly one usage event</h3>
              <p class="text-sm text-sand-300 leading-relaxed mt-2">
                The event lands in the ledger under a unique
                <code class="font-mono text-xs text-champagne-300">(tenant, idempotency-key)</code> constraint &mdash;
                even if application code fails, the database itself refuses the duplicate.
              </p>
            </div>
          </li>
          <li class="reveal flex gap-5">
            <span class="shrink-0 w-10 h-10 rounded-xl bg-champagne-400/10 border border-champagne-400/30 text-champagne-300 font-bold flex items-center justify-center" aria-hidden="true">4</span>
            <div>
              <h3 class="text-lg font-bold text-sand-100">Price it in whole numbers</h3>
              <p class="text-sm text-sand-300 leading-relaxed mt-2">
                Tokens convert to <code class="font-mono text-xs text-champagne-300">BigInt</code> nano-dollars:
                fresh input $2.00/1M, cached input $0.50/1M (the 75% caching discount), reasoning tokens billed
                as output. No floats exist anywhere in the money path.
              </p>
            </div>
          </li>
        </ol>
        <div class="reveal mt-16 bg-obsidian-900/80 border border-obsidian-800 rounded-2xl p-6 sm:p-7">
          <h3 class="text-base font-bold text-sand-100 flex items-center gap-2.5">
            <i class="fa-solid fa-key text-champagne-400" aria-hidden="true"></i> And the plan the customer is on?
          </h3>
          <p class="text-sm text-sand-300 leading-relaxed mt-2.5">
            Stripe stays the source of payment truth. Signed webhooks arrive, signatures are verified against
            the raw request body, replayed events are ignored, and only then does the tenant&rsquo;s plan
            change. A forged webhook gets a <code class="font-mono text-xs text-champagne-300">400</code> and
            changes nothing.
          </p>
        </div>
      </div>
    </section>

    <!-- 4. GUARANTEES — why trust it? -->
    <section id="guarantees" class="py-28 sm:py-36 border-b border-obsidian-800/80" aria-labelledby="guarantees-title">
      <div class="max-w-4xl mx-auto px-4 sm:px-6">
        <div class="reveal text-center">
          <p class="text-xs font-bold uppercase tracking-wider text-champagne-400 mb-3">The guarantees</p>
          <h2 id="guarantees-title" class="text-3xl sm:text-4xl font-black text-sand-100 tracking-tight leading-tight">
            Four promises the code actually keeps.
          </h2>
          <p class="mt-5 text-sand-300 text-sm sm:text-base">
            Each guarantee is enforced in the layer that cannot be bypassed &mdash; and each has a
            deep-dive guide if you want the full design.
          </p>
        </div>
        <div class="mt-14 grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div class="reveal bg-obsidian-900/80 border border-obsidian-800 rounded-2xl p-6 space-y-3 gold-border-glow transition">
            <i class="fa-solid fa-fingerprint text-champagne-400 text-xl" aria-hidden="true"></i>
            <h3 class="text-base font-bold text-sand-100">Exactly-once metering</h3>
            <p class="text-sm text-sand-300 leading-relaxed">
              Atomic key reservation plus a database-level unique constraint. A replayed request mirrors the
              original response; a changed payload is rejected with 422.
            </p>
            <a href="/guides/exactly-once-metering-and-idempotency" class="inline-block text-xs font-semibold text-champagne-400 hover:text-champagne-300">Read the idempotency guide &rarr;</a>
          </div>
          <div class="reveal bg-obsidian-900/80 border border-obsidian-800 rounded-2xl p-6 space-y-3 gold-border-glow transition">
            <i class="fa-solid fa-traffic-light text-champagne-400 text-xl" aria-hidden="true"></i>
            <h3 class="text-base font-bold text-sand-100">Honest quota boundaries</h3>
            <p class="text-sm text-sand-300 leading-relaxed">
              Call 1,000 of 1,000 succeeds. Call 1,001 is refused with 429 and Retry-After &mdash; the API
              never lies about why a request was blocked.
            </p>
            <a href="/guides/quota-enforcement-and-http-boundaries" class="inline-block text-xs font-semibold text-champagne-400 hover:text-champagne-300">Read the quota guide &rarr;</a>
          </div>
          <div class="reveal bg-obsidian-900/80 border border-obsidian-800 rounded-2xl p-6 space-y-3 gold-border-glow transition">
            <i class="fa-solid fa-coins text-champagne-400 text-xl" aria-hidden="true"></i>
            <h3 class="text-base font-bold text-sand-100">Zero-drift money math</h3>
            <p class="text-sm text-sand-300 leading-relaxed">
              All costs are BigInt nano-dollars with pinned per-category prices. The rollup you bill equals
              the constants in config, to the last nano-unit.
            </p>
            <a href="/guides/ai-token-pricing-and-integer-math" class="inline-block text-xs font-semibold text-champagne-400 hover:text-champagne-300">Read the pricing guide &rarr;</a>
          </div>
          <div class="reveal bg-obsidian-900/80 border border-obsidian-800 rounded-2xl p-6 space-y-3 gold-border-glow transition">
            <i class="fa-solid fa-shield-halved text-champagne-400 text-xl" aria-hidden="true"></i>
            <h3 class="text-base font-bold text-sand-100">Cryptographic webhook sync</h3>
            <p class="text-sm text-sand-300 leading-relaxed">
              Raw-buffer HMAC-SHA256 verification, event deduplication, and a background reconciler that
              repairs drift and alerts on failure.
            </p>
            <a href="/guides/stripe-webhooks-and-cryptographic-security" class="inline-block text-xs font-semibold text-champagne-400 hover:text-champagne-300">Read the webhooks guide &rarr;</a>
          </div>
        </div>
      </div>
    </section>

    <!-- 5. TRY IT — prove it to yourself -->
    <section id="try" class="py-28 sm:py-36 border-b border-obsidian-800/80 bg-obsidian-900/30" aria-labelledby="try-title">
      <div class="max-w-3xl mx-auto px-4 sm:px-6">
        <div class="reveal">
          <p class="text-xs font-bold uppercase tracking-wider text-champagne-400 mb-3">Prove it to yourself</p>
          <h2 id="try-title" class="text-3xl sm:text-4xl font-black text-sand-100 tracking-tight leading-tight">
            Three moves in the live console.
          </h2>
          <p class="mt-5 text-sand-300 text-sm sm:text-base leading-relaxed">
            The engine behind this page is running right now, with four demo tenants pre-seeded &mdash;
            including one sitting at 999 of 1,000 calls and one with a deliberately lapsed subscription.
          </p>
        </div>
        <div class="mt-14 space-y-6">
          <div class="reveal bg-obsidian-900/80 border border-obsidian-800 rounded-2xl p-6 sm:p-7">
            <div class="flex items-center justify-between gap-4 flex-wrap">
              <h3 class="text-lg font-bold text-sand-100"><span class="text-champagne-400 font-mono text-sm mr-2">STEP 1</span>Open the console</h3>
              <a href="/dashboard" class="px-5 py-2.5 rounded-lg bg-gradient-to-r from-champagne-400 via-champagne-500 to-champagne-600 hover:from-champagne-300 hover:to-champagne-500 text-obsidian-950 font-bold text-xs shadow-lg shadow-champagne-500/15 transition transform hover:-translate-y-0.5">Launch the console &rarr;</a>
            </div>
            <p class="text-sm text-sand-300 leading-relaxed mt-3">
              You will see the four tenants with live quota gauges. Nothing to install &mdash; the console
              talks to the same engine serving this page.
            </p>
          </div>
          <div class="reveal bg-obsidian-900/80 border border-obsidian-800 rounded-2xl p-6 sm:p-7">
            <div class="flex items-center justify-between gap-4 flex-wrap">
              <h3 class="text-lg font-bold text-sand-100"><span class="text-champagne-400 font-mono text-sm mr-2">STEP 2</span>Break the boundary</h3>
              <span class="text-[11px] font-mono text-sand-400">in the console &rarr; Boundary tenant</span>
            </div>
            <p class="text-sm text-sand-300 leading-relaxed mt-3">
              Send one more call as the Boundary tenant. Call 1,000 succeeds; call 1,001 is refused with
              <code class="font-mono text-xs text-champagne-300">429</code> and a
              <code class="font-mono text-xs text-champagne-300">Retry-After</code> header &mdash; and records
              no usage event. That is the gate from step 2 above, working.
            </p>
          </div>
          <div class="reveal bg-obsidian-900/80 border border-obsidian-800 rounded-2xl p-6 sm:p-7">
            <div class="flex items-center justify-between gap-4 flex-wrap">
              <h3 class="text-lg font-bold text-sand-100"><span class="text-champagne-400 font-mono text-sm mr-2">STEP 3</span>Upgrade via webhook</h3>
              <span class="text-[11px] font-mono text-sand-400">in the console &rarr; Webhook lab</span>
            </div>
            <p class="text-sm text-sand-300 leading-relaxed mt-3">
              Fire a signed checkout webhook and watch the tenant flip Free &rarr; Pro with new, higher
              limits. Replay the same event: the engine answers
              <code class="font-mono text-xs text-champagne-300">duplicate_ignored</code> instead of upgrading
              twice.
            </p>
          </div>
        </div>
        <p class="reveal mt-12 text-center text-xs text-sand-400">
          Prefer raw HTTP? Every move above is a plain cURL &mdash; recipes are in the
          <a href="https://github.com/abubakar-ahmed-dev/meterflow-billing-engine#readme" target="_blank" rel="noopener" class="text-champagne-300 hover:text-champagne-200 underline decoration-champagne-500/40 underline-offset-4">README</a>.
        </p>
      </div>
    </section>

    <!-- 6. GO DEEPER — learn more -->
    <section id="deeper" class="py-28 sm:py-36" aria-labelledby="deeper-title">
      <div class="max-w-4xl mx-auto px-4 sm:px-6">
        <div class="reveal text-center">
          <p class="text-xs font-bold uppercase tracking-wider text-champagne-400 mb-3">Go deeper</p>
          <h2 id="deeper-title" class="text-3xl sm:text-4xl font-black text-sand-100 tracking-tight">
            Where to look next.
          </h2>
        </div>
        <div class="mt-14 grid grid-cols-1 sm:grid-cols-3 gap-6">
          <a href="/guides" class="reveal group bg-obsidian-900 border border-obsidian-800 hover:border-champagne-500/40 rounded-2xl p-6 transition gold-border-glow">
            <i class="fa-solid fa-book-open text-champagne-400 text-xl" aria-hidden="true"></i>
            <h3 class="text-base font-bold text-sand-100 mt-3 group-hover:text-champagne-300 transition">Architecture guides</h3>
            <p class="text-xs text-sand-300 leading-relaxed mt-2">
              Six deep dives: idempotency, quota semantics, integer pricing, webhook security, production architecture.
            </p>
          </a>
          <a href="/docs" target="_blank" rel="noopener" class="reveal group bg-obsidian-900 border border-obsidian-800 hover:border-champagne-500/40 rounded-2xl p-6 transition gold-border-glow">
            <i class="fa-solid fa-code text-champagne-400 text-xl" aria-hidden="true"></i>
            <h3 class="text-base font-bold text-sand-100 mt-3 group-hover:text-champagne-300 transition">OpenAPI reference</h3>
            <p class="text-xs text-sand-300 leading-relaxed mt-2">
              Every endpoint, schema, and status code &mdash; executable directly from the Swagger UI.
            </p>
          </a>
          <a href="https://github.com/abubakar-ahmed-dev/meterflow-billing-engine" target="_blank" rel="noopener" class="reveal group bg-obsidian-900 border border-obsidian-800 hover:border-champagne-500/40 rounded-2xl p-6 transition gold-border-glow">
            <i class="fa-brands fa-github text-champagne-400 text-xl" aria-hidden="true"></i>
            <h3 class="text-base font-bold text-sand-100 mt-3 group-hover:text-champagne-300 transition">Source &amp; evidence</h3>
            <p class="text-xs text-sand-300 leading-relaxed mt-2">
              Full source, migration history, 35-test suite, and EVIDENCE.md with a pasted proof per requirement.
            </p>
          </a>
        </div>
      </div>
    </section>`;

    const html = renderBase({
      title: "MeterFlow — Usage Metering & Billing Engine",
      description:
        "MeterFlow records every billable action exactly once, enforces plan limits before the action runs, and prices AI tokens in integer nano-dollars. Live console, guides, and OpenAPI docs included.",
      activeNav: "home",
      content,
    });

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.status(200).send(html);
  }
}
