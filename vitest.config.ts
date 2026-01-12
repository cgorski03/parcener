import path from 'node:path';
import { defineWorkersConfig } from '@cloudflare/vitest-pool-workers/config';

export default defineWorkersConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    exclude: ['**/node_modules/**', '**/*.e2e.ts'],
    poolOptions: {
      workers: {
        singleWorker: true,
        isolatedStorage: false,
        wrangler: { configPath: './wrangler.jsonc' },
        miniflare: {
          r2Buckets: ['parcener_receipt_images'],
          queueProducers: { RECEIPT_QUEUE: 'parcener-receipt-queue' },
          bindings: {
            GOOGLE_API_KEY: 'test-api-key',
          },
        },
      },
    },
  },
});
