import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  basePath: process.env.GITHUB_ACTIONS ? "/zhangxi" : "",
  assetPrefix: process.env.GITHUB_ACTIONS ? "/zhangxi/" : "",
  trailingSlash: true,
};

export default nextConfig;
