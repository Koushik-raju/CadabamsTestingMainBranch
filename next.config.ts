import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  trailingSlash: false,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'strapi-bucket-mindtalk-cadabams.s3.ap-south-1.amazonaws.com' },
      { protocol: 'https', hostname: 'mindtalk-assets.s3.ap-south-1.amazonaws.com' },
      { protocol: 'https', hostname: 'mindtalkbuddy.com' },
      { protocol: 'https', hostname: 'admin.mindtalkbuddy.com' },
      { protocol: 'https', hostname: 'enterprise.mindtalkbuddy.com' },
      { protocol: 'https', hostname: 'firebasestorage.googleapis.com' },
      { protocol: 'https', hostname: 'physiotattava-website.s3.eu-central-1.amazonaws.com' },
      { protocol: 'https', hostname: 'crm.cadabams.com' },
    ],
  },
};

export default nextConfig;
