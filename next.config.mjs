/** @type {import('next').NextConfig} */
const config = {
  experimental: {
    serverComponentsExternalPackages: ['node-ical', 'feedparser'],
  },
};

export default config;
