import { describe, expect, test } from 'vitest'
import { mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import App from './App.vue'
import { routes } from './router'
import { withStubComponents } from '@/test/stubRoutes'

async function mountAppAt(path: string) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: withStubComponents(routes),
  })
  await router.push(path)
  await router.isReady()
  const vuetify = createVuetify({ components, directives })
  return mount(App, { global: { plugins: [router, vuetify] } })
}

describe('App', () => {
  test('hides the bottom navigation on the auth pages and shows it on /list', async () => {
    // Arrange
    const authPaths = ['/login', '/register', '/forgot-password']

    // Act
    const authPages = []
    for (const path of authPaths) {
      authPages.push(await mountAppAt(path))
    }
    const listPage = await mountAppAt('/list')

    // Assert
    for (const page of authPages) {
      expect(page.find('.v-bottom-navigation').exists()).toBe(false)
    }
    expect(listPage.find('.v-bottom-navigation').exists()).toBe(true)
  })
})
