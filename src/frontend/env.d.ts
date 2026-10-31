/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_USE_MOCK_REPOSITORIES?: string
  readonly VITE_DEV_API_USERNAME?: string
  readonly VITE_DEV_API_PASSWORD?: string
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
