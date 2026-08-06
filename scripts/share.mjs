/**
 * One command to put the store on a public HTTPS URL:
 *
 *   npm run share
 *
 * Starts the dev server, opens a Cloudflare quick tunnel in front of it, and
 * prints the link. Both shut down together on Ctrl-C.
 *
 * The link lives only as long as this command runs, and traffic reaches your
 * machine — it is for showing people, not for customers.
 */

import { spawn } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import net from "node:net";

const PORT = Number(process.env.PORT ?? 3000);
const CLOUDFLARED = process.env.CLOUDFLARED ?? "cloudflared";
const ENV_FILE = path.join(process.cwd(), ".env.local");

const children = [];
let shuttingDown = false;

/**
 * Kill a child and everything it spawned.
 *
 * `next dev` and cloudflared both fork workers of their own, so signalling
 * just the process we hold a handle to leaves those workers running — you end
 * up with an orphaned dev server squatting on the port after every Ctrl-C.
 * Children are spawned detached, which makes each one a process-group leader,
 * so a negative PID signals the whole group.
 */
function killTree(child, signal) {
  if (child.exited || child.pid == null) return;
  try {
    if (process.platform === "win32") {
      spawn("taskkill", ["/pid", String(child.pid), "/T", "/F"], { stdio: "ignore" });
    } else {
      process.kill(-child.pid, signal);
    }
  } catch {
    // Already gone, or the group vanished between the check and the signal.
  }
}

function track(child) {
  child.exited = false;
  child.on("exit", () => {
    child.exited = true;
  });
  children.push(child);
  return child;
}

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function shutdown(code = 0) {
  if (shuttingDown) return;
  shuttingDown = true;

  for (const child of children) killTree(child, "SIGTERM");

  // Give them a moment to go quietly, then insist.
  const deadline = Date.now() + 4000;
  while (Date.now() < deadline && children.some((child) => !child.exited)) {
    await delay(100);
  }
  for (const child of children) killTree(child, "SIGKILL");

  await delay(100);
  process.exit(code);
}

process.on("SIGINT", () => {
  console.log("\nShutting down…");
  void shutdown(0);
});
process.on("SIGTERM", () => void shutdown(0));

/**
 * /admin falls back to a published default token in development. A tunnel is
 * public, so leaving that in place hands every order and affiliate to anyone
 * holding the link. Mint a real one before opening the door.
 */
function ensureAdminToken() {
  const existing = fs.existsSync(ENV_FILE) ? fs.readFileSync(ENV_FILE, "utf8") : "";
  const match = existing.match(/^ADMIN_TOKEN=(.+)$/m);
  if (match && match[1].trim() && match[1].trim() !== "dev-admin") {
    return match[1].trim();
  }

  const token = crypto.randomBytes(12).toString("hex");
  const withoutStale = existing.replace(/^ADMIN_TOKEN=.*$/m, "").trimEnd();
  const next = `${withoutStale ? `${withoutStale}\n` : ""}ADMIN_TOKEN=${token}\n`;
  fs.writeFileSync(ENV_FILE, next);
  console.log("Generated a private ADMIN_TOKEN in .env.local (the tunnel is public).");
  return token;
}

function waitForPort(port, timeoutMs = 90_000) {
  const deadline = Date.now() + timeoutMs;
  return new Promise((resolve, reject) => {
    const attempt = () => {
      const socket = net.connect({ port, host: "127.0.0.1" });
      socket.once("connect", () => {
        socket.destroy();
        resolve();
      });
      socket.once("error", () => {
        socket.destroy();
        if (Date.now() > deadline) reject(new Error(`Nothing listening on ${port}`));
        else setTimeout(attempt, 400);
      });
    };
    attempt();
  });
}

