import type { NextConfig } from "next";
import { execSync } from "node:child_process";

function resolveGitCommit() {
  const commitFromEnv =
    process.env.NEXT_PUBLIC_BUILD_COMMIT ?? process.env.GIT_SHA ?? process.env.VERCEL_GIT_COMMIT_SHA;

  if (commitFromEnv) {
    return commitFromEnv;
  }

  try {
    return execSync("git rev-parse --short HEAD").toString().trim();
  } catch (error) {
    console.warn("Não foi possível obter o hash do commit via git rev-parse.");
    return "unknown";
  }
}

const nextConfig: NextConfig = {
  output: 'standalone',
  env: {
    NEXT_PUBLIC_BUILD_TIMESTAMP: process.env.VERCEL_DEPLOYED_AT ?? new Date().toISOString(),
    NEXT_PUBLIC_BUILD_COMMIT: resolveGitCommit(),
  },
};

export default nextConfig;
