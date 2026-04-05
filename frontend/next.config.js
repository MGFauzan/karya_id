/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',  // ← tambahkan ini
  reactStrictMode: true,
  images: {
    unoptimized: true,  // ← wajib untuk static export
    domains: ['ui-avatars.com', 'logo.clearbit.com'],
  },
}

module.exports = nextConfig
