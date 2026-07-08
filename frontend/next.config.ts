import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  outputFileTracingRoot: process.env.CI ? process.cwd() : path.join(process.cwd(), ".."),
  turbopack: {
    root: process.env.CI ? process.cwd() : path.join(process.cwd(), ".."),
  },
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
};

export default nextConfig;
