/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
      },
      {
        protocol: 'https',
        hostname: 'utfs.io',
      },
      {
        protocol: 'https',
        hostname: 'bosimages.blob.core.windows.net',
      },
      {
        protocol: 'https',
        hostname: 'img.icons8.com',
      },
      {
        protocol: 'https',
        hostname: 'yagolpa5fi.ufs.sh',
      },
      {
        protocol: 'https',
        hostname: 'bosimages.blob.core.windows.net',
      },
      {
        protocol: 'https',
        hostname: 'example.com',
      },
    ],
  },
};

module.exports = nextConfig;