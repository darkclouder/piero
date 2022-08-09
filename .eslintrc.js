module.exports = {
    env: {
        browser: true,
        es2021: true,
    },
    extends: [
        "eslint:recommended",
        "plugin:@typescript-eslint/recommended",
        "plugin:@typescript-eslint/recommended-requiring-type-checking",
        "prettier",
    ],
    parser: "@typescript-eslint/parser",
    parserOptions: {
        ecmaVersion: 12,
        sourceType: "module",
        project: "tsconfig.json",
    },
    plugins: ["@typescript-eslint", "simple-import-sort"],
    rules: {
        "linebreak-style": ["error", "unix"],
        "quotes": [
            "error",
            "double",
            { avoidEscape: true }
        ],
        "semi": ["error", "always"],
        "comma-dangle": ["error", "always-multiline"],
        "no-warning-comments": "warn",
        "simple-import-sort/imports": "error",
        "simple-import-sort/exports": "error",
        // Turn off because of prettier
        "indent": "off",
        // --- Typescript ---
        "@typescript-eslint/consistent-type-imports": [
            "error",
            { prefer: "type-imports" },
        ],
        "@typescript-eslint/member-ordering": [
            "error",
            {
                classes: [
                    "public-static-field",
                    "protected-static-field",
                    "private-static-field",
                    "public-decorated-field",
                    "protected-decorated-field",
                    "private-decorated-field",
                    "public-instance-field",
                    "protected-instance-field",
                    "private-instance-field",
                    "public-abstract-field",
                    "protected-abstract-field",
                    "private-abstract-field",                  
                    "constructor",
                    "public-static-method",
                    "protected-static-method",
                    "private-static-method",
                    "public-decorated-method",
                    "protected-decorated-method",
                    "private-decorated-method",
                    "public-instance-method",
                    "protected-instance-method",
                    "private-instance-method",
                    "public-abstract-method",
                    "protected-abstract-method",
                    "private-abstract-method"
                ]
            },
        ],
        // note you must disable the base rule as it can report incorrect errors
        "no-duplicate-imports": "off",
        "@typescript-eslint/no-duplicate-imports": "error",
    },
};
