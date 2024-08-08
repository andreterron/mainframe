//@ts-check

import { withContentlayer } from "next-contentlayer2";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  transpilePackages: ['lucide-react']
}

export default withContentlayer(nextConfig);
