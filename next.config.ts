import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['geist'],
  compiler: {
    // Mantém erros/avisos nos logs do Railway.
    removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['error', 'warn'] } : false
  }
};

export default nextConfig;
