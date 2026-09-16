import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Generated and vendored trees that are not ours to lint.
    "node_modules/**",
    "src/generated/**",
    // A local database instance, if one was ever placed inside the project.
    ".local/**",
  ]),
  {
    // The acceptance test pokes at arbitrary JSON coming back over HTTP, which
    // is exactly the situation `any` exists for. Console output is its report.
    files: ["scripts/**/*.ts", "prisma/**/*.ts"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "no-console": "off",
    },
  },
]);

export default eslintConfig;
