import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import sonarjs from "eslint-plugin-sonarjs";
import security from "eslint-plugin-security";
import unicorn from "eslint-plugin-unicorn";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  sonarjs.configs.recommended,
  security.configs.recommended,
  unicorn.configs.recommended,
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "sonarjs/no-duplicate-string": "off",
      "sonarjs/no-dead-store": "off",
      "sonarjs/no-nested-conditional": "off",
      "sonarjs/no-nested-functions": "off",
      "sonarjs/no-unused-vars": "off",
      "sonarjs/pseudo-random": "off",
      "sonarjs/redundant-type-aliases": "off",
      "sonarjs/unused-import": "off",
      "sonarjs/use-type-alias": "off",
      "sonarjs/concise-regex": "off",
      "react/no-unescaped-entities": "off",
      "@next/next/no-img-element": "off",
      "unicorn/prevent-abbreviations": "off",
      "unicorn/consistent-function-scoping": "off",
      "unicorn/no-array-for-each": "off",
      "unicorn/no-nested-ternary": "off",
      "unicorn/no-object-as-default-parameter": "off",
      "unicorn/prefer-string-slice": "off",
      "unicorn/filename-case": [
        "error",
        {
          "cases": {
            "camelCase": true,
            "pascalCase": true,
            "kebabCase": true
          }
        }
      ],
      "unicorn/no-null": "off",
      "security/detect-object-injection": "off",
      "sonarjs/cognitive-complexity": ["error", 20], // Relaxed slightly from 15
    }
  },
  // Relax rules for test files
  {
    files: ["**/*.test.ts", "**/*.test.tsx", "**/setup.ts"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "sonarjs/no-duplicate-string": "off",
      "sonarjs/no-identical-functions": "off",
      "unicorn/no-object-as-default-parameter": "off",
    }
  },
  // Allow CommonJS in specific config files
  {
    files: ["*.config.js", "*.config.mjs", "*.config.ts", "tailwind.config.js", "postcss.config.js"],
    rules: {
      "unicorn/prefer-module": "off",
    }
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "coverage/**",
  ]),
]);

export default eslintConfig;
