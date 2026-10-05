/**
 * Shared page shell and design tokens for all server-rendered pages.
 * Single source of the obsidian/champagne identity: Tailwind palette config,
 * base CSS, sticky nav, and footer. Pages pass their content and highlight
 * their nav entry.
 */

export interface BasePageOptions {
  title: string;
  description: string;
  activeNav?: "home" | "console" | "guides" | "docs";
  content: string;
}

const TAILWIND_CONFIG = `
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
              750: '#1c1f27',
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
`;

const BASE_CSS = `
    body {
      background-color: #08090b;
      color: #e6e4df;
      font-family: 'Plus Jakarta Sans', sans-serif;
    }
    .gold-gradient-text {
      background: linear-gradient(135deg, #fcedcb 0%, #d8b261 50%, #b88a32 100%);
      -webkit-background-clip: text;
      background-clip: text;
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
    a:focus-visible, button:focus-visible, [tabindex]:focus-visible {
      outline: 2px solid #d9ad54;
      outline-offset: 2px;
      border-radius: 6px;
    }
    /* Scroll reveal: content fades up as it enters the viewport. */
    .reveal {
      opacity: 0;
      transform: translateY(24px);
      transition: opacity 0.7s ease, transform 0.7s ease;
    }
    .reveal.is-visible {
      opacity: 1;
      transform: translateY(0);
    }
    @media (prefers-reduced-motion: reduce) {
      .reveal { opacity: 1; transform: none; transition: none; }
      html { scroll-behavior: auto; }
    }
`;

const REVEAL_SCRIPT = `
    (function () {
      var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (reduced || !('IntersectionObserver' in window)) {
        document.querySelectorAll('.reveal').forEach(function (el) { el.classList.add('is-visible'); });
        return;
      }
      var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.15 });
      document.querySelectorAll('.reveal').forEach(function (el) { observer.observe(el); });
    })();
`;

const NAV_LINKS: Array<{ href: string; label: string; key: string; external?: boolean }> = [
  { href: "/dashboard", label: "Console", key: "console" },
  { href: "/guides", label: "Guides", key: "guides" },
  { href: "/docs", label: "API Docs", key: "docs", external: true },
];

function renderNav(active?: string): string {
  const links = NAV_LINKS.map((link) => {
    const isActive = link.key === active;
    const color = isActive ? "text-champagne-300" : "text-sand-300 hover:text-champagne-300";
    const external = link.external ? ' target="_blank" rel="noopener"' : "";
    return `<a href="${link.href}"${external} class="${color} transition text-sm font-medium"${isActive ? ' aria-current="page"' : ""}>${link.label}</a>`;
  }).join("\n        ");

  return `
  <a href="#main" class="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[60] focus:px-3 focus:py-2 focus:rounded-lg focus:bg-champagne-400 focus:text-obsidian-950 focus:text-sm focus:font-bold">Skip to content</a>
  <header class="border-b border-obsidian-700/70 bg-obsidian-950/85 backdrop-blur-md sticky top-0 z-50">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4">
      <a href="/" class="flex items-center gap-2.5 group" aria-label="MeterFlow home">
        <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-champagne-300 via-champagne-500 to-champagne-700 p-[1px]">
          <div class="w-full h-full bg-obsidian-950 rounded-[7px] flex items-center justify-center text-champagne-300 text-sm group-hover:scale-105 transition transform">
            <i class="fa-solid fa-bolt-lightning" aria-hidden="true"></i>
          </div>
        </div>
        <span class="text-lg font-bold tracking-tight text-sand-100 group-hover:text-champagne-200 transition">MeterFlow</span>
      </a>
      <nav class="hidden sm:flex items-center gap-5 sm:gap-7" aria-label="Primary">
        ${links}
        <a href="https://github.com/abubakar-ahmed-dev/meterflow-billing-engine" target="_blank" rel="noopener"
           class="text-sand-400 hover:text-champagne-300 transition" aria-label="GitHub repository">
          <i class="fa-brands fa-github text-base" aria-hidden="true"></i>
        </a>
      </nav>
      <a href="https://github.com/abubakar-ahmed-dev/meterflow-billing-engine" target="_blank" rel="noopener"
         class="sm:hidden text-sand-400 hover:text-champagne-300 transition" aria-label="GitHub repository">
        <i class="fa-brands fa-github text-base" aria-hidden="true"></i>
      </a>
    </div>
  </header>`;
}

function renderFooter(): string {
  return `
  <footer class="border-t border-obsidian-800/80 bg-obsidian-950 text-sand-400 text-xs py-10">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-6">
      <div class="flex items-center gap-2.5">
        <div class="w-7 h-7 rounded-lg bg-champagne-500/20 border border-champagne-500/40 flex items-center justify-center text-champagne-400 text-xs">
          <i class="fa-solid fa-bolt-lightning" aria-hidden="true"></i>
        </div>
        <div>
          <span class="text-sand-200 font-bold">MeterFlow Billing Engine</span>
          <span class="text-sand-500 block text-[11px]">Usage metering &middot; Quota boundaries &middot; Nano-dollar precision</span>
        </div>
      </div>
      <div class="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sand-300">
        <a href="/" class="hover:text-champagne-300 transition">Home</a>
        <a href="/dashboard" class="hover:text-champagne-300 transition">Testing Console</a>
        <a href="/guides" class="hover:text-champagne-300 transition">Architecture Guides</a>
        <a href="/docs" target="_blank" rel="noopener" class="hover:text-champagne-300 transition">OpenAPI Docs</a>
        <a href="/health" target="_blank" rel="noopener" class="hover:text-champagne-300 transition">Health</a>
      </div>
      <div class="text-[11px] text-sand-500 text-center md:text-right font-mono">
        <div>Node.js &middot; TypeScript &middot; PostgreSQL &middot; Stripe</div>
        <div>abubakar-ahmed-dev</div>
      </div>
    </div>
  </footer>`;
}

export function renderBase(options: BasePageOptions): string {
  const { title, description, activeNav, content } = options;
  return `<!DOCTYPE html>
<html lang="en" class="scroll-smooth">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="${description}">
  <title>${title}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
  <script>${TAILWIND_CONFIG}</script>
  <style>${BASE_CSS}</style>
</head>
<body class="min-h-screen flex flex-col selection:bg-champagne-400 selection:text-obsidian-950">
  ${renderNav(activeNav)}
  <main id="main" class="flex-1">
    ${content}
  </main>
  ${renderFooter()}
  <script>${REVEAL_SCRIPT}</script>
</body>
</html>`;
}
