import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "*.gravatar.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "s.gravatar.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "adsett.s3.amazonaws.com",
        pathname: "/uploads/**",
      },
    ],
  },
};

export default nextConfig;
