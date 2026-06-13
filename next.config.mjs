/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['three', '@react-three/fiber', '@react-three/drei'],
  images: { unoptimized: true },
  eslint: {
    ignoreDuringBuilds: true,
  }
};

export default nextConfig;
