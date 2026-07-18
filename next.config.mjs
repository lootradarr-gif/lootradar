/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    // oyun ikonları dış kaynaklardan (dexscreener/ipfs/x) gelebilir
    remotePatterns: [{ protocol: 'https', hostname: '**' }],
  },
};
export default nextConfig;
