import { FlatCompat } from "@eslint/eslintrc";

const compat = new FlatCompat({
  baseDirectory: import.meta.dirname,
});

const eslintConfig = [
  { ignores: [".next/**", "node_modules/**"] },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  { files: ["next-env.d.ts"], rules: { "@typescript-eslint/triple-slash-reference": "off" } },
];

export default eslintConfig;
