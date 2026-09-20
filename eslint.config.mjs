import typescriptEslint from "typescript-eslint";

export default typescriptEslint.config(
    {
        files: ["**/*.ts"],
        ignores: ["out/**", "node_modules/**"],
    },
    ...typescriptEslint.configs.recommended,
    {
        files: ["**/*.ts"],
        plugins: {
            "@typescript-eslint": typescriptEslint.plugin,
        },

        languageOptions: {
            parser: typescriptEslint.parser,
            ecmaVersion: 2022,
            sourceType: "module",
        },

        rules: {
            "@typescript-eslint/naming-convention": ["warn", {
                selector: "import",
                format: ["camelCase", "PascalCase"],
            }],
            "@typescript-eslint/no-explicit-any": "error",
            "@typescript-eslint/no-unused-vars": ["error", {
                argsIgnorePattern: "^_",
                caughtErrorsIgnorePattern: "^_",
            }],

            curly: "error",
            eqeqeq: "error",
            "no-throw-literal": "error",
            semi: "error",
        },
    },
);