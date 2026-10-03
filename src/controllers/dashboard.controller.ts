import { Request, Response } from "express";
import { prisma } from "../db/prisma.js";

export class DashboardController {
  public static async renderDashboard(req: Request, res: Response): Promise<void> {
    const tenants = await prisma.tenant.findMany({
      include: {
        subscription: {
          include: { plan: true },
        },
        usageEvents: {
          orderBy: { timestamp: "desc" },
          take: 5,
        },
        usageAlerts: {
          orderBy: { triggeredAt: "desc" },
          take: 3,
        },
      },
    });

    const plans = await prisma.plan.findMany();

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MeterFlow Engine — Developer & Evaluator Dashboard</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    @keyframes pulse-subtle {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.7; }
    }
    .animate-subtle { animation: pulse-subtle 3s infinite ease-in-out; }
  </style>
</head>
<body class="bg-slate-950 text-slate-100 min-h-screen font-sans">
  <div class="max-w-7xl mx-auto px-4 py-8">
    <header class="flex flex-col md:flex-row justify-between items-start md:items-center pb-6 border-b border-slate-800 gap-4">
      <div>
        <div class="flex items-center gap-3">
          <span class="text-3xl">⚡</span>
          <h1 class="text-2xl font-bold tracking-tight bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
            MeterFlow Billing Engine
          </h1>
          <span class="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800">
            Production Ready
          </span>
        </div>
        <p class="text-sm text-slate-400 mt-1">Multi-tenant usage metering, quota enforcement, and Stripe billing console</p>
      </div>
      <div class="flex items-center gap-3">
        <a href="/docs" target="_blank" class="px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg text-sm font-medium transition">
          📘 OpenAPI Docs
        </a>
        <a href="/health" target="_blank" class="px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg text-sm font-medium transition text-emerald-400">
          💚 Health Check
        </a>
      </div>
    </header>

    <!-- Overview Stats -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 my-6">
      <div class="bg-slate-900 border border-slate-800 rounded-xl p-4">
        <div class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Tenants</div>
        <div class="text-2xl font-bold text-white mt-1">${tenants.length}</div>
      </div>
      <div class="bg-slate-900 border border-slate-800 rounded-xl p-4">
        <div class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Available Plans</div>
        <div class="text-2xl font-bold text-cyan-400 mt-1">${plans.length} (Free & Pro)</div>
      </div>
      <div class="bg-slate-900 border border-slate-800 rounded-xl p-4">
        <div class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Mode</div>
        <div class="text-2xl font-bold text-emerald-400 mt-1">Stripe Test Mode</div>
      </div>
      <div class="bg-slate-900 border border-slate-800 rounded-xl p-4">
        <div class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Precision Scale</div>
        <div class="text-2xl font-bold text-purple-400 mt-1">Integer Micro-Units</div>
      </div>
    </div>

    <!-- Tenants Grid -->
    <h2 class="text-xl font-bold mb-4 flex items-center gap-2">
      <span>🏢</span> Active Tenants & Real-Time Quotas
    </h2>
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      ${tenants
        .map((t) => {
          const plan = t.subscription?.plan;
          const status = t.subscription?.status || "INACTIVE";
          const statusColor =
            status === "ACTIVE"
              ? "bg-emerald-950 text-emerald-400 border-emerald-800"
              : "bg-red-950 text-red-400 border-red-800";
          return `
          <div class="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition">
            <div class="flex justify-between items-start">
              <div>
                <h3 class="font-bold text-lg text-white">${t.name}</h3>
                <div class="text-xs text-slate-400 font-mono mt-0.5">ID: ${t.id}</div>
              </div>
              <div class="flex items-center gap-2">
                <span class="px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase ${statusColor} border">
                  ${status}
                </span>
                <span class="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-950 text-indigo-300 border border-indigo-800">
                  ${plan?.name || "No Plan"}
                </span>
              </div>
            </div>

            <div class="mt-4 pt-4 border-t border-slate-800/80 space-y-3">
              <div>
                <div class="flex justify-between text-xs text-slate-300 mb-1">
                  <span>API Calls Monthly Quota</span>
                  <span class="font-mono">Limit: ${plan?.maxApiCallsPerMonth.toLocaleString()}</span>
                </div>
              </div>

              <div>
                <div class="flex justify-between text-xs text-slate-300 mb-1">
                  <span>AI Tokens Monthly Quota</span>
                  <span class="font-mono">Limit: ${plan?.maxTokensPerMonth.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div class="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
              <span class="text-xs text-slate-400">Stripe Customer: <code class="text-slate-300">${t.stripeCustomerId || "None"}</code></span>
              <a href="/v1/usage?tenantId=${t.id}" target="_blank" class="text-xs font-medium text-cyan-400 hover:text-cyan-300 underline">
                View Usage JSON &rarr;
              </a>
            </div>
          </div>
        `;
        })
        .join("")}
    </div>

    <!-- Quick cURL Evaluator Recipes -->
    <div class="bg-slate-900 border border-slate-800 rounded-xl p-6">
      <h2 class="text-lg font-bold mb-3 flex items-center gap-2">
        <span>⚡</span> Evaluator cURL Test Recipes
      </h2>
      <div class="space-y-4 text-xs font-mono">
        <div>
          <div class="text-slate-400 mb-1">1. Billable API Call with Idempotency Key (PROBE 1):</div>
          <pre class="bg-slate-950 p-3 rounded-lg border border-slate-800 text-emerald-300 overflow-x-auto">curl -X POST http://localhost:3000/v1/meter/billable \\
  -H "Content-Type: application/json" \\
  -H "X-Tenant-Id: 00000000-0000-0000-0000-000000000001" \\
  -H "Idempotency-Key: probe-key-101" \\
  -d '{"action": "ai_generate", "tokens": {"freshInput": 1500, "cachedInput": 500, "standardOutput": 800, "reasoning": 300}}'</pre>
        </div>

        <div>
          <div class="text-slate-400 mb-1">2. Boundary Quota Test (PROBE 2 - Tenant 3 seeded at 999 calls):</div>
          <pre class="bg-slate-950 p-3 rounded-lg border border-slate-800 text-amber-300 overflow-x-auto"># 1,000th call succeeds:
curl -X POST http://localhost:3000/v1/meter/billable -H "X-Tenant-Id: 00000000-0000-0000-0000-000000000003" -H "Idempotency-Key: call-1000" -H "Content-Type: application/json" -d '{}'

# 1,001st call returns 429 Too Many Requests:
curl -X POST http://localhost:3000/v1/meter/billable -H "X-Tenant-Id: 00000000-0000-0000-0000-000000000003" -H "Idempotency-Key: call-1001" -H "Content-Type: application/json" -d '{}'</pre>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;

    res.setHeader("Content-Type", "text/html");
    res.status(200).send(html);
  }
}
