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
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
  <script>
    tailwind.config = {
      theme: {
        extend: {
          fontFamily: {
            sans: ['"Plus Jakarta Sans"', 'sans-serif'],
            mono: ['"JetBrains Mono"', 'monospace'],
          },
          colors: {
            obsidian: {
              950: '#070809',
              900: '#0c0d10',
              850: '#111317',
              800: '#171920',
              750: '#1d2029',
              700: '#232631',
              600: '#2e323e',
            },
            champagne: {
              50: '#fbf8f0',
              100: '#f6f1de',
              200: '#eddcb3',
              300: '#e3c583',
              400: '#d9ad54',
              500: '#cda03e',
              600: '#b0822f',
              700: '#8c6326',
            },
            sand: {
              100: '#f7f6f2',
              200: '#e8e6df',
              300: '#d2cfc4',
              400: '#9d998c',
              500: '#6d695e',
            }
          }
        }
      }
    }
  </script>
  <style>
    body {
      background-color: #08090b;
      color: #e6e4df;
      font-family: 'Plus Jakarta Sans', sans-serif;
    }
    .gold-gradient-text {
      background: linear-gradient(135deg, #fcedcb 0%, #d8b261 50%, #b88a32 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .gold-subtle-glow {
      box-shadow: 0 0 25px -4px rgba(216, 178, 97, 0.15);
    }
    ::-webkit-scrollbar { width: 6px; height: 6px; }
    ::-webkit-scrollbar-track { background: #08090b; }
    ::-webkit-scrollbar-thumb { background: #232631; border-radius: 3px; }
    ::-webkit-scrollbar-thumb:hover { background: #323645; }
  </style>
</head>
<body class="min-h-screen selection:bg-champagne-400 selection:text-obsidian-950 flex flex-col justify-between antialiased">
  
  <!-- Navigation Header with Breadcrumbs -->
  <header class="border-b border-obsidian-750 bg-obsidian-950/85 backdrop-blur-md sticky top-0 z-50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex flex-wrap justify-between items-center gap-4">
      
      <!-- Brand & Breadcrumb -->
      <div class="flex items-center gap-3">
        <a href="/" class="w-9 h-9 rounded-xl bg-gradient-to-br from-champagne-300 via-champagne-500 to-champagne-700 p-[1px] flex items-center justify-center text-obsidian-950 shadow-md shadow-champagne-500/10">
          <div class="w-full h-full bg-obsidian-950 rounded-[10px] flex items-center justify-center text-champagne-300 hover:text-champagne-200 transition">
            <i class="fa-solid fa-bolt-lightning text-sm"></i>
          </div>
        </a>
        <div class="flex items-center gap-2 text-xs">
          <a href="/" class="text-sand-400 hover:text-champagne-300 font-medium transition">Home</a>
          <span class="text-obsidian-600">/</span>
          <span class="text-sand-100 font-bold">Interactive Testing Console</span>
          <span class="ml-2 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-obsidian-800 text-champagne-300 border border-champagne-500/30 hidden sm:inline-block">
            Section 12 Probes
          </span>
        </div>
      </div>

      <!-- Action Buttons & Quick Links -->
      <div class="flex items-center gap-2 sm:gap-3 text-xs">
        <a href="/guides" target="_blank" class="px-3 py-1.5 bg-obsidian-850 hover:bg-obsidian-800 text-sand-200 border border-obsidian-700 hover:border-champagne-500/40 rounded-lg flex items-center gap-1.5 font-semibold transition">
          <i class="fa-solid fa-book-open text-champagne-400"></i> Architecture Guides
        </a>
        <button onclick="refreshData()" class="px-3 py-1.5 bg-obsidian-850 hover:bg-obsidian-800 text-sand-200 border border-obsidian-700 rounded-lg flex items-center gap-1.5 transition">
          <i class="fa-solid fa-arrows-rotate text-sand-400" id="refresh-icon"></i> Refresh
        </button>
        <a href="/docs" target="_blank" class="px-3 py-1.5 bg-obsidian-850 hover:bg-obsidian-800 text-sand-300 border border-obsidian-700 rounded-lg flex items-center gap-1.5 transition">
          <i class="fa-solid fa-file-code text-sand-400"></i> OpenAPI Specs
        </a>
        <a href="https://github.com/abubakar-ahmed-dev/meterflow-billing-engine" target="_blank" class="px-3 py-1.5 bg-obsidian-850 hover:bg-obsidian-800 text-sand-400 hover:text-sand-200 border border-obsidian-700 rounded-lg flex items-center gap-1.5 transition">
          <i class="fa-brands fa-github text-sm"></i>
        </a>
      </div>

    </div>
  </header>

  <!-- Main Content Body -->
  <main class="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8 flex-1">
    
    <!-- Quota Alerts Banner (if triggered) -->
    <div id="alerts-banner" class="hidden space-y-2"></div>

    <!-- Page Title & Overview Banner -->
    <div class="bg-obsidian-900 border border-obsidian-750 rounded-2xl p-6 sm:p-7 flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div class="space-y-1.5">
        <div class="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-champagne-400">
          <i class="fa-solid fa-vial-circle-check"></i> Verification Sandbox
        </div>
        <h1 class="text-2xl sm:text-3xl font-extrabold text-sand-100 tracking-tight">
          Interactive Testing Console
        </h1>
        <p class="text-xs sm:text-sm text-sand-300 max-w-2xl leading-relaxed">
          Select an active tenant scenario below to execute billable token requests, simulate Stripe webhooks, and inspect real-time boundary quota enforcement.
        </p>
      </div>
      <div class="text-left md:text-right font-mono text-xs text-sand-400">
        <div>Engine Mode: <span class="text-champagne-300 font-semibold">Dual Offline / Live</span></div>
        <div class="mt-0.5" id="last-updated">Status: Ready</div>
      </div>
    </div>

    <!-- STEP 1: Select Active Tenant Scenario -->
    <section class="space-y-3">
      <div class="flex items-center justify-between">
        <h2 class="text-xs font-bold uppercase tracking-wider text-sand-300 flex items-center gap-2">
          <span class="w-5 h-5 rounded-full bg-champagne-500/20 text-champagne-400 border border-champagne-500/30 flex items-center justify-center text-[10px] font-bold">1</span>
          Select Active Tenant Test Scenario
        </h2>
        <span class="text-[11px] text-sand-400">Click a card to switch tenant context</span>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5" id="tenant-cards">
        <!-- Rendered dynamically via JS -->
      </div>
    </section>

    <!-- STEP 2: Real-time Quota & Metrics for Selected Tenant -->
    <section class="space-y-3">
      <div class="flex items-center justify-between">
        <h2 class="text-xs font-bold uppercase tracking-wider text-sand-300 flex items-center gap-2">
          <span class="w-5 h-5 rounded-full bg-champagne-500/20 text-champagne-400 border border-champagne-500/30 flex items-center justify-center text-[10px] font-bold">2</span>
          Live Quota & Spend Gauges
        </h2>
        <span class="text-[11px] text-sand-400">Zero-float integer nano-dollar accounting</span>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4" id="quota-gauges">
        <!-- Rendered dynamically via JS -->
      </div>
    </section>

    <!-- STEP 3: Acceptance Probe Testing Labs -->
    <section class="space-y-3">
      <div class="flex items-center justify-between">
        <h2 class="text-xs font-bold uppercase tracking-wider text-sand-300 flex items-center gap-2">
          <span class="w-5 h-5 rounded-full bg-champagne-500/20 text-champagne-400 border border-champagne-500/30 flex items-center justify-center text-[10px] font-bold">3</span>
          Section 12 Acceptance Probe Laboratories
        </h2>
        <span class="text-[11px] text-sand-400">Select a lab below to execute live probes</span>
      </div>

      <div class="bg-obsidian-900 border border-obsidian-750 rounded-2xl overflow-hidden shadow-xl">
        
        <!-- Lab Tabs Switcher -->
        <div class="border-b border-obsidian-750 bg-obsidian-950/80 px-4 sm:px-6 flex flex-wrap gap-2">
          <button onclick="switchTab('metering')" id="tab-btn-metering" class="px-4 py-3.5 text-xs font-bold border-b-2 border-champagne-400 text-champagne-300 flex items-center gap-2 transition">
            <i class="fa-solid fa-calculator text-champagne-400"></i> Probes 1 & 5: Usage Metering & Token Pricing Lab
          </button>
          <button onclick="switchTab('boundary')" id="tab-btn-boundary" class="px-4 py-3.5 text-xs font-semibold border-b-2 border-transparent text-sand-400 hover:text-sand-200 flex items-center gap-2 transition">
            <i class="fa-solid fa-shield-halved text-sand-400"></i> Probe 2: Quota Boundary Honesty (429 / 402)
          </button>
          <button onclick="switchTab('webhooks')" id="tab-btn-webhooks" class="px-4 py-3.5 text-xs font-semibold border-b-2 border-transparent text-sand-400 hover:text-sand-200 flex items-center gap-2 transition">
            <i class="fa-brands fa-stripe text-sand-400"></i> Probes 3 & 4: Stripe Webhook Simulator
          </button>
        </div>

        <div class="p-6 sm:p-8">
          
          <!-- TAB 1: Metering & Token Pricing -->
          <div id="tab-metering" class="space-y-6">
            <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              <!-- Input Form Controls -->
              <div class="lg:col-span-6 space-y-4">
                <div class="bg-obsidian-950 p-5 rounded-xl border border-obsidian-750 space-y-4">
                  <div class="flex items-center justify-between border-b border-obsidian-750 pb-3">
                    <div>
                      <h3 class="text-sm font-bold text-sand-100 flex items-center gap-2">
                        <i class="fa-solid fa-sliders text-champagne-400"></i> Billable Request Parameters
                      </h3>
                      <p class="text-[11px] text-sand-400">POST /v1/meter/billable</p>
                    </div>
                    <a href="/guides/exactly-once-metering-and-idempotency" target="_blank" class="text-xs text-champagne-400 hover:text-champagne-300 flex items-center gap-1" title="Read guide on exactly-once idempotency">
                      <i class="fa-solid fa-book-open text-[10px]"></i> Guide #1
                    </a>
                  </div>

                  <div class="space-y-3.5 text-xs">
                    <div>
                      <div class="flex items-center justify-between mb-1.5">
                        <label class="text-sand-300 font-semibold">Idempotency Key (Guarantees Exactly-Once)</label>
                        <span class="text-[10px] text-sand-400 font-mono">Unique per operation</span>
                      </div>
                      <div class="flex gap-2">
                        <input type="text" id="input-idempotency-key" class="flex-1 bg-obsidian-900 border border-obsidian-700 rounded-lg px-3 py-2 text-sand-100 font-mono text-xs focus:outline-none focus:border-champagne-400 transition">
                        <button onclick="generateRandomKey()" class="px-3.5 py-2 bg-obsidian-800 hover:bg-obsidian-750 border border-obsidian-700 rounded-lg text-sand-200 font-medium transition" title="Generate New Unique Key">
                          <i class="fa-solid fa-dice text-champagne-400"></i> New
                        </button>
                      </div>
                    </div>

                    <div>
                      <label class="block text-sand-300 font-semibold mb-1">API Calls Count</label>
                      <input type="number" id="input-calls" value="1" min="0" class="w-full bg-obsidian-900 border border-obsidian-700 rounded-lg px-3 py-2 text-sand-100 font-mono text-xs focus:outline-none focus:border-champagne-400">
                    </div>

                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div>
                        <div class="flex items-center justify-between mb-1">
                          <label class="text-sand-300 font-semibold">Fresh Input Tokens</label>
                          <span class="text-[10px] text-sand-400 font-mono">$2.00 / 1M</span>
                        </div>
                        <input type="number" id="input-fresh" value="1000" min="0" step="100" oninput="updatePricingPreview()" class="w-full bg-obsidian-900 border border-obsidian-700 rounded-lg px-3 py-2 text-sand-100 font-mono text-xs focus:outline-none focus:border-champagne-400">
                        <span class="text-[10px] text-sand-400">2,000 nano / token</span>
                      </div>

                      <div>
                        <div class="flex items-center justify-between mb-1">
                          <label class="text-sand-300 font-semibold">Cached Input Tokens</label>
                          <span class="text-[10px] text-champagne-300 font-mono">75% Off</span>
                        </div>
                        <input type="number" id="input-cached" value="400" min="0" step="100" oninput="updatePricingPreview()" class="w-full bg-obsidian-900 border border-obsidian-700 rounded-lg px-3 py-2 text-sand-100 font-mono text-xs focus:outline-none focus:border-champagne-400">
                        <span class="text-[10px] text-champagne-400">500 nano ($0.50 / 1M)</span>
                      </div>

                      <div>
                        <div class="flex items-center justify-between mb-1">
                          <label class="text-sand-300 font-semibold">Standard Output Tokens</label>
                          <span class="text-[10px] text-sand-400 font-mono">$8.00 / 1M</span>
                        </div>
                        <input type="number" id="input-output" value="500" min="0" step="100" oninput="updatePricingPreview()" class="w-full bg-obsidian-900 border border-obsidian-700 rounded-lg px-3 py-2 text-sand-100 font-mono text-xs focus:outline-none focus:border-champagne-400">
                        <span class="text-[10px] text-sand-400">8,000 nano / token</span>
                      </div>

                      <div>
                        <div class="flex items-center justify-between mb-1">
                          <label class="text-sand-300 font-semibold">Reasoning Tokens</label>
                          <span class="text-[10px] text-sand-400 font-mono">Output Rate</span>
                        </div>
                        <input type="number" id="input-reasoning" value="200" min="0" step="100" oninput="updatePricingPreview()" class="w-full bg-obsidian-900 border border-obsidian-700 rounded-lg px-3 py-2 text-sand-100 font-mono text-xs focus:outline-none focus:border-champagne-400">
                        <span class="text-[10px] text-sand-400">Billed as output (8,000 nano)</span>
                      </div>
                    </div>
                  </div>

                  <!-- Instant Price Preview (BigInt Nano-Dollar Formula) -->
                  <div class="bg-obsidian-900 p-3.5 rounded-lg border border-obsidian-750 flex items-center justify-between text-xs">
                    <div>
                      <span class="text-sand-400 text-[11px]">Projected Cost:</span>
                      <div class="font-mono text-base font-extrabold text-champagne-300" id="preview-cost-usd">$0.000000</div>
                    </div>
                    <div class="text-right">
                      <span class="text-sand-400 text-[11px]">Nano-Dollars (10⁻⁹ USD):</span>
                      <div class="font-mono text-sand-200" id="preview-cost-nano">0 nano</div>
                    </div>
                  </div>

                  <!-- Action Buttons -->
                  <div class="flex gap-2 pt-1">
                    <button onclick="sendBillableRequest()" id="btn-send-billable" class="flex-1 py-3 bg-gradient-to-r from-champagne-400 via-champagne-500 to-champagne-600 hover:from-champagne-300 hover:to-champagne-500 text-obsidian-950 font-extrabold rounded-lg text-xs shadow-lg shadow-champagne-500/10 flex items-center justify-center gap-2 transition">
                      <i class="fa-solid fa-paper-plane"></i> Execute Billable Request
                    </button>
                    <button onclick="replayBillableRequest()" class="px-4 py-3 bg-obsidian-850 hover:bg-obsidian-800 border border-obsidian-700 text-sand-200 font-semibold rounded-lg text-xs flex items-center gap-1.5 transition" title="Replay with identical Idempotency-Key">
                      <i class="fa-solid fa-repeat text-champagne-400"></i> Replay
                    </button>
                  </div>
                </div>
              </div>

              <!-- Live Response Inspector -->
              <div class="lg:col-span-6 space-y-4">
                <div class="bg-obsidian-950 p-5 rounded-xl border border-obsidian-750 h-full flex flex-col min-h-[440px]">
                  <div class="flex items-center justify-between border-b border-obsidian-750 pb-3 mb-3">
                    <div class="flex items-center gap-2">
                      <span class="text-xs font-bold text-sand-100">Live Response Inspector</span>
                      <span id="response-status-badge" class="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-obsidian-800 text-sand-400 border border-obsidian-700">Idle</span>
                      <span id="response-replay-badge" class="hidden px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-champagne-500/20 text-champagne-300 border border-champagne-500/40">
                        ⚡ Replayed (0 new events)
                      </span>
                    </div>
                    <span class="text-[11px] font-mono text-sand-400" id="response-time">0 ms</span>
                  </div>

                  <div class="flex-1 bg-obsidian-900 p-4 rounded-lg border border-obsidian-750 font-mono text-xs overflow-auto max-h-[380px]" id="response-json">
                    <span class="text-sand-500">// Response payload from /v1/meter/billable will appear here...</span>
                  </div>
                </div>
              </div>

            </div>
          </div>

          <!-- TAB 2: Quota Boundary Honesty (Section 12 Probe 2) -->
          <div id="tab-boundary" class="hidden space-y-6">
            <div class="bg-obsidian-950 p-6 rounded-xl border border-obsidian-750 max-w-4xl space-y-5">
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-obsidian-750 pb-4">
                <div>
                  <h3 class="text-base font-bold text-sand-100 flex items-center gap-2">
                    <i class="fa-solid fa-traffic-light text-champagne-400"></i> Quota Boundary & Status Code Honesty (Section 12 Probe 2)
                  </h3>
                  <p class="text-xs text-sand-400 mt-1">
                    At 999 of 1,000 calls, call 1,000 must succeed (<code class="text-champagne-300 font-mono">200 OK</code>). Call 1,001 must be rejected (<code class="text-rose-400 font-mono">429 Too Many Requests</code>). Delinquent plans must return <code class="text-amber-400 font-mono">402 Payment Required</code>.
                  </p>
                </div>
                <a href="/guides/quota-enforcement-and-http-boundaries" target="_blank" class="text-xs text-champagne-400 hover:text-champagne-300 font-semibold flex items-center gap-1 whitespace-nowrap">
                  <i class="fa-solid fa-book-open"></i> Read Guide #2 &rarr;
                </a>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                
                <div class="bg-obsidian-900 p-4 rounded-xl border border-obsidian-750 space-y-2 flex flex-col justify-between">
                  <div class="space-y-1.5">
                    <div class="font-bold text-sand-100 flex items-center gap-1.5">
                      <i class="fa-solid fa-gauge text-champagne-400"></i> 1. Boundary Call (Tenant 3)
                    </div>
                    <p class="text-sand-400 text-[11px] leading-relaxed">
                      Sends 1 API call to Boundary Org. If at 999, call 1,000 passes. The subsequent call returns 429 Too Many Requests.
                    </p>
                  </div>
                  <button onclick="testBoundaryCall()" class="w-full py-2.5 bg-champagne-500/20 hover:bg-champagne-500/30 text-champagne-300 border border-champagne-500/40 rounded-lg font-bold transition">
                    Execute Boundary Call
                  </button>
                </div>

                <div class="bg-obsidian-900 p-4 rounded-xl border border-obsidian-750 space-y-2 flex flex-col justify-between">
                  <div class="space-y-1.5">
                    <div class="font-bold text-sand-100 flex items-center gap-1.5">
                      <i class="fa-solid fa-rotate-left text-sand-400"></i> 2. Reset Boundary Org
                    </div>
                    <p class="text-sand-400 text-[11px] leading-relaxed">
                      Instantly restores Boundary Org back to exactly 999 calls so judges and evaluators can repeat Probe 2 endlessly.
                    </p>
                  </div>
                  <button onclick="resetBoundaryTenant()" class="w-full py-2.5 bg-obsidian-800 hover:bg-obsidian-750 text-sand-200 border border-obsidian-700 rounded-lg font-semibold transition">
                    Reset to 999 Calls
                  </button>
                </div>

                <div class="bg-obsidian-900 p-4 rounded-xl border border-obsidian-750 space-y-2 flex flex-col justify-between">
                  <div class="space-y-1.5">
                    <div class="font-bold text-sand-100 flex items-center gap-1.5">
                      <i class="fa-solid fa-credit-card text-amber-400"></i> 3. Test Lapsed Status (402)
                    </div>
                    <p class="text-sand-400 text-[11px] leading-relaxed">
                      Dispatches a call to Tenant 4 (PAST_DUE subscription) and verifies immediate HTTP 402 rejection.
                    </p>
                  </div>
                  <button onclick="testLapsedCall()" class="w-full py-2.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-lg font-bold transition">
                    Test 402 Lapsed Plan
                  </button>
                </div>

              </div>

              <!-- Boundary Execution Log Terminal -->
              <div class="bg-obsidian-900 p-4 rounded-xl border border-obsidian-750 text-xs font-mono min-h-[140px] overflow-auto" id="boundary-log">
                <span class="text-sand-500">// Boundary test logs and HTTP status codes will be printed here...</span>
              </div>
            </div>
          </div>

          <!-- TAB 3: Stripe Webhook Simulator (Probes 3 & 4) -->
          <div id="tab-webhooks" class="hidden space-y-6">
            <div class="bg-obsidian-950 p-6 rounded-xl border border-obsidian-750 max-w-4xl space-y-5">
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-obsidian-750 pb-4">
                <div>
                  <h3 class="text-base font-bold text-sand-100 flex items-center gap-2">
                    <i class="fa-brands fa-stripe text-champagne-400"></i> Stripe Webhook Simulator (Probes 3 & 4)
                  </h3>
                  <p class="text-xs text-sand-400 mt-1">
                    Simulates authentic Stripe events with genuine HMAC-SHA256 signatures, testing signature verification, plan upgrades, and duplicate event deduplication.
                  </p>
                </div>
                <a href="/guides/stripe-webhooks-and-cryptographic-security" target="_blank" class="text-xs text-champagne-400 hover:text-champagne-300 font-semibold flex items-center gap-1 whitespace-nowrap">
                  <i class="fa-solid fa-book-open"></i> Read Guide #3 &rarr;
                </a>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                
                <div class="bg-obsidian-900 p-4 rounded-xl border border-obsidian-750 space-y-2 flex flex-col justify-between">
                  <div class="space-y-1.5">
                    <div class="font-bold text-champagne-300 flex items-center gap-1.5">
                      <i class="fa-solid fa-arrow-up-right-dots"></i> 1. Upgrade Free &rarr; Pro
                    </div>
                    <p class="text-sand-400 text-[11px] leading-relaxed">
                      Sends valid signed <code class="text-sand-200">checkout.session.completed</code> event to upgrade active tenant tier to Pro.
                    </p>
                  </div>
                  <button onclick="simulateStripeWebhook(false, false)" class="w-full py-2.5 bg-champagne-500/20 hover:bg-champagne-500/30 text-champagne-300 border border-champagne-500/40 rounded-lg font-bold transition">
                    Trigger Signed Upgrade
                  </button>
                </div>

                <div class="bg-obsidian-900 p-4 rounded-xl border border-obsidian-750 space-y-2 flex flex-col justify-between">
                  <div class="space-y-1.5">
                    <div class="font-bold text-sand-200 flex items-center gap-1.5">
                      <i class="fa-solid fa-clone text-champagne-400"></i> 2. Replay Duplicate Event
                    </div>
                    <p class="text-sand-400 text-[11px] leading-relaxed">
                      Dispatches the exact same event ID twice to prove idempotent ledger deduplication with <code class="text-champagne-300">200 duplicate_ignored</code>.
                    </p>
                  </div>
                  <button onclick="simulateStripeWebhook(true, false)" class="w-full py-2.5 bg-obsidian-800 hover:bg-obsidian-750 text-sand-200 border border-obsidian-700 rounded-lg font-semibold transition">
                    Replay Last Event
                  </button>
                </div>

                <div class="bg-obsidian-900 p-4 rounded-xl border border-obsidian-750 space-y-2 flex flex-col justify-between">
                  <div class="space-y-1.5">
                    <div class="font-bold text-rose-400 flex items-center gap-1.5">
                      <i class="fa-solid fa-ban"></i> 3. Test Forged Signature
                    </div>
                    <p class="text-sand-400 text-[11px] leading-relaxed">
                      Sends a tampered HMAC signature to prove rejection with <code class="text-rose-400">400 Bad Request</code> and 0 database state changes.
                    </p>
                  </div>
                  <button onclick="simulateStripeWebhook(false, true)" class="w-full py-2.5 bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 rounded-lg font-bold transition">
                    Test Forged Signature (400)
                  </button>
                </div>

              </div>

              <!-- Webhook Execution Log Terminal -->
              <div class="bg-obsidian-900 p-4 rounded-xl border border-obsidian-750 text-xs font-mono min-h-[140px] overflow-auto" id="webhook-log">
                <span class="text-sand-500">// Webhook verification logs will appear here...</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>

    <!-- STEP 4: Historical Activity & Audit Ledger (Collapsible / Clean) -->
    <section class="space-y-3">
      <div class="flex items-center justify-between">
        <h2 class="text-xs font-bold uppercase tracking-wider text-sand-300 flex items-center gap-2">
          <span class="w-5 h-5 rounded-full bg-champagne-500/20 text-champagne-400 border border-champagne-500/30 flex items-center justify-center text-[10px] font-bold">4</span>
          Activity & Audit Ledger
        </h2>
        <div class="flex gap-2">
          <button onclick="toggleLedgerTab('usage')" id="ledger-btn-usage" class="px-3 py-1 rounded text-xs font-semibold bg-obsidian-800 text-champagne-300 border border-champagne-500/30">
            Usage Events
          </button>
          <button onclick="toggleLedgerTab('webhooks')" id="ledger-btn-webhooks" class="px-3 py-1 rounded text-xs font-medium text-sand-400 hover:text-sand-200">
            Stripe Webhooks
          </button>
        </div>
      </div>

      <div class="bg-obsidian-900 border border-obsidian-750 rounded-2xl p-5 shadow-lg">
        
        <!-- Usage Events Table -->
        <div id="ledger-table-usage" class="overflow-x-auto">
          <table class="w-full text-left text-xs text-sand-300">
            <thead class="text-[10px] uppercase tracking-wider text-sand-400 border-b border-obsidian-750">
              <tr>
                <th class="pb-3">Timestamp</th>
                <th class="pb-3">Tenant Name</th>
                <th class="pb-3">Total Tokens</th>
                <th class="pb-3">Accrued Cost (USD)</th>
                <th class="pb-3">Idempotency Key</th>
              </tr>
            </thead>
            <tbody id="usage-events-table" class="divide-y divide-obsidian-800 font-mono text-[11px]">
              <!-- Rendered via JS -->
            </tbody>
          </table>
        </div>

        <!-- Webhooks Table -->
        <div id="ledger-table-webhooks" class="hidden overflow-x-auto">
          <table class="w-full text-left text-xs text-sand-300">
            <thead class="text-[10px] uppercase tracking-wider text-sand-400 border-b border-obsidian-750">
              <tr>
                <th class="pb-3">Stripe Event ID</th>
                <th class="pb-3">Event Type</th>
                <th class="pb-3">Verification Status</th>
                <th class="pb-3">Processed At</th>
              </tr>
            </thead>
            <tbody id="webhooks-table" class="divide-y divide-obsidian-800 font-mono text-[11px]">
              <!-- Rendered via JS -->
            </tbody>
          </table>
        </div>

      </div>
    </section>

  </main>

  <!-- Global Footer -->
  <footer class="border-t border-obsidian-800 bg-obsidian-950 text-sand-400 text-xs py-8 mt-12">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
      <div class="flex items-center gap-2">
        <span class="text-champagne-400 font-bold">⚡ MeterFlow Engine</span>
        <span class="text-sand-500">|</span>
        <span class="text-sand-400">Interactive Testing Sandbox</span>
      </div>
      <div class="flex items-center gap-4 text-sand-300">
        <a href="/" class="hover:text-champagne-300 transition">Home</a>
        <a href="/guides" class="hover:text-champagne-300 transition">Guides</a>
        <a href="/docs" target="_blank" class="hover:text-champagne-300 transition">API Specs</a>
        <a href="/health" target="_blank" class="hover:text-champagne-300 transition">Health</a>
      </div>
    </div>
  </footer>

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
          btn.className = "px-4 py-3.5 text-xs font-bold border-b-2 border-champagne-400 text-champagne-300 flex items-center gap-2 transition";
        } else {
          btn.className = "px-4 py-3.5 text-xs font-semibold border-b-2 border-transparent text-sand-400 hover:text-sand-200 flex items-center gap-2 transition";
        }
      };

      updateBtn("tab-btn-metering", tab === "metering");
      updateBtn("tab-btn-boundary", tab === "boundary");
      updateBtn("tab-btn-webhooks", tab === "webhooks");
    }

    function toggleLedgerTab(tab) {
      document.getElementById("ledger-table-usage").classList.toggle("hidden", tab !== "usage");
      document.getElementById("ledger-table-webhooks").classList.toggle("hidden", tab !== "webhooks");

      const btnUsage = document.getElementById("ledger-btn-usage");
      const btnWebhooks = document.getElementById("ledger-btn-webhooks");

      if (tab === "usage") {
        btnUsage.className = "px-3 py-1 rounded text-xs font-semibold bg-obsidian-800 text-champagne-300 border border-champagne-500/30";
        btnWebhooks.className = "px-3 py-1 rounded text-xs font-medium text-sand-400 hover:text-sand-200";
      } else {
        btnWebhooks.className = "px-3 py-1 rounded text-xs font-semibold bg-obsidian-800 text-champagne-300 border border-champagne-500/30";
        btnUsage.className = "px-3 py-1 rounded text-xs font-medium text-sand-400 hover:text-sand-200";
      }
    }

    function updatePricingPreview() {
      const fresh = parseInt(document.getElementById("input-fresh").value) || 0;
      const cached = parseInt(document.getElementById("input-cached").value) || 0;
      const output = parseInt(document.getElementById("input-output").value) || 0;
      const reasoning = parseInt(document.getElementById("input-reasoning").value) || 0;

      // Pinned Formula:
      // Fresh: 2,000 nano | Cached: 500 nano | Output: 8,000 nano | Reasoning: 8,000 nano
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

      // 1. Render Tenant Cards with Scenario Explanations
      const cardsContainer = document.getElementById("tenant-cards");
      cardsContainer.innerHTML = tenants.map(t => {
        const isSelected = t.id === selectedTenantId;
        const borderClass = isSelected 
          ? "border-champagne-400/80 bg-obsidian-850 shadow-lg shadow-champagne-500/10" 
          : "border-obsidian-750 bg-obsidian-900/60 hover:border-obsidian-700";
        
        let scenarioLabel = "Standard Scenario";
        if (t.id.endsWith("0001")) scenarioLabel = "Scenario A: Free Plan";
        else if (t.id.endsWith("0002")) scenarioLabel = "Scenario B: Pro Plan";
        else if (t.id.endsWith("0003")) scenarioLabel = "Scenario C: Boundary (999)";
        else if (t.id.endsWith("0004")) scenarioLabel = "Scenario D: Past Due (402)";

        const statusBadge = t.subscription.status === "ACTIVE" 
          ? '<span class="px-1.5 py-0.5 rounded text-[10px] font-bold bg-champagne-500/20 text-champagne-300 border border-champagne-500/30">ACTIVE</span>'
          : '<span class="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">' + t.subscription.status + '</span>';

        return \`
          <div onclick="selectTenant('\${t.id}')" class="cursor-pointer border rounded-xl p-3.5 transition space-y-2.5 \${borderClass}">
            <div class="flex items-center justify-between">
              <span class="text-[10px] font-bold uppercase tracking-wider text-champagne-400 font-mono">\${scenarioLabel}</span>
              \${statusBadge}
            </div>
            <div class="font-bold text-xs text-sand-100 truncate">\${t.name}</div>
            <div class="flex items-center justify-between text-[11px] text-sand-400 pt-1 border-t border-obsidian-750">
              <span class="px-2 py-0.5 bg-obsidian-800 rounded font-semibold text-sand-300 uppercase text-[10px]">\${t.plan.name}</span>
              <span class="font-mono text-[10px]">\${t.usage.apiCalls.used} / \${t.usage.apiCalls.limit} calls</span>
            </div>
          </div>
        \`;
      }).join("");

      // 2. Render Quota Gauges for Current Tenant
      const gaugesContainer = document.getElementById("quota-gauges");
      if (currentTenant) {
        const calls = currentTenant.usage.apiCalls;
        const tokens = currentTenant.usage.tokens;
        const callsBarColor = calls.percentage >= 100 ? "bg-rose-500" : (calls.percentage >= 80 ? "bg-amber-400" : "bg-champagne-400");
        const tokensBarColor = tokens.percentage >= 100 ? "bg-rose-500" : (tokens.percentage >= 80 ? "bg-amber-400" : "bg-champagne-400");

        gaugesContainer.innerHTML = \`
          <div class="bg-obsidian-900 border border-obsidian-750 rounded-xl p-5 space-y-3">
            <div class="flex items-center justify-between">
              <span class="text-xs font-semibold text-sand-300">API Calls Quota</span>
              <span class="text-xs font-mono font-bold text-sand-100">\${calls.used.toLocaleString()} / \${calls.limit.toLocaleString()}</span>
            </div>
            <div class="w-full bg-obsidian-800 h-2 rounded-full overflow-hidden">
              <div class="\${callsBarColor} h-full rounded-full transition-all duration-500" style="width: \${calls.percentage}%"></div>
            </div>
            <div class="flex justify-between text-[10px] text-sand-400 font-mono">
              <span>\${calls.percentage}% Consumed</span>
              <span>\${calls.remaining.toLocaleString()} Calls Left</span>
            </div>
          </div>

          <div class="bg-obsidian-900 border border-obsidian-750 rounded-xl p-5 space-y-3">
            <div class="flex items-center justify-between">
              <span class="text-xs font-semibold text-sand-300">AI Tokens Quota</span>
              <span class="text-xs font-mono font-bold text-sand-100">\${tokens.used.toLocaleString()} / \${tokens.limit.toLocaleString()}</span>
            </div>
            <div class="w-full bg-obsidian-800 h-2 rounded-full overflow-hidden">
              <div class="\${tokensBarColor} h-full rounded-full transition-all duration-500" style="width: \${tokens.percentage}%"></div>
            </div>
            <div class="flex justify-between text-[10px] text-sand-400 font-mono">
              <span>\${tokens.percentage}% Consumed</span>
              <span>\${tokens.remaining.toLocaleString()} Tokens Left</span>
            </div>
          </div>

          <div class="bg-obsidian-900 border border-obsidian-750 rounded-xl p-5 space-y-2">
            <div class="text-xs font-semibold text-sand-300">Accrued Month Spend</div>
            <div class="text-2xl font-black font-mono text-champagne-300">\${currentTenant.cost.formattedUsd}</div>
            <div class="text-[10px] text-sand-400 font-mono">
              Zero-Float Ledger: \${currentTenant.cost.costNanoDollars} nano-dollars
            </div>
          </div>
        \`;
      }

      // 3. Render Usage Events Table
      const usageEvents = dashboardData.recentUsageEvents || [];
      const usageTbody = document.getElementById("usage-events-table");
      usageTbody.innerHTML = usageEvents.length === 0 
        ? '<tr><td colspan="5" class="py-4 text-center text-sand-500">No usage events recorded yet.</td></tr>'
        : usageEvents.map(e => \`
          <tr class="hover:bg-obsidian-850 transition">
            <td class="py-2.5 text-sand-400">\${new Date(e.timestamp).toLocaleTimeString()}</td>
            <td class="py-2.5 text-sand-200 truncate max-w-[120px] font-sans font-medium">\${e.tenantName}</td>
            <td class="py-2.5 text-sand-300">\${e.totalTokens.toLocaleString()}</td>
            <td class="py-2.5 text-champagne-300 font-bold">\$\${(Number(e.costNanoDollars) / 1000000000).toFixed(9)}</td>
            <td class="py-2.5 text-sand-400 truncate max-w-[140px]" title="\${e.idempotencyKey}">\${e.idempotencyKey}</td>
          </tr>
        \`).join("");

      // 4. Render Webhook Events Table
      const webhooks = dashboardData.recentWebhooks || [];
      const webhooksTbody = document.getElementById("webhooks-table");
      webhooksTbody.innerHTML = webhooks.length === 0
        ? '<tr><td colspan="4" class="py-4 text-center text-sand-500">No webhooks processed yet.</td></tr>'
        : webhooks.map(w => \`
          <tr class="hover:bg-obsidian-850 transition">
            <td class="py-2.5 text-champagne-400 truncate max-w-[130px]" title="\${w.stripeEventId}">\${w.stripeEventId}</td>
            <td class="py-2.5 text-sand-300 font-mono text-[10px]">\${w.eventType}</td>
            <td class="py-2.5">
              <span class="px-2 py-0.5 rounded text-[9px] font-bold uppercase \${w.status === "SUCCESS" ? "bg-champagne-500/20 text-champagne-300 border border-champagne-500/30" : "bg-obsidian-800 text-sand-400 border border-obsidian-700"}">
                \${w.status}
              </span>
            </td>
            <td class="py-2.5 text-sand-400">\${new Date(w.processedAt).toLocaleTimeString()}</td>
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
        ? "px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-champagne-500/20 text-champagne-300 border border-champagne-500/30"
        : "px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-rose-500/20 text-rose-300 border border-rose-500/30";

      replayBadge.classList.toggle("hidden", !isReplay);
      timeElem.innerText = elapsed + " ms";
      jsonElem.innerHTML = "<pre class='text-sand-200'>" + JSON.stringify(json, null, 2) + "</pre>";
    }

    // Boundary Test Actions
    async function testBoundaryCall() {
      const boundaryTenantId = "00000000-0000-0000-0000-000000000003";
      selectTenant(boundaryTenantId);
      const log = document.getElementById("boundary-log");

      log.innerHTML = "<span class='text-champagne-400'>[Executing boundary probe call...]</span><br>";

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
      const statusClass = res.status === 200 ? "text-champagne-300 font-bold" : "text-rose-400 font-bold";
      log.innerHTML += "<span class='" + statusClass + "'>Response [" + res.status + "]:</span> <pre class='text-sand-300 mt-1'>" + JSON.stringify(data, null, 2) + "</pre>";
      refreshData();
    }

    async function resetBoundaryTenant() {
      const log = document.getElementById("boundary-log");
      log.innerHTML = "<span class='text-sand-300'>[Resetting Boundary Org to 999 calls...]</span><br>";

      const res = await fetch("/v1/dashboard/reset-boundary", { method: "POST" });
      const data = await res.json();
      log.innerHTML += "<span class='text-champagne-300 font-bold'>Success:</span> " + data.message;
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
      log.innerHTML += "<span class='text-amber-400 font-bold'>Response [" + res.status + " Payment Required]:</span> <pre class='text-sand-300 mt-1'>" + JSON.stringify(data, null, 2) + "</pre>";
      refreshData();
    }

    // Stripe Webhook Simulations
    async function simulateStripeWebhook(isDuplicate, isForged) {
      const log = document.getElementById("webhook-log");
      log.innerHTML = "<span class='text-sand-400'>[Dispatched simulated webhook...]</span><br>";

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

        const colorClass = res.status === 200 ? "text-champagne-300 font-bold" : "text-rose-400 font-bold";
        log.innerHTML += "<span class='" + colorClass + "'>Response [" + res.status + "]:</span> <pre class='text-sand-300 mt-1'>" + JSON.stringify(data, null, 2) + "</pre>";
        refreshData();
      } catch (err) {
        log.innerHTML += "<span class='text-rose-400'>Error: " + err.message + "</span>";
      }
    }
  </script>
</body>
</html>`;

    res.setHeader("Content-Type", "text/html");
    res.status(200).send(html);
  }
}
