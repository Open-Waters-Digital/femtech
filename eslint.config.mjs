import nextCoreWebVitals from 'eslint-config-next/core-web-vitals'
import nextTypescript from 'eslint-config-next/typescript'

const eslintConfig = [
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    rules: {
      '@typescript-eslint/ban-ts-comment': 'error',
      '@typescript-eslint/no-empty-object-type': 'warn',
      // AGENTS.md: no `any`, and no non-null assertions on anything crossing a
      // boundary. Errors rather than warnings, because a warning nobody reads is
      // a preference rather than a standard.
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-non-null-assertion': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          vars: 'all',
          args: 'after-used',
          ignoreRestSiblings: false,
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^(_|ignore)',
        },
      ],
    },
  },
  {
    // The design system is enforced here, not by convention. Feature code
    // references tokens only. Expect this to fail the first time someone pastes
    // a colour out of a design file: that is the rule working.
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['src/styles/**', 'src/lib/brand-constants.ts', 'src/components/showcase/**'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: 'Literal[value=/#[0-9a-fA-F]{6}\\b/]',
          message: 'Hard-coded colour. Use a design token from src/styles/tokens.css.',
        },
      ],
    },
  },
  {
    // Payload generates migrations with a fixed ({ db, payload, req }) signature,
    // so unused args here are the API's shape rather than a mistake.
    files: ['src/migrations/**/*.ts'],
    rules: {
      '@typescript-eslint/no-unused-vars': 'off',
    },
  },
  {
    // Public pages must not carry console noise into the client bundle.
    files: ['src/**/*.{ts,tsx}'],
    rules: {
      'no-console': ['error', { allow: ['warn', 'error'] }],
    },
  },
  {
    ignores: [
      '.next/',
      'node_modules/',
      'src/payload-types.ts',
      'src/payload-generated-schema.ts',
      'src/app/(payload)/admin/importMap.js',
      // The Webflow export the site was rebuilt from. Reference only, gitignored.
      'femtech-9ce3f2.webflow/',
    ],
  },
]

export default eslintConfig
