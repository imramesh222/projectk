/** @type {import('next').NextConfig} */
const nextConfig = {
  // Removed 'output: export' to enable server-side features like API routes and middleware
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { 
    unoptimized: true,
    // Add any required image domains here
    domains: ['localhost'],
  },
  // Enable React Strict Mode
  reactStrictMode: true,
  // Enable server-side rendering for all pages by default
  output: 'standalone',
};

module.exports = nextConfig;
