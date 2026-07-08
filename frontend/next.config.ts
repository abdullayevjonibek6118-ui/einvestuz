import type { NextConfig } from "next";
import fs from "node:fs";
import path from "node:path";

const workspaceRoot = path.join(process.cwd(), "..");
const hasWorkspaceNext = fs.existsSync(path.join(workspaceRoot, "node_modules", "next", "package.json"));
const projectRoot = hasWorkspaceNext ? workspaceRoot : process.cwd();

const nextConfig: NextConfig = {
  outputFileTracingRoot: projectRoot,
  turbopack: {
    root: projectRoot,
  },
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
};

export default nextConfig;
