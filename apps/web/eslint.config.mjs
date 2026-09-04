import nextConfig from "eslint-config-next/core-web-vitals";

const config = [{ ignores: [".next/**", "next-env.d.ts"] }, ...nextConfig];

export default config;
