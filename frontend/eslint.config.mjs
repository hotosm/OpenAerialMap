import globals from 'globals';
import pluginJs from '@eslint/js';
import tseslint from 'typescript-eslint';
import pluginReact from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';

/** @type {import('eslint').Linter.Config[]} */
export default [
  {
    files: ['**/*.{js,mjs,cjs,ts,jsx,tsx}'],
    settings: { react: { version: 'detect' } },
    languageOptions: { ecmaVersion: 2020, globals: globals.browser },
    plugins: { 'react-hooks': reactHooks, 'react-refresh': reactRefresh }
  },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  pluginReact.configs.flat.recommended,
  eslintPluginPrettierRecommended,
  {
    name: 'Custom Rules ',
    rules: {
      'no-console': 2,
      'prefer-promise-reject-errors': 0,
      // 'import/order': 2,
      'react/button-has-type': 2,
      'react/jsx-closing-bracket-location': 2,
      'react/jsx-closing-tag-location': 2,
      'react/jsx-curly-spacing': 2,
      'react/jsx-curly-newline': 2,
      'react/jsx-equals-spacing': 2,
      'react/jsx-max-props-per-line': [2, { maximum: 1, when: 'multiline' }],
      'react/jsx-first-prop-new-line': 2,
      'react/jsx-curly-brace-presence': [
        2,
        { props: 'never', children: 'never' }
      ],
      'react/jsx-pascal-case': 2,
      'react/jsx-props-no-multi-spaces': 2,
      'react/jsx-tag-spacing': [2, { beforeClosing: 'never' }],
      'react/jsx-wrap-multilines': 2,
      'react/no-array-index-key': 2,
      'react/no-typos': 2,
      'react/no-unused-prop-types': 2,
      'react/no-unused-state': 2,
      'react/react-in-jsx-scope': 'off',
      'react/self-closing-comp': 2,
      'react/style-prop-object': 2,
      'react/void-dom-elements-no-children': 2,
      'react/function-component-definition': [
        2,
        { namedComponents: ['function-declaration', 'arrow-function'] }
      ],
      'react-hooks/rules-of-hooks': 2, // Checks rules of Hooks
      // 'react-hooks/exhaustive-deps': 1, // Checks effect dependencies
      // 'fp/no-mutating-methods': 1,
      '@typescript-eslint/no-explicit-any': 'warn'
    }
  }
];
