import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(process.cwd(), ".."),
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
};

export default nextConfig;
