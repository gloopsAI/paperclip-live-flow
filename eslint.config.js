import eslint from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";

const uiReadBoundaryRules = {
  "no-restricted-globals": [
    "error",
    { name: "fetch", message: "UI must read Paperclip data only through usePluginData." },
    { name: "XMLHttpRequest", message: "UI must read Paperclip data only through usePluginData." },
    { name: "WebSocket", message: "UI must not open direct network channels to the host." },
    { name: "EventSource", message: "UI must not open direct network channels to the host." }
  ],
  "no-restricted-properties": [
    "error",
    {
      object: "navigator",
      property: "sendBeacon",
      message: "UI must read Paperclip data only through usePluginData."
    }
  ]
};

export default tseslint.config(
  {
    ignores: ["dist/**", "node_modules/**", "coverage/**", ".paperclip-sdk/**"]
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["src/**/*.ts", "tests/**/*.ts"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        ...globals.node
      }
    }
  },
  {
    files: ["*.config.mjs", "esbuild.config.mjs", "rollup.config.mjs"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        ...globals.node
      }
    }
  },
  {
    files: ["src/ui/**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      parserOptions: {
        ecmaFeatures: { jsx: true }
      },
      globals: {
        ...globals.browser
      }
    },
    plugins: {
      "react-hooks": reactHooks
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      ...uiReadBoundaryRules,
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }
      ]
    }
  }
);
