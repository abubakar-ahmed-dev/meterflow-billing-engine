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
  <title>MeterFlow — Architecture & Engineering Knowledge Base</title>
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
    .gold-border-glow:hover {
      border-color: rgba(216, 178, 97, 0.45);
      box-shadow: 0 0 25px -4px rgba(216, 178, 97, 0.18);
    }
    ::-webkit-scrollbar { width: 6px; height: 6px; }
    ::-webkit-scrollbar-track { background: #08090b; }
    ::-webkit-scrollbar-thumb { background: #232631; border-radius: 3px; }
    ::-webkit-scrollbar-thumb:hover { background: #323645; }
  </style>
</head>
<body class="min-h-screen selection:bg-champagne-400 selection:text-obsidian-950 flex flex-col justify-between antialiased">
  
  <!-- Navigation Header -->
  <header class="border-b border-obsidian-750 bg-obsidian-950/85 backdrop-blur-md sticky top-0 z-50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex justify-between items-center gap-4">
      <div class="flex items-center gap-3">
        <a href="/" class="w-9 h-9 rounded-xl bg-gradient-to-br from-champagne-300 via-champagne-500 to-champagne-700 p-[1px] flex items-center justify-center text-obsidian-950 shadow-md shadow-champagne-500/10">
          <div class="w-full h-full bg-obsidian-950 rounded-[10px] flex items-center justify-center text-champagne-300 hover:text-champagne-200 transition">
            <i class="fa-solid fa-bolt-lightning text-sm"></i>
          </div>
        </a>
        <div class="flex items-center gap-2 text-xs">
          <a href="/" class="text-sand-400 hover:text-champagne-300 font-medium transition">Home</a>
          <span class="text-obsidian-600">/</span>
          <span class="text-sand-100 font-bold">Knowledge Base</span>
        </div>
      </div>
      
      <div class="flex items-center gap-2 sm:gap-3 text-xs">
        <a href="/dashboard" class="px-3.5 py-1.5 bg-obsidian-850 hover:bg-obsidian-800 text-sand-200 border border-obsidian-700 hover:border-champagne-500/40 rounded-lg flex items-center gap-1.5 font-semibold transition">
          <i class="fa-solid fa-sliders text-champagne-400"></i> Testing Console
        </a>
        <a href="/docs" target="_blank" class="px-3.5 py-1.5 bg-obsidian-850 hover:bg-obsidian-800 text-sand-300 border border-obsidian-700 rounded-lg flex items-center gap-1.5 transition">
          <i class="fa-solid fa-file-code text-sand-400"></i> OpenAPI Specs
        </a>
        <a href="https://github.com/abubakar-ahmed-dev/meterflow-billing-engine" target="_blank" class="px-3.5 py-1.5 bg-obsidian-850 hover:bg-obsidian-800 text-sand-400 hover:text-sand-200 border border-obsidian-700 rounded-lg flex items-center gap-1.5 transition">
          <i class="fa-brands fa-github text-sm"></i>
        </a>
      </div>
    </div>
  </header>

  <!-- Hero Section -->
  <section class="max-w-7xl mx-auto px-4 sm:px-6 pt-12 pb-8 border-b border-obsidian-800/80">
    <div class="max-w-3xl">
      <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-obsidian-850 border border-champagne-500/30 text-champagne-300 text-xs font-semibold uppercase tracking-wider mb-4">
        <i class="fa-solid fa-graduation-cap text-champagne-400"></i> System Documentation
      </div>
      <h1 class="text-3xl sm:text-4xl font-black text-sand-100 tracking-tight leading-tight">
        Engineering Guides & Architecture Foundations
      </h1>
      <p class="mt-3 text-sand-300 text-sm sm:text-base leading-relaxed">
        Semi-formal technical documentation explaining how MeterFlow enforces exact idempotency, executes pre-action quota validation, calculates integer token pricing, and cryptographically verifies Stripe webhook synchronizations.
      </p>
    </div>

    <!-- Quick Search Input -->
    <div class="mt-8 max-w-md">
      <div class="relative">
        <i class="fa-solid fa-magnifying-glass absolute left-3.5 top-3 text-sand-400 text-xs"></i>
        <input type="text" id="guide-search" placeholder="Search guides (e.g. idempotency, 429, tokens, HMAC)..." oninput="filterGuides()" class="w-full bg-obsidian-900 border border-obsidian-750 rounded-xl pl-9 pr-4 py-2.5 text-xs text-sand-200 placeholder-sand-500 focus:outline-none focus:border-champagne-400 transition">
      </div>
    </div>
  </section>

  <!-- Guides Grid -->
  <main class="max-w-7xl mx-auto px-4 sm:px-6 py-10 flex-1">
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="guides-grid">
      ${GUIDES.map(
        (g, idx) => `
        <article class="guide-card flex flex-col bg-obsidian-900 border border-obsidian-750 rounded-2xl p-6 hover:border-champagne-500/40 transition group gold-border-glow" data-title="${g.title.toLowerCase()}" data-summary="${g.summary.toLowerCase()}" data-category="${g.category.toLowerCase()}">
          <div class="flex items-center justify-between text-xs text-sand-400 mb-3">
            <span class="px-2.5 py-0.5 rounded-full font-semibold text-[11px] bg-obsidian-800 text-champagne-300 border border-champagne-500/30">
              ${g.category}
            </span>
            <span class="font-mono text-[11px] flex items-center gap-1 text-sand-400">
              <i class="fa-regular fa-clock text-[10px]"></i> ${g.readTime}
            </span>
          </div>

          <div class="text-2xl mb-2 mt-1 text-champagne-400">
            <i class="${g.icon}"></i>
          </div>

          <h2 class="text-base font-bold text-sand-100 group-hover:text-champagne-300 transition leading-snug">
            <a href="/guides/${g.slug}">
              ${idx + 1}. ${g.title}
            </a>
          </h2>

          <p class="text-xs text-sand-400 mt-2.5 leading-relaxed flex-1">
            ${g.summary}
          </p>

          <div class="mt-6 pt-4 border-t border-obsidian-750 flex items-center justify-between">
            <span class="text-[11px] text-sand-500 font-mono">Guide #${idx + 1}</span>
            <a href="/guides/${g.slug}" class="text-xs font-bold text-champagne-400 hover:text-champagne-300 flex items-center gap-1.5 transition">
              Read Guide <i class="fa-solid fa-arrow-right text-[10px]"></i>
            </a>
          </div>
        </article>
      `
      ).join("")}
    </div>
  </main>

  <!-- Global Footer -->
  <footer class="border-t border-obsidian-800 bg-obsidian-950 text-sand-400 text-xs py-8 mt-12">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
      <div class="flex items-center gap-2">
        <span class="text-champagne-400 font-bold">⚡ MeterFlow Engine</span>
        <span class="text-sand-500">|</span>
        <span class="text-sand-400">Architecture Guides Hub</span>
      </div>
      <div class="flex items-center gap-4 text-sand-300">
        <a href="/" class="hover:text-champagne-300 transition">Home</a>
        <a href="/dashboard" class="hover:text-champagne-300 transition">Testing Console</a>
        <a href="/docs" target="_blank" class="hover:text-champagne-300 transition">API Specs</a>
        <a href="/health" target="_blank" class="hover:text-champagne-300 transition">Health</a>
      </div>
    </div>
  </footer>

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
<body class="bg-[#08090b] text-[#e6e4df] min-h-screen flex items-center justify-center p-4">
  <div class="max-w-md text-center space-y-4">
    <div class="text-5xl font-black text-[#d4af37]">404</div>
    <h1 class="text-xl font-bold">Guide Article Not Found</h1>
    <p class="text-sm text-[#9d998c]">The guide you requested does not exist or may have been moved.</p>
    <a href="/guides" class="inline-block px-4 py-2 bg-[#d4af37] hover:bg-[#b0822f] text-[#070809] font-bold rounded-lg text-xs">
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
  <title>${guide.title} — MeterFlow Architecture Guides</title>
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
    pre {
      background: #0c0d10;
      border: 1px solid #232631;
      border-radius: 0.75rem;
      padding: 1rem 1.25rem;
      overflow-x: auto;
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.8125rem;
      color: #e8e6df;
    }
    code {
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.85em;
      color: #e3c583;
    }
    h2 { font-size: 1.5rem; font-weight: 800; color: #f7f6f2; margin-top: 2rem; margin-bottom: 0.75rem; }
    h3 { font-size: 1.2rem; font-weight: 700; color: #f7f6f2; margin-top: 1.5rem; margin-bottom: 0.5rem; }
    p { margin-bottom: 1.25rem; line-height: 1.75; color: #d2cfc4; }
    ul { list-style-type: disc; padding-left: 1.5rem; margin-bottom: 1.25rem; }
    li { margin-bottom: 0.5rem; color: #d2cfc4; }
    blockquote {
      border-left: 3px solid #d9ad54;
      padding-left: 1rem;
      font-style: italic;
      color: #eddcb3;
      margin: 1.5rem 0;
    }
    ::-webkit-scrollbar { width: 6px; height: 6px; }
    ::-webkit-scrollbar-track { background: #08090b; }
    ::-webkit-scrollbar-thumb { background: #232631; border-radius: 3px; }
  </style>
</head>
<body class="min-h-screen selection:bg-champagne-400 selection:text-obsidian-950 flex flex-col justify-between antialiased">
  
  <!-- Navigation Header -->
  <header class="border-b border-obsidian-750 bg-obsidian-950/85 backdrop-blur-md sticky top-0 z-50">
    <div class="max-w-5xl mx-auto px-4 sm:px-6 py-3.5 flex justify-between items-center gap-4">
      <div class="flex items-center gap-3">
        <a href="/guides" class="text-xs text-sand-400 hover:text-champagne-300 flex items-center gap-1.5 transition">
          <i class="fa-solid fa-arrow-left"></i> Guides Hub
        </a>
        <span class="text-obsidian-600">|</span>
        <span class="text-xs text-sand-200 font-semibold truncate max-w-[200px] sm:max-w-md">${guide.title}</span>
      </div>
      <div class="flex items-center gap-3 text-xs">
        <a href="/dashboard" class="px-3.5 py-1.5 bg-obsidian-850 hover:bg-obsidian-800 text-sand-200 border border-obsidian-700 hover:border-champagne-500/40 rounded-lg flex items-center gap-1.5 font-semibold transition">
          <i class="fa-solid fa-sliders text-champagne-400"></i> Testing Console
        </a>
      </div>
    </div>
  </header>

  <!-- Article Container -->
  <main class="max-w-4xl mx-auto px-4 sm:px-6 py-12 flex-1">
    
    <!-- Breadcrumb & Metadata -->
    <div class="flex flex-wrap items-center gap-2 text-xs text-sand-400 mb-4 font-mono">
      <a href="/" class="hover:text-champagne-300 transition">Home</a>
      <span>&rsaquo;</span>
      <a href="/guides" class="hover:text-champagne-300 transition">Guides</a>
      <span>&rsaquo;</span>
      <span class="text-sand-300">${guide.category}</span>
      <span>&rsaquo;</span>
      <span class="text-champagne-300">Guide #${guideIndex + 1}</span>
    </div>

    <!-- Title & Subtitle -->
    <h1 class="text-2xl sm:text-3xl md:text-4xl font-extrabold text-sand-100 tracking-tight leading-tight">
      ${guide.title}
    </h1>
    <p class="text-base sm:text-lg text-sand-300 mt-3 leading-relaxed">
      ${guide.subtitle}
    </p>

    <div class="flex flex-wrap items-center gap-4 py-4 mt-5 border-y border-obsidian-750 text-xs text-sand-400">
      <span class="flex items-center gap-1.5"><i class="fa-regular fa-clock"></i> ${guide.readTime}</span>
      <span>&bull;</span>
      <span class="text-champagne-300 font-semibold flex items-center gap-1.5">
        <i class="fa-solid fa-shield-halved"></i> Semi-Formal Technical Guide
      </span>
      <span>&bull;</span>
      <a href="https://github.com/abubakar-ahmed-dev/meterflow-billing-engine/blob/main/docs/guides/${guide.slug}.md" target="_blank" class="hover:text-champagne-300 transition flex items-center gap-1">
        <i class="fa-brands fa-markdown text-champagne-400"></i> View Markdown
      </a>
    </div>

    <!-- Article Content -->
    <article class="mt-8 space-y-6">
      ${guide.contentHtml}
    </article>

    <!-- Bottom Navigation (Prev / Next) -->
    <div class="mt-14 pt-8 border-t border-obsidian-750 flex flex-col sm:flex-row justify-between items-center gap-4">
      ${
        prevGuide
          ? `
        <a href="/guides/${prevGuide.slug}" class="w-full sm:w-auto p-4 rounded-xl bg-obsidian-900 border border-obsidian-750 hover:border-champagne-500/40 transition text-left space-y-1 group">
          <div class="text-[10px] text-sand-500 uppercase font-bold tracking-wider">&larr; Previous Guide</div>
          <div class="text-xs font-bold text-sand-100 group-hover:text-champagne-300 transition">${prevGuide.title}</div>
        </a>
      `
          : `<div class="hidden sm:block"></div>`
      }

      ${
        nextGuide
          ? `
        <a href="/guides/${nextGuide.slug}" class="w-full sm:w-auto p-4 rounded-xl bg-obsidian-900 border border-obsidian-750 hover:border-champagne-500/40 transition text-right space-y-1 group ml-auto">
          <div class="text-[10px] text-sand-500 uppercase font-bold tracking-wider">Next Guide &rarr;</div>
          <div class="text-xs font-bold text-sand-100 group-hover:text-champagne-300 transition">${nextGuide.title}</div>
        </a>
      `
          : `<div class="hidden sm:block"></div>`
      }
    </div>

    <!-- Return to Console -->
    <div class="mt-12 text-center">
      <a href="/dashboard" class="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-champagne-400 via-champagne-500 to-champagne-600 hover:from-champagne-300 hover:to-champagne-500 text-obsidian-950 font-bold rounded-xl text-xs shadow-lg shadow-champagne-500/10 transition transform hover:-translate-y-0.5">
        <i class="fa-solid fa-sliders"></i> Open Interactive Testing Console
      </a>
    </div>

  </main>

  <!-- Global Footer -->
  <footer class="border-t border-obsidian-800 bg-obsidian-950 text-sand-400 text-xs py-8 mt-12">
    <div class="max-w-4xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
      <div class="flex items-center gap-2">
        <span class="text-champagne-400 font-bold">⚡ MeterFlow Engine</span>
        <span class="text-sand-500">|</span>
        <span class="text-sand-400">Engineering Documentation</span>
      </div>
      <div class="flex items-center gap-4 text-sand-300">
        <a href="/" class="hover:text-champagne-300 transition">Home</a>
        <a href="/dashboard" class="hover:text-champagne-300 transition">Testing Console</a>
        <a href="/guides" class="hover:text-champagne-300 transition">Guides Hub</a>
        <a href="/docs" target="_blank" class="hover:text-champagne-300 transition">API Specs</a>
      </div>
    </div>
  </footer>

</body>
</html>`;

    res.setHeader("Content-Type", "text/html");
    res.status(200).send(html);
  }
}
