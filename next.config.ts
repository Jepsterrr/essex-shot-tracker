import type { NextConfig } from "next";
import withPwa from "@ducanh2912/next-pwa"

const nextConfig: NextConfig = {
  /* config options here */
  swcMinify: true,
};

export default withPwa({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  workboxOptions: {
    disableDevLogs: true,
  },
})(nextConfig)
