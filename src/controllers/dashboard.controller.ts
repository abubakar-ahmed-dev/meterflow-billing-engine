import { Request, Response } from "express";

export class DashboardController {
  public static async renderDashboard(_req: Request, res: Response): Promise<void> {
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MeterFlow Billing Engine — Interactive Testing Console</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  <style>
    @keyframes pulse-fast { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
    .animate-pulse-fast { animation: pulse-fast 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
    ::-webkit-scrollbar { width: 6px; height: 6px; }
    ::-webkit-scrollbar-track { background: #0f172a; }
    ::-webkit-scrollbar-thumb { background: #334155; border-radius: 3px; }
  </style>
</head>
<body class="bg-slate-950 text-slate-100 min-h-screen font-sans antialiased selection:bg-cyan-500 selection:text-white">
  
  <!-- Navigation Header -->
  <header class="border-b border-slate-800/80 bg-slate-900/50 backdrop-blur sticky top-0 z-50">
    <div class="max-w-7xl mx-auto px-4 py-3 flex flex-wrap justify-between items-center gap-4">
      <div class="flex items-center gap-3">
        <div class="w-9 h-9 rounded-lg bg-gradient-to-tr from-cyan-500 to-emerald-500 flex items-center justify-center text-slate-950 font-black text-xl shadow-lg shadow-cyan-500/20">
          ⚡
        </div>
        <div>
          <div class="flex items-center gap-2">
            <h1 class="text-lg font-bold tracking-tight text-white">MeterFlow Engine</h1>
            <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-950/80 text-emerald-400 border border-emerald-800/60">
              Interactive Lab
            </span>
          </div>
          <p class="text-xs text-slate-400">Usage Metering, Quota Enforcement & Stripe Simulator</p>
        </div>
      </div>

      <div class="flex items-center gap-2 text-xs">
        <a href="/guides" target="_blank" class="px-3 py-1.5 bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-800 rounded-lg flex items-center gap-1.5 font-semibold transition">
          <i class="fa-solid fa-book-open text-cyan-400"></i> Architecture Guides
        </a>
        <button onclick="refreshData()" class="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg flex items-center gap-1.5 transition">
          <i class="fa-solid fa-arrows-rotate" id="refresh-icon"></i> Refresh
        </button>
        <a href="/docs" target="_blank" class="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg flex items-center gap-1.5 transition">
          <i class="fa-solid fa-book text-emerald-400"></i> OpenAPI Docs
        </a>
        <a href="https://github.com/abubakar-ahmed-dev/meterflow-billing-engine" target="_blank" class="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg flex items-center gap-1.5 transition">
          <i class="fa-brands fa-github"></i> GitHub
        </a>
      </div>
    </div>
  </header>

  <main class="max-w-7xl mx-auto px-4 py-6 space-y-6">
    
    <!-- Active Quota Alerts Banner -->
    <div id="alerts-banner" class="hidden space-y-2"></div>

    <!-- Tenant Switcher Bar -->
    <section>
      <div class="flex items-center justify-between mb-3">
        <h2 class="text-sm font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
          <i class="fa-solid fa-users text-cyan-400"></i> Select Active Tenant for Testing
        </h2>
        <span class="text-xs text-slate-400" id="last-updated">Updating...</span>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3" id="tenant-cards">
        <!-- Rendered via JS -->
      </div>
    </section>

    <!-- Real-time Quota Gauges for Selected Tenant -->
    <section class="grid grid-cols-1 md:grid-cols-3 gap-4" id="quota-gauges">
      <!-- Rendered via JS -->
    </section>

    <!-- Interactive Testing Playground Tabs -->
    <section class="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
      <div class="border-b border-slate-800 bg-slate-900/90 px-4 flex flex-wrap gap-2">
        <button onclick="switchTab('metering')" id="tab-btn-metering" class="px-4 py-3 text-sm font-semibold border-b-2 border-cyan-400 text-cyan-400 flex items-center gap-2 transition">
          <i class="fa-solid fa-calculator"></i> Probe 1 & 5: Metering & Token Pricing Lab
        </button>
        <button onclick="switchTab('boundary')" id="tab-btn-boundary" class="px-4 py-3 text-sm font-semibold border-b-2 border-transparent text-slate-400 hover:text-slate-200 flex items-center gap-2 transition">
          <i class="fa-solid fa-shield-halved"></i> Probe 2: Quota Boundary Honesty (429 / 402)
        </button>
        <button onclick="switchTab('webhooks')" id="tab-btn-webhooks" class="px-4 py-3 text-sm font-semibold border-b-2 border-transparent text-slate-400 hover:text-slate-200 flex items-center gap-2 transition">
          <i class="fa-brands fa-stripe text-indigo-400"></i> Probe 3 & 4: Stripe Webhook Simulator
        </button>
      </div>

      <div class="p-6">
        
        <!-- Tab 1: Metering & Token Pricing -->
        <div id="tab-metering" class="space-y-6">
          <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            <!-- Input Form Controls -->
            <div class="lg:col-span-6 space-y-4">
              <div class="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-4">
                <div class="flex items-center justify-between border-b border-slate-800 pb-2">
                  <h3 class="text-sm font-bold text-white flex items-center gap-2">
                    <i class="fa-solid fa-sliders text-cyan-400"></i> Billable Request Parameters
                  </h3>
                  <span class="text-xs text-slate-400">POST /v1/meter/billable</span>
                </div>

                <div class="space-y-3 text-xs">
                  <div>
                    <div class="flex items-center justify-between mb-1">
                      <label class="text-slate-300 font-medium">Idempotency Key (Guarantees Exactly-Once)</label>
                      <a href="/guides/exactly-once-metering-and-idempotency" target="_blank" class="text-slate-400 hover:text-cyan-400 flex items-center gap-1 text-[11px]" title="How does idempotency prevent double charging? Click to read full guide">
                        <i class="fa-solid fa-circle-question"></i> Guide
                      </a>
                    </div>
                    <div class="flex gap-2">
                      <input type="text" id="input-idempotency-key" class="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 font-mono text-xs focus:outline-none focus:border-cyan-400">
                      <button onclick="generateRandomKey()" class="px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-200" title="Generate New UUID">
                        <i class="fa-solid fa-dice"></i> New
                      </button>
                    </div>
                  </div>

                  <div>
                    <label class="block text-slate-300 font-medium mb-1">API Calls Count</label>
                    <input type="number" id="input-calls" value="1" min="0" class="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 font-mono text-xs">
                  </div>

                  <div class="grid grid-cols-2 gap-3 pt-1">
                    <div>
                      <div class="flex items-center justify-between mb-1">
                        <label class="text-slate-300 font-medium">Fresh Input Tokens</label>
                        <a href="/guides/ai-token-pricing-and-integer-math" target="_blank" class="text-slate-400 hover:text-cyan-400 text-[10px]" title="Standard prompt tokens. Click to read pricing guide">
                          <i class="fa-solid fa-circle-question"></i>
                        </a>
                      </div>
                      <input type="number" id="input-fresh" value="1000" min="0" step="100" oninput="updatePricingPreview()" class="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 font-mono text-xs">
                      <span class="text-[10px] text-slate-400">$2.00 / 1M ($0.0000020 / token)</span>
                    </div>

                    <div>
                      <div class="flex items-center justify-between mb-1">
                        <label class="text-slate-300 font-medium">Cached Input Tokens</label>
                        <a href="/guides/ai-token-pricing-and-integer-math" target="_blank" class="text-emerald-400 hover:text-emerald-300 text-[10px] font-semibold" title="Why is cached input 75% cheaper? Click to read guide">
                          75% Off <i class="fa-solid fa-circle-question"></i>
                        </a>
                      </div>
                      <input type="number" id="input-cached" value="400" min="0" step="100" oninput="updatePricingPreview()" class="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 font-mono text-xs">
                      <span class="text-[10px] text-emerald-400">$0.50 / 1M (75% Discount)</span>
                    </div>

                    <div>
                      <div class="flex items-center justify-between mb-1">
                        <label class="text-slate-300 font-medium">Standard Output Tokens</label>
                        <a href="/guides/ai-token-pricing-and-integer-math" target="_blank" class="text-slate-400 hover:text-cyan-400 text-[10px]" title="Model generation output tokens. Click to read pricing guide">
                          <i class="fa-solid fa-circle-question"></i>
                        </a>
                      </div>
                      <input type="number" id="input-output" value="500" min="0" step="100" oninput="updatePricingPreview()" class="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 font-mono text-xs">
                      <span class="text-[10px] text-slate-400">$8.00 / 1M ($0.0000080 / token)</span>
                    </div>

                    <div>
                      <div class="flex items-center justify-between mb-1">
                        <label class="text-slate-300 font-medium">Reasoning Tokens</label>
                        <a href="/guides/ai-token-pricing-and-integer-math" target="_blank" class="text-purple-400 hover:text-purple-300 text-[10px] font-semibold" title="Why are reasoning tokens billed at output rate? Click to read guide">
                          Output Rate <i class="fa-solid fa-circle-question"></i>
                        </a>
                      </div>
                      <input type="number" id="input-reasoning" value="200" min="0" step="100" oninput="updatePricingPreview()" class="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 font-mono text-xs">
                      <span class="text-[10px] text-purple-400">Billed as Output Tokens</span>
                    </div>
                  </div>
                </div>

                <!-- Instant Price Preview -->
                <div class="bg-slate-900/80 p-3 rounded-lg border border-slate-800/80 flex items-center justify-between text-xs">
                  <div>
                    <span class="text-slate-400">Projected Token Cost:</span>
                    <div class="font-mono text-sm font-bold text-emerald-400" id="preview-cost-usd">$0.000000</div>
                  </div>
                  <div class="text-right">
                    <span class="text-slate-400">Nano-Dollars:</span>
                    <div class="font-mono text-slate-300" id="preview-cost-nano">0 nano</div>
                  </div>
                </div>

                <div class="flex gap-2">
                  <button onclick="sendBillableRequest()" id="btn-send-billable" class="flex-1 py-2.5 bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 font-bold rounded-lg text-xs shadow-lg shadow-cyan-500/10 flex items-center justify-center gap-2 transition">
                    <i class="fa-solid fa-paper-plane"></i> Execute Billable Request
                  </button>
                  <button onclick="replayBillableRequest()" class="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-medium rounded-lg text-xs flex items-center gap-1.5 transition" title="Send again with same Idempotency-Key">
                    <i class="fa-solid fa-repeat"></i> Replay
                  </button>
                </div>
              </div>
            </div>

            <!-- Response Inspector -->
            <div class="lg:col-span-6 space-y-4">
              <div class="bg-slate-950 p-4 rounded-xl border border-slate-800 h-full flex flex-col">
                <div class="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
                  <div class="flex items-center gap-2">
                    <span class="text-xs font-bold text-white">Live Response Inspector</span>
                    <span id="response-status-badge" class="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-800 text-slate-400">Idle</span>
                    <span id="response-replay-badge" class="hidden px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-950 text-amber-300 border border-amber-800">
                      ⚡ Replayed (0 new events)
                    </span>
                  </div>
                  <span class="text-[10px] font-mono text-slate-400" id="response-time">0 ms</span>
                </div>

                <div class="flex-1 bg-slate-900 p-3 rounded-lg border border-slate-800/80 font-mono text-xs overflow-auto max-h-[360px]" id="response-json">
                  <span class="text-slate-500">// Results from /v1/meter/billable will appear here...</span>
                </div>
              </div>
            </div>

          </div>
        </div>

        <!-- Tab 2: Boundary Honesty Lab -->
        <div id="tab-boundary" class="hidden space-y-6">
          <div class="bg-slate-950 p-6 rounded-xl border border-slate-800 max-w-3xl space-y-5">
            <div>
              <div class="flex items-center justify-between">
                <h3 class="text-base font-bold text-white flex items-center gap-2">
                  <i class="fa-solid fa-traffic-light text-amber-400"></i> Quota Boundary & Status Code Honesty (Section 12 Probe 2)
                </h3>
                <a href="/guides/quota-enforcement-and-http-boundaries" target="_blank" class="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1">
                  <i class="fa-solid fa-book-open"></i> Read Guide &rarr;
                </a>
              </div>
              <p class="text-xs text-slate-400 mt-1">
                The boundary rule is absolute: At 999 of 1,000 calls, call 1,000 must succeed (<code class="text-emerald-400">200 OK</code>).
                Call 1,001 must be blocked (<code class="text-red-400">429 Too Many Requests</code>).
                A lapsed plan must return <code class="text-amber-400">402 Payment Required</code>.
              </p>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div class="bg-slate-900 p-4 rounded-lg border border-slate-800 space-y-2">
                <div class="font-bold text-slate-200">1. Boundary Tenant (999/1k)</div>
                <p class="text-slate-400 text-[11px]">Drive Tenant 3 to exact quota (call 1,000) and verify the 1,001st call is rejected.</p>
                <button onclick="testBoundaryCall()" class="w-full py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded font-semibold transition">
                  Execute Boundary Call
                </button>
              </div>

              <div class="bg-slate-900 p-4 rounded-lg border border-slate-800 space-y-2">
                <div class="font-bold text-slate-200">2. Reset Boundary Tenant</div>
                <p class="text-slate-400 text-[11px]">Instantly reset Boundary Org back to 999 calls so you can repeat the boundary test anytime.</p>
                <button onclick="resetBoundaryTenant()" class="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded font-semibold transition">
                  <i class="fa-solid fa-rotate-left"></i> Reset to 999 Calls
                </button>
              </div>

              <div class="bg-slate-900 p-4 rounded-lg border border-slate-800 space-y-2">
                <div class="font-bold text-slate-200">3. Test 402 Payment Required</div>
                <p class="text-slate-400 text-[11px]">Send request to Tenant 4 (Lapsed subscription) and verify HTTP 402 response.</p>
                <button onclick="testLapsedCall()" class="w-full py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 rounded font-semibold transition">
                  Test Lapsed Status (402)
                </button>
              </div>
            </div>

            <div class="bg-slate-900 p-4 rounded-lg border border-slate-800 text-xs font-mono" id="boundary-log">
              <span class="text-slate-500">// Boundary test logs and HTTP status codes will be printed here...</span>
            </div>
          </div>
        </div>

        <!-- Tab 3: Stripe Webhook Simulator -->
        <div id="tab-webhooks" class="hidden space-y-6">
          <div class="bg-slate-950 p-6 rounded-xl border border-slate-800 max-w-3xl space-y-5">
            <div>
              <div class="flex items-center justify-between">
                <h3 class="text-base font-bold text-white flex items-center gap-2">
                  <i class="fa-brands fa-stripe text-indigo-400"></i> Stripe Test-Mode Webhook Simulator (Probe 3 & 4)
                </h3>
                <a href="/guides/stripe-webhooks-and-cryptographic-security" target="_blank" class="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1">
                  <i class="fa-solid fa-book-open"></i> Read Guide &rarr;
                </a>
              </div>
              <p class="text-xs text-slate-400 mt-1">
                Simulates authentic Stripe events with genuine HMAC-SHA256 signatures, testing signature verification, plan upgrades, and deduplication.
              </p>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div class="bg-slate-900 p-4 rounded-lg border border-slate-800 space-y-2">
                <div class="font-bold text-emerald-300 flex items-center gap-1.5">
                  <i class="fa-solid fa-arrow-up-right-dots"></i> 1. Upgrade Free &rarr; Pro
                </div>
                <p class="text-slate-400 text-[11px]">Dispatches valid signed <code class="text-slate-300">checkout.session.completed</code> to upgrade active tenant.</p>
                <button onclick="simulateStripeWebhook(false, false)" class="w-full py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 rounded font-semibold transition">
                  Trigger Signed Upgrade
                </button>
              </div>

              <div class="bg-slate-900 p-4 rounded-lg border border-slate-800 space-y-2">
                <div class="font-bold text-cyan-300 flex items-center gap-1.5">
                  <i class="fa-solid fa-clone"></i> 2. Replay Duplicate Event
                </div>
                <p class="text-slate-400 text-[11px]">Replays the exact same event ID twice. Must be deduplicated with <code class="text-cyan-300">200 duplicate_ignored</code>.</p>
                <button onclick="simulateStripeWebhook(true, false)" class="w-full py-2 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 rounded font-semibold transition">
                  Replay Last Event
                </button>
              </div>

              <div class="bg-slate-900 p-4 rounded-lg border border-slate-800 space-y-2">
                <div class="font-bold text-red-300 flex items-center gap-1.5">
                  <i class="fa-solid fa-ban"></i> 3. Test Forged Signature
                </div>
                <p class="text-slate-400 text-[11px]">Sends tampered signature. Must be rejected with <code class="text-red-400">400 Bad Request</code> and 0 database changes.</p>
                <button onclick="simulateStripeWebhook(false, true)" class="w-full py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 rounded font-semibold transition">
                  Test Forged Signature (400)
                </button>
              </div>
            </div>

            <div class="bg-slate-900 p-4 rounded-lg border border-slate-800 text-xs font-mono" id="webhook-log">
              <span class="text-slate-500">// Webhook verification logs will appear here...</span>
            </div>
          </div>
        </div>

      </div>
    </section>

    <!-- Recent Activity Feeds -->
    <section class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      
      <!-- Recent Usage Events Table -->
      <div class="bg-slate-900/60 border border-slate-800 rounded-xl p-5 shadow-lg space-y-3">
        <h3 class="text-sm font-bold text-white flex items-center justify-between">
          <span class="flex items-center gap-2"><i class="fa-solid fa-list-check text-cyan-400"></i> Recent Usage Events</span>
          <span class="text-[10px] text-slate-400 font-mono">Last 10 Events</span>
        </h3>
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs text-slate-300">
            <thead class="text-[10px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th class="pb-2">Time</th>
                <th class="pb-2">Tenant</th>
                <th class="pb-2">Tokens</th>
                <th class="pb-2">Cost (USD)</th>
                <th class="pb-2">Idempotency Key</th>
              </tr>
            </thead>
            <tbody id="usage-events-table" class="divide-y divide-slate-800/60 font-mono text-[11px]">
              <!-- Rendered via JS -->
            </tbody>
          </table>
        </div>
      </div>

      <!-- Recent Webhook Transactions -->
      <div class="bg-slate-900/60 border border-slate-800 rounded-xl p-5 shadow-lg space-y-3">
        <h3 class="text-sm font-bold text-white flex items-center justify-between">
          <span class="flex items-center gap-2"><i class="fa-solid fa-receipt text-indigo-400"></i> Processed Stripe Webhooks</span>
          <span class="text-[10px] text-slate-400 font-mono">Deduplication Feed</span>
        </h3>
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs text-slate-300">
            <thead class="text-[10px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th class="pb-2">Event ID</th>
                <th class="pb-2">Type</th>
                <th class="pb-2">Status</th>
                <th class="pb-2">Processed At</th>
              </tr>
            </thead>
            <tbody id="webhooks-table" class="divide-y divide-slate-800/60 font-mono text-[11px]">
              <!-- Rendered via JS -->
            </tbody>
          </table>
        </div>
      </div>

    </section>

  </main>

  <!-- Client-Side Dashboard Controller Script -->
  <script>
    let dashboardData = null;
    let selectedTenantId = "00000000-0000-0000-0000-000000000001";
    let lastEventId = null;

    // Initialize
    document.addEventListener("DOMContentLoaded", () => {
      generateRandomKey();
      updatePricingPreview();
      refreshData();
    });

    function generateRandomKey() {
      const key = "key-" + Math.random().toString(36).substring(2, 9) + "-" + Date.now();
      document.getElementById("input-idempotency-key").value = key;
    }

    function switchTab(tab) {
      document.getElementById("tab-metering").classList.toggle("hidden", tab !== "metering");
      document.getElementById("tab-boundary").classList.toggle("hidden", tab !== "boundary");
      document.getElementById("tab-webhooks").classList.toggle("hidden", tab !== "webhooks");

      const updateBtn = (btnId, active) => {
        const btn = document.getElementById(btnId);
        if (active) {
          btn.className = "px-4 py-3 text-sm font-semibold border-b-2 border-cyan-400 text-cyan-400 flex items-center gap-2 transition";
        } else {
          btn.className = "px-4 py-3 text-sm font-semibold border-b-2 border-transparent text-slate-400 hover:text-slate-200 flex items-center gap-2 transition";
        }
      };

      updateBtn("tab-btn-metering", tab === "metering");
      updateBtn("tab-btn-boundary", tab === "boundary");
      updateBtn("tab-btn-webhooks", tab === "webhooks");
    }

    function updatePricingPreview() {
      const fresh = parseInt(document.getElementById("input-fresh").value) || 0;
      const cached = parseInt(document.getElementById("input-cached").value) || 0;
      const output = parseInt(document.getElementById("input-output").value) || 0;
      const reasoning = parseInt(document.getElementById("input-reasoning").value) || 0;

      // Pinned Formula:
      // Fresh: 2000 nano | Cached: 500 nano | Output: 8000 nano | Reasoning: 8000 nano
      const totalNano = (fresh * 2000) + (cached * 500) + ((output + reasoning) * 8000);
      const usd = totalNano / 1000000000;

      document.getElementById("preview-cost-usd").innerText = "$" + usd.toFixed(6);
      document.getElementById("preview-cost-nano").innerText = totalNano.toLocaleString() + " nano";
    }

    async function refreshData() {
      const icon = document.getElementById("refresh-icon");
      if (icon) icon.classList.add("animate-spin");

      try {
        const res = await fetch("/v1/dashboard/overview");
        const json = await res.json();
        if (json.success) {
          dashboardData = json.data;
          renderDashboard();
          document.getElementById("last-updated").innerText = "Updated: " + new Date().toLocaleTimeString();
        }
      } catch (err) {
        console.error("Dashboard overview fetch error:", err);
      } finally {
        if (icon) icon.classList.remove("animate-spin");
      }
    }

    function selectTenant(tenantId) {
      selectedTenantId = tenantId;
      renderDashboard();
    }

    function renderDashboard() {
      if (!dashboardData) return;

      const tenants = dashboardData.tenants || [];
      const currentTenant = tenants.find(t => t.id === selectedTenantId) || tenants[0];

      // 1. Render Tenant Cards
      const cardsContainer = document.getElementById("tenant-cards");
      cardsContainer.innerHTML = tenants.map(t => {
        const isSelected = t.id === selectedTenantId;
        const borderClass = isSelected ? "border-cyan-400 bg-slate-900 shadow-md shadow-cyan-500/10" : "border-slate-800 bg-slate-900/50 hover:border-slate-700";
        const statusBadge = t.subscription.status === "ACTIVE" 
          ? '<span class="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">ACTIVE</span>'
          : '<span class="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-950 text-red-400 border border-red-800">' + t.subscription.status + '</span>';

        return \`
          <div onclick="selectTenant('\${t.id}')" class="cursor-pointer border rounded-xl p-3.5 transition space-y-2 \${borderClass}">
            <div class="flex items-center justify-between">
              <span class="font-bold text-xs text-white truncate max-w-[140px]">\${t.name}</span>
              \${statusBadge}
            </div>
            <div class="flex items-center justify-between text-[11px] text-slate-400">
              <span class="px-2 py-0.5 bg-slate-800 rounded font-semibold text-slate-200 uppercase">\${t.plan.name}</span>
              <span>Calls: \${t.usage.apiCalls.used} / \${t.usage.apiCalls.limit}</span>
            </div>
          </div>
        \`;
      }).join("");

      // 2. Render Quota Gauges for Current Tenant
      const gaugesContainer = document.getElementById("quota-gauges");
      if (currentTenant) {
        const calls = currentTenant.usage.apiCalls;
        const tokens = currentTenant.usage.tokens;
        const callsColor = calls.percentage >= 100 ? "bg-red-500" : (calls.percentage >= 80 ? "bg-amber-400" : "bg-cyan-400");
        const tokensColor = tokens.percentage >= 100 ? "bg-red-500" : (tokens.percentage >= 80 ? "bg-amber-400" : "bg-emerald-400");

        gaugesContainer.innerHTML = \`
          <div class="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-3">
            <div class="flex items-center justify-between">
              <span class="text-xs font-semibold text-slate-300">API Calls Quota</span>
              <span class="text-xs font-mono font-bold text-white">\${calls.used.toLocaleString()} / \${calls.limit.toLocaleString()}</span>
            </div>
            <div class="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
              <div class="\${callsColor} h-full rounded-full transition-all duration-500" style="width: \${calls.percentage}%"></div>
            </div>
            <div class="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>\${calls.percentage}% Consumed</span>
              <span>\${calls.remaining.toLocaleString()} Calls Left</span>
            </div>
          </div>

          <div class="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-3">
            <div class="flex items-center justify-between">
              <span class="text-xs font-semibold text-slate-300">AI Tokens Quota</span>
              <span class="text-xs font-mono font-bold text-white">\${tokens.used.toLocaleString()} / \${tokens.limit.toLocaleString()}</span>
            </div>
            <div class="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
              <div class="\${tokensColor} h-full rounded-full transition-all duration-500" style="width: \${tokens.percentage}%"></div>
            </div>
            <div class="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>\${tokens.percentage}% Consumed</span>
              <span>\${tokens.remaining.toLocaleString()} Tokens Left</span>
            </div>
          </div>

          <div class="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-2">
            <div class="text-xs font-semibold text-slate-300">Current Month Spend</div>
            <div class="text-2xl font-bold font-mono text-emerald-400">\${currentTenant.cost.formattedUsd}</div>
            <div class="text-[10px] text-slate-400 font-mono">
              Total Microcents: \${currentTenant.cost.costMicrocents}
            </div>
          </div>
        \`;
      }

      // 3. Render Usage Events Table
      const usageEvents = dashboardData.recentUsageEvents || [];
      const usageTbody = document.getElementById("usage-events-table");
      usageTbody.innerHTML = usageEvents.map(e => \`
        <tr class="hover:bg-slate-800/40 transition">
          <td class="py-2 text-slate-400">\${new Date(e.timestamp).toLocaleTimeString()}</td>
          <td class="py-2 text-slate-200 truncate max-w-[100px]">\${e.tenantName}</td>
          <td class="py-2 text-slate-300">\${e.totalTokens.toLocaleString()}</td>
          <td class="py-2 text-emerald-400 font-bold">\$\${(Number(e.costMicrocents) / 1000000).toFixed(6)}</td>
          <td class="py-2 text-slate-400 truncate max-w-[120px]" title="\${e.idempotencyKey}">\${e.idempotencyKey}</td>
        </tr>
      \`).join("");

      // 4. Render Webhook Events Table
      const webhooks = dashboardData.recentWebhooks || [];
      const webhooksTbody = document.getElementById("webhooks-table");
      webhooksTbody.innerHTML = webhooks.map(w => \`
        <tr class="hover:bg-slate-800/40 transition">
          <td class="py-2 text-cyan-400 truncate max-w-[120px]" title="\${w.stripeEventId}">\${w.stripeEventId}</td>
          <td class="py-2 text-slate-300">\${w.eventType}</td>
          <td class="py-2">
            <span class="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase \${w.status === "SUCCESS" ? "bg-emerald-950 text-emerald-400" : "bg-cyan-950 text-cyan-300"}">
              \${w.status}
            </span>
          </td>
          <td class="py-2 text-slate-400">\${new Date(w.processedAt).toLocaleTimeString()}</td>
        </tr>
      \`).join("");
    }

    // Execute Billable Request
    async function sendBillableRequest() {
      const idempotencyKey = document.getElementById("input-idempotency-key").value;
      const calls = parseInt(document.getElementById("input-calls").value) || 1;
      const fresh = parseInt(document.getElementById("input-fresh").value) || 0;
      const cached = parseInt(document.getElementById("input-cached").value) || 0;
      const output = parseInt(document.getElementById("input-output").value) || 0;
      const reasoning = parseInt(document.getElementById("input-reasoning").value) || 0;

      const payload = {
        action: "ai_generate",
        eventType: "ai_token",
        apiCallsCount: calls,
        tokens: {
          freshInput: fresh,
          cachedInput: cached,
          standardOutput: output,
          reasoning: reasoning,
        },
      };

      const startTime = performance.now();
      try {
        const res = await fetch("/v1/meter/billable", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Tenant-Id": selectedTenantId,
            "Idempotency-Key": idempotencyKey,
          },
          body: JSON.stringify(payload),
        });

        const elapsed = Math.round(performance.now() - startTime);
        const data = await res.json();
        const isReplay = res.headers.get("x-idempotent-replayed") === "true";

        displayResponse(res.status, isReplay, elapsed, data);
        refreshData();
      } catch (err) {
        displayResponse(500, false, 0, { error: err.message });
      }
    }

    function replayBillableRequest() {
      sendBillableRequest();
    }

    function displayResponse(status, isReplay, elapsed, json) {
      const badge = document.getElementById("response-status-badge");
      const replayBadge = document.getElementById("response-replay-badge");
      const timeElem = document.getElementById("response-time");
      const jsonElem = document.getElementById("response-json");

      badge.innerText = status + " " + (status === 200 ? "OK" : (status === 429 ? "Too Many Requests" : (status === 402 ? "Payment Required" : "Error")));
      badge.className = status === 200 
        ? "px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-950 text-emerald-400 border border-emerald-800"
        : "px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-red-950 text-red-400 border border-red-800";

      replayBadge.classList.toggle("hidden", !isReplay);
      timeElem.innerText = elapsed + " ms";
      jsonElem.innerHTML = "<pre class='text-slate-200'>" + JSON.stringify(json, null, 2) + "</pre>";
    }

    // Boundary Test Actions
    async function testBoundaryCall() {
      const boundaryTenantId = "00000000-0000-0000-0000-000000000003";
      selectTenant(boundaryTenantId);
      const log = document.getElementById("boundary-log");

      log.innerHTML = "<span class='text-cyan-400'>[Executing boundary test call...]</span><br>";

      const res = await fetch("/v1/meter/billable", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Tenant-Id": boundaryTenantId,
          "Idempotency-Key": "boundary-test-" + Date.now(),
        },
        body: JSON.stringify({ apiCallsCount: 1 }),
      });

      const data = await res.json();
      log.innerHTML += "<span class='" + (res.status === 200 ? "text-emerald-400 font-bold" : "text-red-400 font-bold") + "'>Response [" + res.status + "]:</span> <pre class='text-slate-300 mt-1'>" + JSON.stringify(data, null, 2) + "</pre>";
      refreshData();
    }

    async function resetBoundaryTenant() {
      const log = document.getElementById("boundary-log");
      log.innerHTML = "<span class='text-cyan-400'>[Resetting Boundary Org to 999 calls...]</span><br>";

      const res = await fetch("/v1/dashboard/reset-boundary", { method: "POST" });
      const data = await res.json();
      log.innerHTML += "<span class='text-emerald-400 font-bold'>Success:</span> " + data.message;
      refreshData();
    }

    async function testLapsedCall() {
      const lapsedTenantId = "00000000-0000-0000-0000-000000000004";
      selectTenant(lapsedTenantId);
      const log = document.getElementById("boundary-log");

      log.innerHTML = "<span class='text-amber-400'>[Testing Lapsed Plan (Expect HTTP 402)...]</span><br>";

      const res = await fetch("/v1/meter/billable", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Tenant-Id": lapsedTenantId,
          "Idempotency-Key": "lapsed-test-" + Date.now(),
        },
        body: JSON.stringify({ apiCallsCount: 1 }),
      });

      const data = await res.json();
      log.innerHTML += "<span class='text-amber-400 font-bold'>Response [" + res.status + " Payment Required]:</span> <pre class='text-slate-300 mt-1'>" + JSON.stringify(data, null, 2) + "</pre>";
      refreshData();
    }

    // Stripe Webhook Simulations
    async function simulateStripeWebhook(isDuplicate, isForged) {
      const log = document.getElementById("webhook-log");
      log.innerHTML = "<span class='text-indigo-400'>[Dispatched simulated webhook...]</span><br>";

      const body = {
        tenantId: selectedTenantId,
        type: "checkout.session.completed",
        isDuplicate: isDuplicate,
        isForged: isForged,
        reusedEventId: isDuplicate ? lastEventId : null,
      };

      try {
        const res = await fetch("/v1/dashboard/simulate-webhook", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        const data = await res.json();
        if (data.eventId) lastEventId = data.eventId;

        const colorClass = res.status === 200 ? "text-emerald-400 font-bold" : "text-red-400 font-bold";
        log.innerHTML += "<span class='" + colorClass + "'>Response [" + res.status + "]:</span> <pre class='text-slate-300 mt-1'>" + JSON.stringify(data, null, 2) + "</pre>";
        refreshData();
      } catch (err) {
        log.innerHTML += "<span class='text-red-400'>Error: " + err.message + "</span>";
      }
    }
  </script>
</body>
</html>`;

    res.setHeader("Content-Type", "text/html");
    res.status(200).send(html);
  }
}
