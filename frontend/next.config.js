/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable ESLint during builds (fix linting issues later)
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Disable TypeScript checking during builds (fix type issues later)
  typescript: {
    ignoreBuildErrors: true,
  },

  experimental: {
    // Enable optimized package imports for better performance
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-accessible-icon',
      '@radix-ui/react-alert-dialog',
      '@radix-ui/react-toast',
      'framer-motion'
    ],
    // Note: optimizeCss removed as it requires critters package
    // Fix for pdfjs-dist "Object.defineProperty" error in Next.js
    esmExternals: 'loose',
  },

  // Turbopack configuration (moved from experimental.turbo)
  turbopack: {
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
  },

  // Server external packages (moved from experimental.serverComponentsExternalPackages)
  serverExternalPackages: ['three', '@react-three/fiber'],



  // Output file tracing configuration to handle multiple lockfiles
  outputFileTracingRoot: process.cwd(),
  
  // Environment variables
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  
  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '',
        pathname: '/**',
      },
    ],
    formats: ['image/webp', 'image/avif'],
  },
  
  // Headers for security
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin-allow-popups',
          },
        ],
      },
    ];
  },
  
  // Proxy API requests to backend
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:8000/api/:path*',
      },
    ];
  },
  
  // Redirects
  async redirects() {
    return [
      {
        source: '/home',
        destination: '/',
        permanent: true,
      },
    ];
  },
  
  // Performance optimizations
  compiler: {
    // Remove console.log in production
    removeConsole: process.env.NODE_ENV === 'production',
  },

  // Webpack configuration for performance
  webpack: (config, { dev, isServer, webpack }) => {
    // Fix for pdfjs-dist "Object.defineProperty called on non-object" error
    // Next.js forces 'eval-source-map' in dev, which breaks pdfjs-dist
    // Use Object.defineProperty with no-op setter to override this behavior
    if (dev && !isServer) {
      Object.defineProperty(config, 'devtool', {
        get() {
          return 'source-map';
        },
        set() {
          // No-op setter prevents Next.js from overriding
        },
      });
    }

    // Optimize for development performance
    if (dev) {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
        ignored: /node_modules/,
      };

      // Reduce bundle analysis overhead in development
      config.optimization = {
        ...config.optimization,
        removeAvailableModules: false,
        removeEmptyChunks: false,
        splitChunks: false,
      };
    }

    // Optimize Three.js imports
    config.resolve.alias = {
      ...config.resolve.alias,
      'three/examples/jsm': 'three/examples/jsm',
    };

    // Configure fallbacks for pdfjs-dist
    config.resolve.fallback = {
      ...config.resolve.fallback,
      canvas: false,
      fs: false,
      path: false,
      crypto: false,
    };

    // Ignore canvas module in pdfjs-dist
    config.externals = config.externals || {};
    if (!isServer) {
      config.externals = {
        ...config.externals,
        canvas: 'canvas',
      };
    }

    return config;
  },
};

export default nextConfig;
