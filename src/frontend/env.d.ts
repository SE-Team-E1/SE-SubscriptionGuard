/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_USE_MOCK_REPOSITORIES?: string
}

import 'vue-router'

declare module 'vue-router' {
  interface RouteMeta {
    pageTitle: string
    requiresAuth?: boolean
    layout?: 'default' | 'auth' | 'blank'
    appBar?: 'default' | 'dashboard' | 'hidden'
  }
}
