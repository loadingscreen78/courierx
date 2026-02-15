const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // Image optimization
  images: {
    domains: ['nndcxvvulrxnfjoorjzz.supabase.co'],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  
  // Preserve trailing slashes for consistency
  trailingSlash: false,
  
  // Compression
  compress: true,
  
  // Power by header
  poweredByHeader: false,
  
  // Enable experimental features
  experimental: {
    // Optimize package imports for better bundle size
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-icons',
      'framer-motion',
      'recharts',
    ],
    // Server actions
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  
  // Webpack config for path aliases and optimizations
  webpack: (config, { dev, isServer }) => {
    // Path aliases
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': require('path').resolve(__dirname, './src'),
    };
    
    // Production optimizations
    if (!dev && !isServer) {
      // Tree shaking
      config.optimization = {
        ...config.optimization,
        usedExports: true,
        sideEffects: false,
      };
    }
    
    return config;
  },
  
  // Headers for security and performance
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
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
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
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          },
        ],
      },
      {
        source: '/fonts/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

module.exports = withBundleAnalyzer(nextConfig);
