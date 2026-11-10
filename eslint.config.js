import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
  },
  // Dependencies point one way: app -> features -> shared. Code in a lower layer must not reach up.
  {
    files: ['src/shared/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/features/*', '@/app/*'],
              message: 'shared code is used by features, so it cannot depend on them.',
            },
          ],
        },
      ],
    },
  },
  // Features stand side by side, except for these one-way links: home -> route -> activities, home -> collaboration, and planner -> route and plan.
  // Anything that needs two features at once goes in home or in app, never in a cycle.
  {
    files: ['src/features/activities/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            { group: ['@/app/*'], message: 'features cannot depend on the app shell that wires them together.' },
            {
              group: ['@/features/route/*', '@/features/home/*', '@/features/planner/*'],
              message: 'activities is used by route and home, so it cannot depend on them.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/features/route/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            { group: ['@/app/*'], message: 'features cannot depend on the app shell that wires them together.' },
            {
              group: ['@/features/home/*', '@/features/planner/*'],
              message: 'home and planner are built from route, so route cannot depend on them.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/features/collaboration/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            { group: ['@/app/*'], message: 'features cannot depend on the app shell that wires them together.' },
            {
              group: ['@/features/*'],
              message:
                'collaboration (shared plans) stands on its own; other features show its pieces, not the reverse.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/features/**/*.{ts,tsx}'],
    ignores: ['src/features/activities/**', 'src/features/route/**', 'src/features/collaboration/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            { group: ['@/app/*'], message: 'features cannot depend on the app shell that wires them together.' },
          ],
        },
      ],
    },
  },
])
