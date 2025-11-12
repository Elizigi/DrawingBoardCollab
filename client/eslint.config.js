import globals from "globals";
import js from "@eslint/js";
import tsEslint from "typescript-eslint";
import prettierConfig from "eslint-config-prettier";

export default [
    {
        ignores: [
            "node_modules",
            "client/dist/**/*",
            "server/dist/**/*",
            "railway.json"
        ]
    },

    js.configs.recommended,
    ...tsEslint.configs.recommended,

    {
        files: ["**/*.{ts,tsx,js,jsx,mjs,cjs}"],

        languageOptions: {
            parser: tsEslint.parser,
            parserOptions: {
                ecmaVersion: 'latest',
                sourceType: 'module',
                ecmaFeatures: {
                    jsx: true,
                },
            },
            globals: {
                ...globals.browser,
                ...globals.node,
            },
        },
        
        rules: {
            'semi': ['error', 'never'],
            'no-prototype-builtins': 'off',
            '@typescript-eslint/no-unused-expressions': 'off',
        },
    },
    
    prettierConfig,
];