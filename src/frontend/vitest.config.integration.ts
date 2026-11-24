import { fileURLToPath } from 'node:url'
import { mergeConfig, defineConfig } from 'vitest/config'
import viteConfig from './vite.config'

// Opt-in run against a live backend. Deliberately not derived from vitest.config.ts,
// because that one excludes the integration tests.
export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: 'node',
      include: ['src/**/*.integration.test.ts'],
      root: fileURLToPath(new URL('./', import.meta.url)),
    },
  }),
)
