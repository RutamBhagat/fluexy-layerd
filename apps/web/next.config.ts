import "@fluexy-layerd/env/web";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	typedRoutes: true,
	reactCompiler: true,
	transpilePackages: ["shiki"],
	serverExternalPackages: ["@remotion/bundler", "@remotion/renderer"],
};

export default nextConfig;
