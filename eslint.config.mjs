import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),

   // Override or disable rules
  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',          // Allow 'any'
      'react/no-unescaped-entities': 'off',                 // Allow unescaped entities in JSX

      // Configure ts-comment usage
      '@typescript-eslint/ban-ts-comment': [
        'error',
        {
          'ts-ignore': false,        // Disallow '@ts-ignore'
          'ts-expect-error': false,  // Allow '@ts-expect-error'
          'ts-nocheck': true,
          'ts-check': false,
        },
      ],

      '@typescript-eslint/no-unnecessary-type-constraint': 'off', // Allow unnecessary type constraints
      '@typescript-eslint/no-empty-object-type': 'off',           // Allow empty object types
    },
  },
];

export default eslintConfig;
