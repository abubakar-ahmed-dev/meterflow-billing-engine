#!/usr/bin/env node
/**
 * One-command bootstrap: docker compose up -> migrate (with retry, waiting out
 * Postgres init) -> seed -> build -> start. Used by `npm run up`.
 *
 * A plain TCP probe is not enough: Postgres binds its port before it accepts
 * queries during first-time volume init, so readiness is verified by actually
 * retrying `prisma migrate deploy` until it succeeds.
 */
import { spawn, spawnSync } from "node:child_process";

const MIGRATE_TIMEOUT_MS = 90_000;
const RETRY_DELAY_MS = 2_000;

function run(cmd, args, opts = {}) {
  const res = spawnSync(cmd, args, { stdio: "inherit", shell: process.platform === "win32", ...opts });
  if (res.status !== 0) {
    process.exit(res.status ?? 1);
  }
}

function tryMigrate() {
  const res = spawnSync("npx", ["prisma", "migrate", "deploy"], {
    stdio: "pipe",
    shell: process.platform === "win32",
    encoding: "utf8",
  });
  return res.status === 0 ? { ok: true } : { ok: false, output: `${res.stdout ?? ""}${res.stderr ?? ""}` };
}

console.log("[up] starting docker compose services...");
run("docker", ["compose", "up", "-d"]);

console.log("[up] applying migrations (retrying until Postgres is ready)...");
const startedAt = Date.now();
let lastOutput = "";
for (;;) {
  const attempt = tryMigrate();
  if (attempt.ok) {
    console.log("[up] migrations applied.");
    break;
  }
  lastOutput = attempt.output;
  if (Date.now() - startedAt > MIGRATE_TIMEOUT_MS) {
    console.error(`[up] migrate deploy still failing after ${MIGRATE_TIMEOUT_MS / 1000}s. Last output:\n${lastOutput}`);
    process.exit(1);
  }
  await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
}

run("npm", ["run", "seed"]);
run("npm", ["run", "build"]);

console.log("[up] starting server...");
const server = spawn("npm", ["start"], { stdio: "inherit", shell: process.platform === "win32" });
for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => server.kill(signal));
}
server.on("exit", (code) => process.exit(code ?? 0));
