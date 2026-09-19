import nextConfig from "eslint-config-next";

const eslintConfig = [
  ...nextConfig,
  { ignores: ["e2e/**", "tests/**"] },
];

export default eslintConfig;
