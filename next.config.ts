import type { NextConfig } from "next";
import { remoteImagePatterns } from "./src/lib/images";

/**
 * The image allowlist lives in src/lib/images.ts so the gallery can check a URL
 * against the same patterns before handing it to next/image. Add further
 * hostnames there, not here.
 */
const nextConfig: NextConfig = {
  images: {
    remotePatterns: remoteImagePatterns,
  },
};

export default nextConfig;
