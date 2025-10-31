/** @type {import('next').NextConfig} */
const nextConfig = {
  // Image optimization configuration
  images: {
    domains: [
      'res.cloudinary.com',        // Cloudinary images
      'lh3.googleusercontent.com', // Google profile images
    ],
    formats: ['image/avif', 'image/webp'],
  },

  // Server Actions are enabled by default in Next.js 14

  // Webpack configuration
  webpack: (config) => {
    // Fix for some packages that don't work well with webpack
    config.externals.push({
      'utf-8-validate': 'commonjs utf-8-validate',
      'bufferutil': 'commonjs bufferutil',
    });
    return config;
  },

  // Environment variables exposed to the browser
  env: {
    NEXT_PUBLIC_APP_NAME: 'ExamMaster Pro',
    NEXT_PUBLIC_APP_VERSION: '1.0.0',
  },

  // Production optimizations
  swcMinify: true,
  reactStrictMode: true,

  // Headers for security
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          },
        ],
      },
    ];
  },
}

module.exports = nextConfig
