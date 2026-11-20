import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import vueDevTools from 'vite-plugin-vue-devtools'

import UnpluginTypia from '@typia/unplugin/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueJsx(),
    vueDevTools(),
    UnpluginTypia( { tsconfig: './tsconfig.app.json' } ),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  optimizeDeps: {
    // Typia generates these imports during transformation, after Vite's scan.
    // Prebundle them so a cold start cannot reload the page during Cypress input.
    include: ['typia/lib/internal/_assertGuard', 'typia/lib/internal/_isFormatUuid'],
  },
  server: {
    proxy: {
      '/api': {
        target: process.env.API_PROXY_TARGET || 'http://localhost:8001',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
