import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type { AuthTokens, User } from '@/domain/userModel'
import type { AuthResult } from '@/repository/auth/repositories'

export interface PendingLogin {
  notice: string
  username: string
}

// Lives in memory only: nothing is written to localStorage, sessionStorage or cookies,
// and no password is ever held here.
export const useSessionStore = defineStore('session', () => {
  const user = ref<User | null>(null)
  const tokens = ref<AuthTokens | null>(null)
  const pendingLogin = ref<PendingLogin | null>(null)

  const isAuthenticated = computed(() => tokens.value !== null)
  const accessToken = computed(() => tokens.value?.access)

  function setSession(result: AuthResult): void {
    user.value = { ...result.user }
    tokens.value = { ...result.tokens }
  }

  function clear(): void {
    user.value = null
    tokens.value = null
  }

  function setPendingLogin(value: PendingLogin): void {
    pendingLogin.value = value
  }

  // One-shot: the hint for the login view is shown once and then forgotten.
  function takePendingLogin(): PendingLogin | null {
    const value = pendingLogin.value
    pendingLogin.value = null
    return value
  }

  return {
    user,
    tokens,
    pendingLogin,
    isAuthenticated,
    accessToken,
    setSession,
    clear,
    setPendingLogin,
    takePendingLogin,
  }
})
