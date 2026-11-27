import { beforeEach, describe, expect, test } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'
import { createPinia, setActivePinia } from 'pinia'
import { routes } from './index'
import { installSessionGuard } from './guards'
import { useSessionStore } from '@/stores/session'
import { Stub, withStubComponents } from '@/test/stubRoutes'

function createGuardedRouter() {
  const store = useSessionStore()
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      ...withStubComponents(routes),
      {
        path: '/subscription/:id',
        name: 'subscription',
        component: Stub,
        meta: { pageTitle: 'Subscription', requiresAuth: true },
      },
    ],
  })
  installSessionGuard(router, store)
  return { router, store }
}

async function navigate(router: ReturnType<typeof createRouter>, path: string): Promise<string> {
  await router.push(path)
  return router.currentRoute.value.path
}

describe('session guard', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  test('anonymous user is sent to /login from guarded routes, open routes stay reachable', async () => {
    // Arrange
    const table = [
      ['/list', '/login'],
      ['/add', '/login'],
      ['/subscription/42', '/login'],
      ['/', '/login'],
      ['/overview', '/overview'],
      ['/login', '/login'],
      ['/register', '/register'],
      ['/forgot-password', '/forgot-password'],
    ]
    const { router } = createGuardedRouter()

    // Act
    const results: string[][] = []
    for (const [target] of table) {
      await router.push('/login')
      const path = await navigate(router, target as string)
      results.push([target as string, path])
    }

    // Assert
    expect(results).toEqual(table)
  })

  test('authenticated user reaches guarded routes and / leads to /list', async () => {
    // Arrange
    const table = [
      ['/', '/list'],
      ['/list', '/list'],
      ['/add', '/add'],
      ['/subscription/42', '/subscription/42'],
    ]
    const { router, store } = createGuardedRouter()
    store.setSession({
      user: { id: 1, username: 'otto', email: '', firstName: '', lastName: '' },
      tokens: { access: 'a', refresh: 'r' },
    })

    // Act
    const results: string[][] = []
    for (const [target] of table) {
      const path = await navigate(router, target as string)
      results.push([target as string, path])
    }

    // Assert
    expect(results).toEqual(table)
  })
})
