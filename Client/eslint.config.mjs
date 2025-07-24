import js from "@eslint/js";

export default {
  ignores: ["dist"],
  extends: [
    js.configs.recommended,
    "plugin:@typescript-eslint/recommended",
    "plugin:prettier/recommended"
  ],
  files: ["**/*.{ts,tsx}"],
  languageOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
  },
  rules: {
    // your custom rules here, e.g.:
    "semi": ["error", "never"],  // no semicolons
  },
};
