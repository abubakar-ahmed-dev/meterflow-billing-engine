import { Request, Response } from "express";

export class HomeController {
  /**
   * GET /
   * Renders the Explanatory Product Homepage & Architecture Overview
   */
  public static async renderHome(_req: Request, res: Response): Promise<void> {
    const html = `<!DOCTYPE html>
<html lang="en" class="scroll-smooth">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MeterFlow — Multi-Tenant Usage Metering & Subscription Billing Engine</title>
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
              700: '#21242d',
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
      box-shadow: 0 0 35px -5px rgba(216, 178, 97, 0.12);
    }
    .gold-border-glow:hover {
      border-color: rgba(216, 178, 97, 0.45);
      box-shadow: 0 0 25px -4px rgba(216, 178, 97, 0.18);
    }
    ::-webkit-scrollbar { width: 7px; height: 7px; }
    ::-webkit-scrollbar-track { background: #08090b; }
    ::-webkit-scrollbar-thumb { background: #262934; border-radius: 4px; }
    ::-webkit-scrollbar-thumb:hover { background: #3b3f4f; }
  </style>
</head>
<body class="min-h-screen selection:bg-champagne-400 selection:text-obsidian-950 flex flex-col justify-between">

  <!-- Top Announcement / System Status Bar -->
  <div class="border-b border-obsidian-700/60 bg-obsidian-900/90 text-xs py-2 px-4">
    <div class="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
      <div class="flex items-center gap-2">
        <span class="inline-block w-2 h-2 rounded-full bg-champagne-400 animate-pulse"></span>
        <span class="text-sand-300 font-medium">MeterFlow Engine v1.0 Production Release</span>
        <span class="text-obsidian-600">|</span>
        <span class="text-sand-400 hidden sm:inline">FlyRank Capstone Submission</span>
      </div>
      <div class="flex items-center gap-4 text-sand-400 font-mono text-[11px]">
        <a href="/health" target="_blank" class="hover:text-champagne-300 transition flex items-center gap-1.5">
          <i class="fa-solid fa-server text-champagne-400 text-[10px]"></i> Engine Health: <span class="text-sand-200">200 OK</span>
        </a>
        <a href="https://github.com/abubakar-ahmed-dev/meterflow-billing-engine" target="_blank" class="hover:text-champagne-300 transition flex items-center gap-1">
          <i class="fa-brands fa-github text-xs"></i> GitHub
        </a>
      </div>
    </div>
  </div>

  <!-- Primary Sticky Navigation -->
  <header class="border-b border-obsidian-700/70 bg-obsidian-950/85 backdrop-blur-md sticky top-0 z-50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
      
      <!-- Brand Logo -->
      <a href="/" class="flex items-center gap-3 group">
        <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-champagne-300 via-champagne-500 to-champagne-700 p-[1px] shadow-lg shadow-champagne-500/10">
          <div class="w-full h-full bg-obsidian-950 rounded-[11px] flex items-center justify-center text-champagne-300 group-hover:scale-105 transition transform">
            <i class="fa-solid fa-bolt-lightning text-lg"></i>
          </div>
        </div>
        <div>
          <div class="flex items-center gap-2">
            <span class="text-xl font-bold tracking-tight text-sand-100 group-hover:text-champagne-200 transition">MeterFlow</span>
            <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-obsidian-800 text-champagne-300 border border-champagne-500/30">
              Core Engine
            </span>
          </div>
          <span class="text-[11px] text-sand-400 block tracking-normal">Usage Metering & Financial Precision</span>
        </div>
      </a>

      <!-- Quick Nav Links -->
      <nav class="hidden md:flex items-center gap-6 text-xs font-medium text-sand-300">
        <a href="#about" class="hover:text-champagne-300 transition">Overview</a>
        <a href="#capabilities" class="hover:text-champagne-300 transition">Capabilities</a>
        <a href="#pathways" class="hover:text-champagne-300 transition">Pathways</a>
        <a href="/guides" class="hover:text-champagne-300 transition flex items-center gap-1">
          <i class="fa-solid fa-book-open text-champagne-400"></i> Guides Hub
        </a>
        <a href="/docs" target="_blank" class="hover:text-champagne-300 transition flex items-center gap-1">
          <i class="fa-solid fa-code text-sand-400"></i> API Docs
        </a>
      </nav>

      <!-- Action Buttons -->
      <div class="flex items-center gap-3">
        <a href="/guides" class="hidden sm:inline-flex px-3.5 py-2 rounded-lg bg-obsidian-850 hover:bg-obsidian-800 text-sand-200 border border-obsidian-700 text-xs font-semibold items-center gap-1.5 transition">
          <i class="fa-solid fa-graduation-cap text-champagne-400"></i> Read Guides
        </a>
        <a href="/dashboard" class="px-4 py-2 rounded-lg bg-gradient-to-r from-champagne-400 via-champagne-500 to-champagne-600 hover:from-champagne-300 hover:to-champagne-500 text-obsidian-950 font-bold text-xs shadow-lg shadow-champagne-500/15 flex items-center gap-2 transition transform hover:-translate-y-0.5">
          <i class="fa-solid fa-flask"></i>
          <span>Launch Lab</span>
        </a>
      </div>

    </div>
  </header>

  <!-- Hero Section -->
  <main class="flex-1">
    <section class="relative overflow-hidden pt-16 sm:pt-24 pb-20 border-b border-obsidian-800/80">
      
      <!-- Subtle Ambient Background Glow -->
      <div class="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-champagne-500/5 blur-[120px] pointer-events-none rounded-full"></div>

      <div class="max-w-5xl mx-auto px-4 sm:px-6 text-center relative z-10">
        
        <!-- Status Pill -->
        <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-obsidian-850 border border-champagne-500/30 text-champagne-300 text-xs font-semibold uppercase tracking-wider mb-6 shadow-sm">
          <i class="fa-solid fa-shield-halved text-champagne-400"></i> Production-Ready Billing Engine
        </div>

        <!-- Grand Headline -->
        <h1 class="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-sand-100 leading-[1.15]">
          Usage Metering & Quota Boundaries <br class="hidden sm:inline" />
          <span class="gold-gradient-text">Engineered for Absolute Financial Precision</span>
        </h1>

        <!-- Subheading -->
        <p class="mt-6 text-base sm:text-lg md:text-xl text-sand-300 max-w-3xl mx-auto font-normal leading-relaxed">
          MeterFlow solves the hardest challenges in modern AI SaaS monetization: atomic two-phase idempotency, pre-action HTTP boundary enforcement, and zero-float-loss integer token pricing.
        </p>

        <!-- Primary Action Callouts -->
        <div class="mt-10 flex flex-wrap items-center justify-center gap-4">
          <a href="/dashboard" class="px-6 py-3.5 rounded-xl bg-gradient-to-r from-champagne-400 via-champagne-500 to-champagne-600 hover:from-champagne-300 hover:to-champagne-500 text-obsidian-950 font-bold text-sm shadow-xl shadow-champagne-500/20 flex items-center gap-2.5 transition transform hover:-translate-y-0.5">
            <i class="fa-solid fa-sliders text-base"></i>
            <span>Interactive Testing Console</span>
          </a>
          <a href="/guides" class="px-6 py-3.5 rounded-xl bg-obsidian-850 hover:bg-obsidian-800 text-sand-100 border border-obsidian-700 hover:border-champagne-500/40 font-semibold text-sm flex items-center gap-2 transition">
            <i class="fa-solid fa-book-bookmark text-champagne-400"></i>
            <span>Architecture & System Guides</span>
          </a>
          <a href="/docs" target="_blank" class="px-5 py-3.5 rounded-xl bg-obsidian-900 hover:bg-obsidian-850 text-sand-300 border border-obsidian-800 hover:border-obsidian-700 font-mono text-xs flex items-center gap-2 transition">
            <i class="fa-solid fa-file-code text-sand-400"></i>
            <span>OpenAPI 3.0 Specs</span>
          </a>
        </div>

        <!-- Quick Proof Badges -->
        <div class="mt-12 pt-8 border-t border-obsidian-800/60 max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-4 text-left">
          <div class="bg-obsidian-900/60 border border-obsidian-800 rounded-xl p-3.5">
            <div class="text-[11px] text-sand-400 uppercase tracking-wider font-semibold">Idempotency</div>
            <div class="text-sm font-bold text-sand-100 mt-1 flex items-center gap-1.5">
              <i class="fa-solid fa-fingerprint text-champagne-400 text-xs"></i> SHA-256 Atomic
            </div>
            <div class="text-[11px] text-sand-400 mt-1">Zero duplicate billing</div>
          </div>

          <div class="bg-obsidian-900/60 border border-obsidian-800 rounded-xl p-3.5">
            <div class="text-[11px] text-sand-400 uppercase tracking-wider font-semibold">Boundary Check</div>
            <div class="text-sm font-bold text-sand-100 mt-1 flex items-center gap-1.5">
              <i class="fa-solid fa-traffic-light text-champagne-400 text-xs"></i> 429 & 402 Pre-Action
            </div>
            <div class="text-[11px] text-sand-400 mt-1">Stops runaways upfront</div>
          </div>

          <div class="bg-obsidian-900/60 border border-obsidian-800 rounded-xl p-3.5">
            <div class="text-[11px] text-sand-400 uppercase tracking-wider font-semibold">Token Arithmetic</div>
            <div class="text-sm font-bold text-sand-100 mt-1 flex items-center gap-1.5">
              <i class="fa-solid fa-calculator text-champagne-400 text-xs"></i> 10⁻⁹ Nano-Dollars
            </div>
            <div class="text-[11px] text-sand-400 mt-1">0.000% IEEE 754 drift</div>
          </div>

          <div class="bg-obsidian-900/60 border border-obsidian-800 rounded-xl p-3.5">
            <div class="text-[11px] text-sand-400 uppercase tracking-wider font-semibold">Stripe Webhooks</div>
            <div class="text-sm font-bold text-sand-100 mt-1 flex items-center gap-1.5">
              <i class="fa-solid fa-key text-champagne-400 text-xs"></i> HMAC Raw Buffer
            </div>
            <div class="text-[11px] text-sand-400 mt-1">Offline & live dual mode</div>
          </div>
        </div>

      </div>
    </section>

    <!-- SECTION: What is MeterFlow & What Does It Do? -->
    <section id="about" class="py-20 border-b border-obsidian-800/80 bg-obsidian-900/30">
      <div class="max-w-7xl mx-auto px-4 sm:px-6">
        
        <div class="max-w-3xl mb-12">
          <span class="text-xs font-bold uppercase tracking-wider text-champagne-400">Core Purpose</span>
          <h2 class="text-2xl sm:text-3xl md:text-4xl font-black text-sand-100 mt-2 tracking-tight">
            What is MeterFlow, and what problem does it solve?
          </h2>
          <p class="mt-4 text-sand-300 text-sm sm:text-base leading-relaxed">
            Standard software billing is built on static monthly subscriptions. But modern AI applications run on high-frequency, variable usage: prompt caching discounts, complex reasoning tokens, and expensive GPU inference calls.
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
          
          <!-- Problem Box -->
          <div class="bg-obsidian-900/80 border border-obsidian-750 rounded-2xl p-6 sm:p-8 space-y-4">
            <div class="w-10 h-10 rounded-xl bg-obsidian-800 border border-obsidian-700 flex items-center justify-center text-sand-300 font-bold text-lg">
              <i class="fa-solid fa-triangle-exclamation text-amber-400/90"></i>
            </div>
            <h3 class="text-xl font-bold text-sand-100">The Problem in Traditional Metering</h3>
            <p class="text-sm text-sand-300 leading-relaxed">
              When clients experience network blips or timeouts, they retry requests. Without strict atomic locks, standard backends charge users twice for the same LLM inference call. Furthermore, traditional systems check monthly quotas <em class="text-sand-200">after</em> calling the AI provider, forcing SaaS operators to absorb costs for requests that exceeded plan boundaries. Lastly, standard floating-point arithmetic silently loses fractions of cents across millions of token calls.
            </p>
            <div class="pt-4 border-t border-obsidian-800 text-xs text-sand-400 font-mono space-y-1.5">
              <div>&bull; Float precision errors: <span class="text-rose-400">0.1 + 0.2 = 0.30000000000000004</span></div>
              <div>&bull; Client retry storms cause duplicate deductions</div>
              <div>&bull; Post-action quota checks leak provider GPU costs</div>
            </div>
          </div>

          <!-- Solution Box -->
          <div class="bg-obsidian-850/80 border border-champagne-500/20 rounded-2xl p-6 sm:p-8 space-y-4 gold-subtle-glow">
            <div class="w-10 h-10 rounded-xl bg-champagne-400/10 border border-champagne-400/30 flex items-center justify-center text-champagne-300 font-bold text-lg">
              <i class="fa-solid fa-check-double text-champagne-400"></i>
            </div>
            <h3 class="text-xl font-bold text-sand-100">How MeterFlow Resolves It</h3>
            <p class="text-sm text-sand-300 leading-relaxed">
              MeterFlow implements a zero-trust financial pipeline. Every billable transaction is checked <strong class="text-sand-100">pre-action</strong>: if an organization exceeds their allowance or has a lapsed payment status, MeterFlow immediately halts execution with an RFC 6585 compliant <code class="text-champagne-300 font-mono text-xs">429 Too Many Requests</code> or <code class="text-champagne-300 font-mono text-xs">402 Payment Required</code> before any downstream costs accrue. Idempotency keys are cryptographically hashed and reserved atomically in PostgreSQL, preventing double charges under any retry storm.
            </p>
            <div class="pt-4 border-t border-obsidian-700/60 text-xs text-sand-400 font-mono space-y-1.5">
              <div>&bull; Scaled integer math: <span class="text-champagne-300">1 Token = 2,000 Nano-Dollars</span></div>
              <div>&bull; Two-phase idempotency: IN_PROGRESS reservation lock</div>
              <div>&bull; Pre-flight boundary gate blocks runaways at 0 latency</div>
            </div>
          </div>

        </div>

      </div>
    </section>

    <!-- SECTION: User Pathways / What You Can Do -->
    <section id="pathways" class="py-20 border-b border-obsidian-800/80">
      <div class="max-w-7xl mx-auto px-4 sm:px-6">
        
        <div class="text-center max-w-3xl mx-auto mb-14">
          <span class="text-xs font-bold uppercase tracking-wider text-champagne-400">Navigational Pathways</span>
          <h2 class="text-2xl sm:text-3xl md:text-4xl font-black text-sand-100 mt-2 tracking-tight">
            What can you do with this system?
          </h2>
          <p class="mt-3 text-sand-300 text-sm sm:text-base">
            Select your specific role or demand below to explore the exact tools, verification probes, and documentation crafted for your objectives.
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <!-- Pathway 1: Evaluator & Judge -->
          <div class="bg-obsidian-900 border border-obsidian-750 hover:border-champagne-500/40 rounded-2xl p-6 flex flex-col justify-between transition group gold-border-glow">
            <div>
              <div class="w-12 h-12 rounded-xl bg-obsidian-800 border border-obsidian-700 flex items-center justify-center text-champagne-400 text-xl mb-4 group-hover:scale-105 transition">
                <i class="fa-solid fa-clipboard-check"></i>
              </div>
              <div class="text-xs font-bold uppercase tracking-wider text-champagne-400">For Evaluators & Judges</div>
              <h3 class="text-lg font-bold text-sand-100 mt-1">Verify Acceptance Probes</h3>
              <p class="text-xs text-sand-300 mt-2.5 leading-relaxed">
                Test the 5 core requirements specified in the Capstone Brief: atomic idempotency replay, boundary 999-to-1,000 call transition with 429 status, 402 payment required on lapsed accounts, and Stripe webhook HMAC deduplication.
              </p>
              <div class="mt-4 pt-3 border-t border-obsidian-800/80 space-y-1 text-[11px] text-sand-400">
                <div class="flex items-center gap-1.5"><i class="fa-solid fa-check text-champagne-400 text-[10px]"></i> One-click automated probe simulator</div>
                <div class="flex items-center gap-1.5"><i class="fa-solid fa-check text-champagne-400 text-[10px]"></i> Pre-seeded multi-tier test tenants</div>
              </div>
            </div>
            <div class="mt-6 pt-4 border-t border-obsidian-800">
              <a href="/dashboard" class="w-full py-2.5 px-4 rounded-lg bg-obsidian-800 hover:bg-champagne-500 hover:text-obsidian-950 text-sand-100 text-xs font-bold flex items-center justify-center gap-2 transition">
                <span>Open Testing Console</span>
                <i class="fa-solid fa-arrow-right text-[10px]"></i>
              </a>
            </div>
          </div>

          <!-- Pathway 2: System Architects & Developers -->
          <div class="bg-obsidian-900 border border-obsidian-750 hover:border-champagne-500/40 rounded-2xl p-6 flex flex-col justify-between transition group gold-border-glow">
            <div>
              <div class="w-12 h-12 rounded-xl bg-obsidian-800 border border-obsidian-700 flex items-center justify-center text-champagne-400 text-xl mb-4 group-hover:scale-105 transition">
                <i class="fa-solid fa-book-open"></i>
              </div>
              <div class="text-xs font-bold uppercase tracking-wider text-champagne-400">For Software Architects</div>
              <h3 class="text-lg font-bold text-sand-100 mt-1">Learn Architecture Foundations</h3>
              <p class="text-xs text-sand-300 mt-2.5 leading-relaxed">
                Dive into 6 comprehensive, semi-formal engineering guides detailing how each sub-system is architected, why specific technical trade-offs were made, and how to operate the billing engine at scale.
              </p>
              <div class="mt-4 pt-3 border-t border-obsidian-800/80 space-y-1 text-[11px] text-sand-400">
                <div class="flex items-center gap-1.5"><i class="fa-solid fa-check text-champagne-400 text-[10px]"></i> Database schema and indexing strategies</div>
                <div class="flex items-center gap-1.5"><i class="fa-solid fa-check text-champagne-400 text-[10px]"></i> Stripe webhook raw buffer verification</div>
              </div>
            </div>
            <div class="mt-6 pt-4 border-t border-obsidian-800">
              <a href="/guides" class="w-full py-2.5 px-4 rounded-lg bg-obsidian-800 hover:bg-champagne-500 hover:text-obsidian-950 text-sand-100 text-xs font-bold flex items-center justify-center gap-2 transition">
                <span>Browse Guides Hub</span>
                <i class="fa-solid fa-arrow-right text-[10px]"></i>
              </a>
            </div>
          </div>

          <!-- Pathway 3: Integrators & API Consumers -->
          <div class="bg-obsidian-900 border border-obsidian-750 hover:border-champagne-500/40 rounded-2xl p-6 flex flex-col justify-between transition group gold-border-glow">
            <div>
              <div class="w-12 h-12 rounded-xl bg-obsidian-800 border border-obsidian-700 flex items-center justify-center text-champagne-400 text-xl mb-4 group-hover:scale-105 transition">
                <i class="fa-solid fa-network-wired"></i>
              </div>
              <div class="text-xs font-bold uppercase tracking-wider text-champagne-400">For API Integrators</div>
              <h3 class="text-lg font-bold text-sand-100 mt-1">Inspect Machine Contracts</h3>
              <p class="text-xs text-sand-300 mt-2.5 leading-relaxed">
                Connect external microservices to MeterFlow using standardized REST contracts, OpenAPI 3.0 specs, typed payload validation, and deterministic HTTP response codes.
              </p>
              <div class="mt-4 pt-3 border-t border-obsidian-800/80 space-y-1 text-[11px] text-sand-400">
                <div class="flex items-center gap-1.5"><i class="fa-solid fa-check text-champagne-400 text-[10px]"></i> Interactive Swagger execution sandbox</div>
                <div class="flex items-center gap-1.5"><i class="fa-solid fa-check text-champagne-400 text-[10px]"></i> Strictly typed JSON schemas for all endpoints</div>
              </div>
            </div>
            <div class="mt-6 pt-4 border-t border-obsidian-800">
              <a href="/docs" target="_blank" class="w-full py-2.5 px-4 rounded-lg bg-obsidian-800 hover:bg-champagne-500 hover:text-obsidian-950 text-sand-100 text-xs font-bold flex items-center justify-center gap-2 transition">
                <span>View OpenAPI Specs</span>
                <i class="fa-solid fa-arrow-up-right-from-square text-[10px]"></i>
              </a>
            </div>
          </div>

        </div>

      </div>
    </section>

    <!-- SECTION: The 4 Engineering Guarantees -->
    <section id="capabilities" class="py-20 border-b border-obsidian-800/80 bg-obsidian-900/30">
      <div class="max-w-7xl mx-auto px-4 sm:px-6">
        
        <div class="max-w-3xl mb-12">
          <span class="text-xs font-bold uppercase tracking-wider text-champagne-400">Core Guarantees</span>
          <h2 class="text-2xl sm:text-3xl md:text-4xl font-black text-sand-100 mt-2 tracking-tight">
            Built upon four non-negotiable principles
          </h2>
          <p class="mt-3 text-sand-300 text-sm sm:text-base leading-relaxed">
            Every layer of MeterFlow is engineered to handle failure modes gracefully, prevent financial leakage, and provide total transparency.
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          
          <!-- Pillar 1 -->
          <div class="bg-obsidian-900/80 border border-obsidian-800 rounded-xl p-5 space-y-3 hover:border-obsidian-700 transition">
            <div class="text-champagne-400 text-lg">
              <i class="fa-solid fa-lock"></i>
            </div>
            <h4 class="text-base font-bold text-sand-100">Exactly-Once Idempotency</h4>
            <p class="text-xs text-sand-300 leading-relaxed">
              Two-phase reservation protocol locks incoming keys. If the same key is replayed with identical payload, it returns cached results with 0 duplicate ledger events. If payload is modified, it returns 422 Unprocessable Entity.
            </p>
            <div class="pt-3 border-t border-obsidian-800 text-[11px]">
              <a href="/guides/exactly-once-metering-and-idempotency" class="text-champagne-400 hover:text-champagne-300 font-semibold flex items-center gap-1">
                Read Guide &rarr;
              </a>
            </div>
          </div>

          <!-- Pillar 2 -->
          <div class="bg-obsidian-900/80 border border-obsidian-800 rounded-xl p-5 space-y-3 hover:border-obsidian-700 transition">
            <div class="text-champagne-400 text-lg">
              <i class="fa-solid fa-traffic-light"></i>
            </div>
            <h4 class="text-base font-bold text-sand-100">Hard Quota Boundaries</h4>
            <p class="text-xs text-sand-300 leading-relaxed">
              At 999 of 1,000 monthly calls, the 1,000th call succeeds. The 1,001st call is immediately blocked with 429 Too Many Requests and an RFC 6585 Retry-After header. Lapsed subscriptions receive 402 Payment Required.
            </p>
            <div class="pt-3 border-t border-obsidian-800 text-[11px]">
              <a href="/guides/quota-enforcement-and-http-boundaries" class="text-champagne-400 hover:text-champagne-300 font-semibold flex items-center gap-1">
                Read Guide &rarr;
              </a>
            </div>
          </div>

          <!-- Pillar 3 -->
          <div class="bg-obsidian-900/80 border border-obsidian-800 rounded-xl p-5 space-y-3 hover:border-obsidian-700 transition">
            <div class="text-champagne-400 text-lg">
              <i class="fa-solid fa-coins"></i>
            </div>
            <h4 class="text-base font-bold text-sand-100">Integer Nano-Dollar Math</h4>
            <p class="text-xs text-sand-300 leading-relaxed">
              Costs are computed in BigInt nano-dollars ($10⁻⁹ USD). Fresh input tokens are pinned at $2.00/1M, cached inputs at $0.50/1M (75% discount), and reasoning tokens at $8.00/1M. Zero float rounding discrepancies.
            </p>
            <div class="pt-3 border-t border-obsidian-800 text-[11px]">
              <a href="/guides/ai-token-pricing-and-integer-math" class="text-champagne-400 hover:text-champagne-300 font-semibold flex items-center gap-1">
                Read Guide &rarr;
              </a>
            </div>
          </div>

          <!-- Pillar 4 -->
          <div class="bg-obsidian-900/80 border border-obsidian-800 rounded-xl p-5 space-y-3 hover:border-obsidian-700 transition">
            <div class="text-champagne-400 text-lg">
              <i class="fa-solid fa-shield-virus"></i>
            </div>
            <h4 class="text-base font-bold text-sand-100">Cryptographic Webhooks</h4>
            <p class="text-xs text-sand-300 leading-relaxed">
              Stripe webhook payloads are captured as raw unparsed body buffers and validated using HMAC-SHA256 signatures before parsing. Replayed event IDs are acknowledged with 200 duplicate_ignored.
            </p>
            <div class="pt-3 border-t border-obsidian-800 text-[11px]">
              <a href="/guides/stripe-webhooks-and-cryptographic-security" class="text-champagne-400 hover:text-champagne-300 font-semibold flex items-center gap-1">
                Read Guide &rarr;
              </a>
            </div>
          </div>

        </div>

      </div>
    </section>

    <!-- SECTION: Quick Architecture Guides Showcase -->
    <section class="py-20 border-b border-obsidian-800/80">
      <div class="max-w-7xl mx-auto px-4 sm:px-6">
        
        <div class="flex flex-wrap items-end justify-between gap-6 mb-12">
          <div class="max-w-2xl">
            <span class="text-xs font-bold uppercase tracking-wider text-champagne-400">Documentation Library</span>
            <h2 class="text-2xl sm:text-3xl md:text-4xl font-black text-sand-100 mt-2 tracking-tight">
              Featured System Guides
            </h2>
            <p class="mt-3 text-sand-300 text-sm">
              Each topic is structured in clean, semi-formal English to explain the concepts, algorithms, and practical engineering trade-offs.
            </p>
          </div>
          <a href="/guides" class="px-4 py-2.5 rounded-lg bg-obsidian-850 hover:bg-obsidian-800 text-sand-200 border border-obsidian-700 hover:border-champagne-500/40 text-xs font-semibold flex items-center gap-2 transition">
            <span>View All 6 Guides</span>
            <i class="fa-solid fa-arrow-right text-[10px] text-champagne-400"></i>
          </a>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <a href="/guides/exactly-once-metering-and-idempotency" class="bg-obsidian-900 border border-obsidian-800 hover:border-champagne-500/40 p-5 rounded-xl block transition group gold-border-glow">
            <div class="flex items-center justify-between text-xs text-sand-400 mb-2">
              <span class="text-champagne-400 font-semibold font-mono text-[10px]">GUIDE #1</span>
              <span>4 min read</span>
            </div>
            <h3 class="text-base font-bold text-sand-100 group-hover:text-champagne-300 transition">
              Exactly-Once Usage Metering & Two-Phase Idempotency
            </h3>
            <p class="text-xs text-sand-400 mt-2 line-clamp-2">
              Preventing duplicate billing during network retry storms with atomic PostgreSQL locks and SHA-256 payload tampering detection.
            </p>
            <div class="mt-4 text-xs font-semibold text-champagne-400 flex items-center gap-1">
              Read article <i class="fa-solid fa-chevron-right text-[9px]"></i>
            </div>
          </a>

          <a href="/guides/quota-enforcement-and-http-boundaries" class="bg-obsidian-900 border border-obsidian-800 hover:border-champagne-500/40 p-5 rounded-xl block transition group gold-border-glow">
            <div class="flex items-center justify-between text-xs text-sand-400 mb-2">
              <span class="text-champagne-400 font-semibold font-mono text-[10px]">GUIDE #2</span>
              <span>4 min read</span>
            </div>
            <h3 class="text-base font-bold text-sand-100 group-hover:text-champagne-300 transition">
              Quota Enforcement, HTTP Boundaries & Payment Status Honesty
            </h3>
            <p class="text-xs text-sand-400 mt-2 line-clamp-2">
              Why pre-action quota validation is essential, and how RFC 6585 429 Too Many Requests prevents expensive LLM inference leakage.
            </p>
            <div class="mt-4 text-xs font-semibold text-champagne-400 flex items-center gap-1">
              Read article <i class="fa-solid fa-chevron-right text-[9px]"></i>
            </div>
          </a>

          <a href="/guides/ai-token-pricing-and-integer-math" class="bg-obsidian-900 border border-obsidian-800 hover:border-champagne-500/40 p-5 rounded-xl block transition group gold-border-glow">
            <div class="flex items-center justify-between text-xs text-sand-400 mb-2">
              <span class="text-champagne-400 font-semibold font-mono text-[10px]">GUIDE #5</span>
              <span>4 min read</span>
            </div>
            <h3 class="text-base font-bold text-sand-100 group-hover:text-champagne-300 transition">
              AI Token Pricing & Zero-Loss Integer Mathematics
            </h3>
            <p class="text-xs text-sand-400 mt-2 line-clamp-2">
              Eliminating floating-point rounding errors in high-frequency billing using BigInt nano-dollars and prompt caching discounts.
            </p>
            <div class="mt-4 text-xs font-semibold text-champagne-400 flex items-center gap-1">
              Read article <i class="fa-solid fa-chevron-right text-[9px]"></i>
            </div>
          </a>

        </div>

      </div>
    </section>

    <!-- SECTION: Launch Console CTA Banner -->
    <section class="py-20 relative overflow-hidden">
      <div class="max-w-5xl mx-auto px-4 sm:px-6 text-center">
        <div class="bg-gradient-to-b from-obsidian-850 to-obsidian-900 border border-champagne-500/30 rounded-3xl p-8 sm:p-14 gold-subtle-glow">
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-obsidian-800 border border-champagne-500/30 text-champagne-300 text-xs font-semibold mb-4">
            <i class="fa-solid fa-terminal text-champagne-400"></i> Interactive Testing Ready
          </div>
          <h2 class="text-3xl sm:text-4xl font-extrabold text-sand-100 tracking-tight">
            Ready to test the engine live?
          </h2>
          <p class="mt-4 text-sand-300 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            Open the visual testing console to execute token pricing calculations, simulate Stripe webhook payloads, trigger boundary quota rejections, and inspect live responses.
          </p>
          <div class="mt-8 flex flex-wrap items-center justify-center gap-4">
            <a href="/dashboard" class="px-7 py-3.5 rounded-xl bg-gradient-to-r from-champagne-400 via-champagne-500 to-champagne-600 hover:from-champagne-300 hover:to-champagne-500 text-obsidian-950 font-bold text-sm shadow-xl shadow-champagne-500/20 flex items-center gap-2 transition transform hover:-translate-y-0.5">
              <i class="fa-solid fa-gauge-high"></i>
              <span>Launch Testing Console</span>
            </a>
            <a href="/guides" class="px-6 py-3.5 rounded-xl bg-obsidian-800 hover:bg-obsidian-750 text-sand-200 border border-obsidian-700 font-semibold text-sm transition">
              <span>Explore Knowledge Base</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  </main>

  <!-- Global Footer -->
  <footer class="border-t border-obsidian-800/80 bg-obsidian-950 text-sand-400 text-xs py-10">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-6">
      
      <div class="flex items-center gap-3">
        <div class="w-7 h-7 rounded-lg bg-champagne-500/20 border border-champagne-500/40 flex items-center justify-center text-champagne-400 font-bold text-xs">
          ⚡
        </div>
        <div>
          <span class="text-sand-200 font-bold">MeterFlow Billing Engine</span>
          <span class="text-sand-500 block text-[11px]">Multi-Tenant Metering & Quota Enforcement Engine</span>
        </div>
      </div>

      <div class="flex flex-wrap items-center gap-6 text-sand-300 text-xs">
        <a href="/" class="hover:text-champagne-300 transition">Home</a>
        <a href="/dashboard" class="hover:text-champagne-300 transition">Testing Console</a>
        <a href="/guides" class="hover:text-champagne-300 transition">Architecture Guides</a>
        <a href="/docs" target="_blank" class="hover:text-champagne-300 transition">OpenAPI Docs</a>
        <a href="/health" target="_blank" class="hover:text-champagne-300 transition">Health Status</a>
        <a href="https://github.com/abubakar-ahmed-dev/meterflow-billing-engine" target="_blank" class="hover:text-champagne-300 transition">
          <i class="fa-brands fa-github text-sm"></i>
        </a>
      </div>

      <div class="text-[11px] text-sand-500 text-center md:text-right font-mono">
        <div>Author: abubakar-ahmed-dev</div>
        <div>Zero-Float-Drift Nano-Dollar Billing</div>
      </div>

    </div>
  </footer>

</body>
</html>`;

    res.setHeader("Content-Type", "text/html");
    res.status(200).send(html);
  }
}
