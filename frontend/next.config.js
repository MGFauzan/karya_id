/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',  
  reactStrictMode: true,
  images: {
    unoptimized: true, 
    domains: ['ui-avatars.com', 'logo.clearbit.com'],
  },
}

module.exports = nextConfig
