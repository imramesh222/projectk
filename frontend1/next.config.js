/** @type {import('next').NextConfig} */
const path = require('path');

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
  
  // Configure module path aliases
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, '.'),
    };
    return config;
  },
};

module.exports = nextConfig;