function startDevServer() {
  // Spawn Next through this same node binary rather than a shell, so the
  // command behaves the same on Windows as on macOS and Linux.
  const nextBin = path.join(process.cwd(), "node_modules", "next", "dist", "bin", "next");
  if (!fs.existsSync(nextBin)) {
    console.error("Could not find Next.js. Run `npm install` first.");
    process.exit(1);
  }

  const child = track(
    spawn(process.execPath, [nextBin, "dev", "-p", String(PORT)], {
      stdio: ["ignore", "pipe", "pipe"],
      env: process.env,
      detached: process.platform !== "win32",
    }),
  );

  child.stdout.on("data", (chunk) => process.stdout.write(chunk));
  child.stderr.on("data", (chunk) => process.stderr.write(chunk));
  child.on("exit", (code) => {
    if (!shuttingDown) {
      console.error(`\nDev server exited (${code}).`);
      void shutdown(code ?? 1);
    }
  });

  return child;
}

function startTunnel() {
  return new Promise((resolve, reject) => {
    let child;
    try {
      child = spawn(CLOUDFLARED, ["tunnel", "--url", `http://localhost:${PORT}`], {
        stdio: ["ignore", "pipe", "pipe"],
        detached: process.platform !== "win32",
      });
    } catch (cause) {
      reject(cause);
      return;
    }

    child.on("error", (cause) => {
      if (cause.code === "ENOENT") {
        console.error(
          "\ncloudflared is not installed.\n\n" +
            "  macOS         brew install cloudflared\n" +
            "  Windows       winget install --id Cloudflare.cloudflared\n" +
            "  Linux/other   https://github.com/cloudflare/cloudflared/releases\n\n" +
            "Already have it somewhere unusual? Point at it:\n" +
            "  CLOUDFLARED=/path/to/cloudflared npm run share\n",
        );
        void shutdown(1);
      } else {
        reject(cause);
      }
    });

    track(child);

    let settled = false;
    // Keep the last of cloudflared's output. If it dies before producing a
    // URL, its own error message is the only thing that explains why —
    // "cloudflared exited (1)" on its own is useless to whoever is reading.
    const recent = [];
    const scan = (chunk) => {
      const text = chunk.toString();
      recent.push(text);
      if (recent.length > 20) recent.shift();

      const found = text.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/i);
      if (found && !settled) {
        settled = true;
        resolve(found[0]);
      }
    };

    child.stdout.on("data", scan);
    child.stderr.on("data", scan); // cloudflared prints the URL to stderr

    child.on("exit", (code) => {
      if (!shuttingDown && !settled) {
        const detail = recent
          .join("")
          .split("\n")
          .filter((line) => /ERR|error|failed/i.test(line))
          .slice(-4)
          .join("\n");
        reject(
          new Error(
            `cloudflared exited (${code}).` +
              (detail ? `\n\n${detail}` : "") +
              "\n\nIf this mentions an allowlist or a blocked host, the network you are on " +
              "is filtering outbound traffic to Cloudflare — try another network.",
          ),
        );
      } else if (!shuttingDown) {
        console.error("\nTunnel closed.");
        void shutdown(code ?? 1);
      }
    });

    setTimeout(() => {
      if (!settled) reject(new Error("Timed out waiting for a tunnel URL."));
    }, 60_000);
  });
}

const adminToken = ensureAdminToken();

console.log(`Starting the store on port ${PORT}…`);
startDevServer();

try {
  await waitForPort(PORT);
} catch (cause) {
  console.error(cause.message);
  void shutdown(1);
}

console.log("Opening the tunnel…");

let url;
try {
  url = await startTunnel();
} catch (cause) {
  console.error(`\n${cause.message}`);
  void shutdown(1);
}

if (url) {
  console.log(`
────────────────────────────────────────────────────────────
  Your store is live at

    ${url}

  Referral link demo   ${url}/r/DANAWHIT
  Affiliate dashboard  ${url}/affiliates/dashboard
  Admin                ${url}/admin?token=${adminToken}

  Run \`npm run demo\` in another terminal for sample data
  (sign in as dana@example.com / demo1234).

  This link works only while this command is running, and it
  points at this machine. Ctrl-C stops both.
────────────────────────────────────────────────────────────
`);
}
