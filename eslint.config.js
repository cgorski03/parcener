//  @ts-check
import { tanstackConfig } from '@tanstack/eslint-config';

export default [
  ...tanstackConfig,
  {
    ignores: ['eslint.config.js', 'prettier.config.js', '.wrangler/**'],
  },
  {
    files: ['src/features/**/server/*rpc*.ts'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: 'ThrowStatement',
          message: 'RPCs must use throwRpcError(...) to avoid leaking internals.',
        },
      ],
    },
  },
];
