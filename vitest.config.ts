import { defineWorkersConfig } from '@cloudflare/vitest-pool-workers/config';
import path from 'path';

export default defineWorkersConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
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
