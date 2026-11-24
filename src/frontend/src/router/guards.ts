import type { Router } from 'vue-router'
import type { useSessionStore } from '@/stores/session'

type SessionStore = ReturnType<typeof useSessionStore>

// Routes with meta.requiresAuth are only reachable with a session, everything else is open.
export function installSessionGuard(router: Router, session: SessionStore): void {
  router.beforeEach((to) => {
    const requiresAuth = to.matched.some((record) => record.meta.requiresAuth)
    if (requiresAuth && !session.isAuthenticated) {
      return { name: 'login' }
    }
    return true
  })
}
