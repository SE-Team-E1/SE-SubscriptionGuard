import { vi } from 'vitest'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import { createPinia, setActivePinia } from 'pinia'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import type { AuthRepository } from '@/repository/auth/repositories'
import { AuthSessionService } from '@/feature/login/services/authSessionService'
import { useSessionStore } from '@/stores/session'
import LoginView from '@/feature/login/view/LoginView.vue'
import RegisterView from '@/feature/login/view/RegisterView.vue'
import { Stub } from './stubRoutes'

export function createFakeAuthRepository() {
  return {
    login: vi.fn<AuthRepository['login']>(),
    register: vi.fn<AuthRepository['register']>(),
    refresh: vi.fn<AuthRepository['refresh']>(),
  }
}

// Mounts the real login and register views with a memory router, a real Pinia store
// and the real service; only the auth repository is replaced.
export async function mountAuthViews(repository: AuthRepository, startPath: string) {
  const pinia = createPinia()
  setActivePinia(pinia)
  const store = useSessionStore()
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/login', component: LoginView },
      { path: '/register', component: RegisterView },
      { path: '/forgot-password', component: Stub },
      { path: '/list', component: Stub },
    ],
  })
  await router.push(startPath)
  await router.isReady()

  const root = document.createElement('div')
  document.body.appendChild(root)
  const wrapper = mount(
    { template: '<router-view />' },
    {
      attachTo: root,
      global: {
        plugins: [pinia, router, createVuetify({ components, directives })],
        provide: { authSessionService: new AuthSessionService(repository, store) },
      },
    },
  )
  return { wrapper, router, store }
}

export function inputByLabel(wrapper: VueWrapper, label: string) {
  const labelElement = wrapper
    .findAll('label')
    .find((candidate) => candidate.text() === label && candidate.attributes('for'))
  if (labelElement === undefined) {
    throw new Error(`No field labelled "${label}"`)
  }
  return wrapper.find<HTMLInputElement>(`[id="${labelElement.attributes('for')}"]`)
}

export function buttonByText(wrapper: VueWrapper, text: string) {
  const button = wrapper.findAll('button').find((candidate) => candidate.text() === text)
  if (button === undefined) {
    throw new Error(`No button "${text}"`)
  }
  return button
}

export async function settle(): Promise<void> {
  await flushPromises()
  await flushPromises()
}

// Texts of the validation messages shown below one field.
export function fieldMessages(wrapper: VueWrapper, label: string): string[] {
  const container = inputByLabel(wrapper, label).element.closest('.v-input')
  return Array.from(container?.querySelectorAll('.v-messages__message') ?? []).map(
    (element) => element.textContent ?? '',
  )
}
