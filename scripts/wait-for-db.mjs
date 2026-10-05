#!/usr/bin/env node
/**
 * Blocks until the PostgreSQL server from DATABASE_URL accepts TCP connections.
 * Used by `npm run up` so `prisma migrate deploy` never races container startup.
 * Node's net module only — no dependencies, runs before npm install order matters.
 */
import net from "node:net";
import { setTimeout as sleep } from "node:timers/promises";
import { readFileSync } from "node:fs";

// Plain-node process: no dotenv pipeline yet at this point in `npm run up`.
// Fall back to reading .env directly when DATABASE_URL is not exported.
let DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  try {
    const envFile = readFileSync(new URL("../.env", import.meta.url), "utf8");
    const match = envFile.match(/^\s*DATABASE_URL\s*=\s*"?([^"\r\n]+)"?\s*$/m);
    if (match) {
      DATABASE_URL = match[1].trim();
    }
  } catch {
    // .env missing — reported below.
  }
}
if (!DATABASE_URL) {
  console.error("wait-for-db: DATABASE_URL is not set (copy .env.example to .env first).");
  process.exit(1);
}

let host = "localhost";
let port = 5432;
try {
  const url = new URL(DATABASE_URL.replace(/^postgresql:/, "http:"));
  host = url.hostname || host;
  port = Number(url.port) || port;
} catch {
  console.error(`wait-for-db: could not parse DATABASE_URL host/port, defaulting to ${host}:${port}`);
}

const TIMEOUT_MS = 60_000;
const INTERVAL_MS = 1_000;
const startedAt = Date.now();

process.stdout.write(`wait-for-db: probing ${host}:${port} `);

while (Date.now() - startedAt < TIMEOUT_MS) {
  const open = await new Promise((resolve) => {
    const socket = net.connect({ host, port, timeout: 2_000 });
    socket.once("connect", () => {
      socket.destroy();
      resolve(true);
    });
    socket.once("error", () => resolve(false));
    socket.once("timeout", () => {
      socket.destroy();
      resolve(false);
    });
  });

  if (open) {
    console.log("ready");
    process.exit(0);
  }
  process.stdout.write(".");
  await sleep(INTERVAL_MS);
}

console.error(`\nwait-for-db: database not reachable after ${TIMEOUT_MS / 1000}s. Is 'docker compose up -d' running?`);
process.exit(1);
