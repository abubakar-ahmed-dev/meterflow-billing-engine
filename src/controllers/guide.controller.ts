import { Request, Response } from "express";
import { GUIDES } from "../content/guides.data.js";

export class GuideController {
  /**
   * GET /guides
   * Renders the Knowledge Base Archive / Hub Page
   */
  public static async renderArchive(_req: Request, res: Response): Promise<void> {
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MeterFlow Architecture & System Guides</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
</head>
<body class="bg-slate-950 text-slate-100 min-h-screen font-sans antialiased selection:bg-cyan-500 selection:text-white">
  
  <!-- Header -->
  <header class="border-b border-slate-800 bg-slate-900/50 backdrop-blur sticky top-0 z-50">
    <div class="max-w-7xl mx-auto px-4 py-3.5 flex justify-between items-center gap-4">
      <div class="flex items-center gap-3">
        <a href="/dashboard" class="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-emerald-500 flex items-center justify-center text-slate-950 font-black text-lg shadow-lg shadow-cyan-500/20">
          ⚡
        </a>
        <div>
          <a href="/guides" class="text-base font-bold text-white hover:text-cyan-400 transition">MeterFlow Guides Hub</a>
          <span class="text-xs text-slate-400 block">System Architecture & Engineering Knowledge Base</span>
        </div>
      </div>
      <div class="flex items-center gap-3 text-xs">
        <a href="/dashboard" class="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg flex items-center gap-1.5 transition">
          <i class="fa-solid fa-gauge-high text-cyan-400"></i> Testing Console
        </a>
        <a href="/docs" target="_blank" class="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg flex items-center gap-1.5 transition">
          <i class="fa-solid fa-book text-emerald-400"></i> OpenAPI Docs
        </a>
        <a href="https://github.com/abubakar-ahmed-dev/meterflow-billing-engine" target="_blank" class="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg flex items-center gap-1.5 transition">
          <i class="fa-brands fa-github"></i> GitHub
        </a>
      </div>
    </div>
  </header>

  <!-- Hero Section -->
  <section class="max-w-7xl mx-auto px-4 pt-12 pb-8 border-b border-slate-800/80">
    <div class="max-w-3xl">
      <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-800/80 text-cyan-400 text-xs font-semibold uppercase tracking-wider mb-4">
        <i class="fa-solid fa-graduation-cap"></i> System Documentation
      </div>
      <h1 class="text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight">
        Engineering Guides & Architecture Foundations
      </h1>
      <p class="mt-3 text-slate-400 text-sm sm:text-base leading-relaxed">
        Comprehensive, semi-formal documentation examining how MeterFlow enforces exact idempotency, executes pre-action quota validation, calculates integer token pricing, and cryptographically verifies Stripe webhook synchronizations.
      </p>
    </div>

    <!-- Quick Search Input -->
    <div class="mt-6 max-w-md">
      <div class="relative">
        <i class="fa-solid fa-magnifying-glass absolute left-3.5 top-3 text-slate-500 text-xs"></i>
        <input type="text" id="guide-search" placeholder="Search guides by keyword (e.g. idempotency, 429, tokens, HMAC)..." oninput="filterGuides()" class="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition">
      </div>
    </div>
  </section>

  <!-- Guides Grid -->
  <main class="max-w-7xl mx-auto px-4 py-10">
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="guides-grid">
      ${GUIDES.map(
        (g, idx) => `
        <article class="guide-card flex flex-col bg-slate-900/60 border border-slate-800/80 rounded-xl p-5 hover:border-slate-700 transition hover:shadow-xl hover:shadow-cyan-950/20 group" data-title="${g.title.toLowerCase()}" data-summary="${g.summary.toLowerCase()}" data-category="${g.category.toLowerCase()}">
          <div class="flex items-center justify-between text-xs text-slate-400 mb-3">
            <span class="px-2.5 py-0.5 rounded-full font-semibold text-[11px] bg-slate-800 text-slate-300 border border-slate-700/80">
              ${g.category}
            </span>
            <span class="font-mono text-[11px] flex items-center gap-1 text-slate-400">
              <i class="fa-regular fa-clock text-[10px]"></i> ${g.readTime}
            </span>
          </div>

          <div class="text-2xl mb-2 mt-1">
            <i class="${g.icon}"></i>
          </div>

          <h2 class="text-base font-bold text-white group-hover:text-cyan-400 transition leading-snug">
            <a href="/guides/${g.slug}">
              ${idx + 1}. ${g.title}
            </a>
          </h2>

          <p class="text-xs text-slate-400 mt-2.5 leading-relaxed flex-1">
            ${g.summary}
          </p>

          <div class="mt-5 pt-4 border-t border-slate-800/80 flex items-center justify-between">
            <span class="text-[11px] text-slate-500 font-mono">Guide #${idx + 1}</span>
            <a href="/guides/${g.slug}" class="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1.5 transition">
              Read Guide <i class="fa-solid fa-arrow-right text-[10px]"></i>
            </a>
          </div>
        </article>
      `
      ).join("")}
    </div>
  </main>

  <script>
    function filterGuides() {
      const query = document.getElementById("guide-search").value.toLowerCase();
      const cards = document.querySelectorAll(".guide-card");
      cards.forEach(card => {
        const title = card.getAttribute("data-title");
        const summary = card.getAttribute("data-summary");
        const category = card.getAttribute("data-category");
        const matches = title.includes(query) || summary.includes(query) || category.includes(query);
        card.style.display = matches ? "flex" : "none";
      });
    }
  </script>
</body>
</html>`;

    res.setHeader("Content-Type", "text/html");
    res.status(200).send(html);
  }

  /**
   * GET /guides/:slug
   * Renders a Single Blog-Style Article Page
   */
  public static async renderArticle(req: Request, res: Response): Promise<void> {
    const { slug } = req.params;
    const guideIndex = GUIDES.findIndex((g) => g.slug === slug);

    if (guideIndex === -1) {
      res.status(404).send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Guide Not Found — MeterFlow</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-950 text-slate-100 min-h-screen flex items-center justify-center p-4">
  <div class="max-w-md text-center space-y-4">
    <div class="text-5xl font-black text-cyan-400">404</div>
    <h1 class="text-xl font-bold">Guide Article Not Found</h1>
    <p class="text-sm text-slate-400">The guide you requested does not exist or may have been moved.</p>
    <a href="/guides" class="inline-block px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-lg text-xs">
      &larr; Return to Guides Hub
    </a>
  </div>
</body>
</html>`);
      return;
    }

    const guide = GUIDES[guideIndex];
    const prevGuide = guideIndex > 0 ? GUIDES[guideIndex - 1] : null;
    const nextGuide = guideIndex < GUIDES.length - 1 ? GUIDES[guideIndex + 1] : null;

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${guide.title} — MeterFlow Guides</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  <style>
    pre { background: #090d16; border: 1px solid #1e293b; border-radius: 0.5rem; padding: 0.75rem 1rem; overflow-x: auto; }
    code { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; }
  </style>
</head>
<body class="bg-slate-950 text-slate-100 min-h-screen font-sans antialiased selection:bg-cyan-500 selection:text-white">
  
  <!-- Header -->
  <header class="border-b border-slate-800 bg-slate-900/50 backdrop-blur sticky top-0 z-50">
    <div class="max-w-5xl mx-auto px-4 py-3 flex justify-between items-center gap-4">
      <div class="flex items-center gap-3">
        <a href="/guides" class="text-xs text-slate-400 hover:text-cyan-400 flex items-center gap-1.5 transition">
          <i class="fa-solid fa-arrow-left"></i> Guides Hub
        </a>
        <span class="text-slate-700">|</span>
        <span class="text-xs text-slate-300 font-semibold truncate max-w-[200px] sm:max-w-sm">${guide.title}</span>
      </div>
      <div class="flex items-center gap-3 text-xs">
        <a href="/dashboard" class="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg flex items-center gap-1.5 transition">
          <i class="fa-solid fa-gauge-high text-cyan-400"></i> Testing Console
        </a>
      </div>
    </div>
  </header>

  <!-- Article Container -->
  <main class="max-w-4xl mx-auto px-4 py-12">
    
    <!-- Breadcrumb & Metadata -->
    <div class="flex flex-wrap items-center gap-2 text-xs text-slate-400 mb-4 font-mono">
      <a href="/guides" class="hover:text-cyan-400 transition">Guides</a>
      <span>&rsaquo;</span>
      <span class="text-slate-300">${guide.category}</span>
      <span>&rsaquo;</span>
      <span class="text-cyan-400">Guide #${guideIndex + 1}</span>
    </div>

    <!-- Title & Subtitle -->
    <h1 class="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight leading-tight">
      ${guide.title}
    </h1>
    <p class="text-base sm:text-lg text-slate-300 mt-3 leading-relaxed">
      ${guide.subtitle}
    </p>

    <div class="flex items-center gap-4 py-4 mt-4 border-y border-slate-800/80 text-xs text-slate-400">
      <span class="flex items-center gap-1.5"><i class="fa-regular fa-clock"></i> ${guide.readTime}</span>
      <span>&bull;</span>
      <span class="text-emerald-400 font-semibold flex items-center gap-1.5">
        <i class="fa-solid fa-shield-halved"></i> Semi-Formal Engineering Guide
      </span>
      <span>&bull;</span>
      <a href="https://github.com/abubakar-ahmed-dev/meterflow-billing-engine/blob/main/docs/guides/${guide.slug}.md" target="_blank" class="hover:text-cyan-400 transition flex items-center gap-1">
        <i class="fa-brands fa-markdown"></i> View Markdown
      </a>
    </div>

    <!-- Article Content -->
    <article class="mt-8 prose prose-invert max-w-none space-y-6">
      ${guide.contentHtml}
    </article>

    <!-- Bottom Navigation (Prev / Next) -->
    <div class="mt-14 pt-8 border-t border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4">
      ${
        prevGuide
          ? `
        <a href="/guides/${prevGuide.slug}" class="w-full sm:w-auto p-4 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition text-left space-y-1 group">
          <div class="text-[10px] text-slate-500 uppercase font-bold tracking-wider">&larr; Previous Guide</div>
          <div class="text-xs font-bold text-white group-hover:text-cyan-400 transition">${prevGuide.title}</div>
        </a>
      `
          : `<div class="hidden sm:block"></div>`
      }

      ${
        nextGuide
          ? `
        <a href="/guides/${nextGuide.slug}" class="w-full sm:w-auto p-4 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition text-right space-y-1 group ml-auto">
          <div class="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Next Guide &rarr;</div>
          <div class="text-xs font-bold text-white group-hover:text-cyan-400 transition">${nextGuide.title}</div>
        </a>
      `
          : `<div class="hidden sm:block"></div>`
      }
    </div>

    <!-- Return to Console -->
    <div class="mt-10 text-center">
      <a href="/dashboard" class="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 font-bold rounded-lg text-xs shadow-lg shadow-cyan-500/10 transition">
        <i class="fa-solid fa-gauge-high"></i> Open Interactive Testing Console
      </a>
    </div>

  </main>
</body>
</html>`;

    res.setHeader("Content-Type", "text/html");
    res.status(200).send(html);
  }
}
