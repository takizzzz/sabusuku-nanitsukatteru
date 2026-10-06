import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    // 構成ページの公開URLは /@handle。内部では /u/[handle] で受ける
    return [{ source: "/@:handle", destination: "/u/:handle" }];
  },
};

export default nextConfig;
