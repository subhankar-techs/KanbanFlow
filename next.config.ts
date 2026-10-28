import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Dev server only trusts localhost by default; allow 127.0.0.1 so pages hydrate there too.
  allowedDevOrigins: ["127.0.0.1"],
};

export default nextConfig;
