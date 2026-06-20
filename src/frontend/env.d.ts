/// <reference types="vite/client" />
import 'vue-router'

declare module 'vue-router' {
  interface RouteMeta {
    pageTitle: string
    requiresAuth?: boolean
    layout?: 'default' | 'auth' | 'blank'
    appBar?: 'default' | 'dashboard' | 'hidden'
  }
}
