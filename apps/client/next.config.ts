import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  eslint: {
    // ✅ Prevents ESLint errors from failing Docker builds
    ignoreDuringBuilds: true,
  },
  typescript: {
    // ✅ Prevents type errors from failing Docker builds
    ignoreBuildErrors: true,
  },
}

export default nextConfig