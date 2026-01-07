import type { NextConfig } from "next";
import { execSync } from "node:child_process";

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_BUILD_TIMESTAMP:
      process.env.VERCEL_DEPLOYED_AT ?? new Date().toISOString(),
    NEXT_PUBLIC_BUILD_COMMIT:
      process.env.VERCEL_GIT_COMMIT_SHA ?? execSync("git rev-parse --short HEAD").toString().trim(),
  },
};

export default nextConfig;
