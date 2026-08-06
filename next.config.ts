import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["better-sqlite3"],
  // Emits .next/standalone with a self-contained server.js and only the
  // node_modules actually reachable — that is what the Docker image runs.
  output: "standalone",
};

export default nextConfig;
