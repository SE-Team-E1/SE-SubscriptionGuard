import { fileURLToPath } from 'node:url'
import { mergeConfig, defineConfig, configDefaults } from 'vitest/config'
import viteConfig from './vite.config'

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: 'jsdom',
      exclude: [...configDefaults.exclude, 'e2e/**', 'src/**/*.integration.test.ts'],
      setupFiles: ['./src/test/setup.ts'],
      server: { deps: { inline: ['vuetify'] } },
      root: fileURLToPath(new URL('./', import.meta.url)),
    },
  }),
)
