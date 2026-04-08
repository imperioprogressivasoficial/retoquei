import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'supabase.co',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/**',
      },
    ],
  },

  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000', process.env.NEXT_PUBLIC_APP_URL ?? ''],
    },
  },

  typescript: {
    ignoreBuildErrors: true,
  },

  eslint: {
    ignoreDuringBuilds: true,
  },
}

export default nextConfig
