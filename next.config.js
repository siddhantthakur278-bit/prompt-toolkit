/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // We need this because we're using 'require' for some local modules in API routes
  experimental: {
    // serverComponentsExternalPackages: ['child_process']
  }
}

module.exports = nextConfig
