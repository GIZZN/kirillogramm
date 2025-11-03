import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  // Настройки для production
  poweredByHeader: false,
  compress: true,
  // Гарантируем что API всегда возвращает JSON даже при ошибках
  experimental: {
    serverActions: {
      bodySizeLimit: '100mb', // Увеличен лимит для загрузки видео и больших файлов
    },
  },
};

export default nextConfig;
