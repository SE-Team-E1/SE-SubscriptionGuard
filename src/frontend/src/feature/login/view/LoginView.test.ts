import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { InvalidCredentialsError } from '@/repository/auth/authErrors'
import type { AuthResult } from '@/repository/auth/repositories'
import {
  buttonByText,
  createFakeAuthRepository,
  inputByLabel,
  mountAuthViews,
  settle,
} from '@/test/authViewHarness'

const LOGIN_LABEL = 'E-Mail oder Benutzername'
const PASSWORD_LABEL = 'Passwort'

function authResult(username: string, access: string, refresh: string): AuthResult {
  return {
    user: { id: 1, username, email: `${username}@example.com`, firstName: '', lastName: '' },
    tokens: { access, refresh },
  }
}

describe('LoginView', () => {
  let repository: ReturnType<typeof createFakeAuthRepository>

  beforeEach(() => {
    repository = createFakeAuthRepository()
  })

  afterEach(() => {
    document.body.innerHTML = ''
    vi.restoreAllMocks()
  })

  async function mountLogin() {
    return mountAuthViews(repository, '/login')
  }

  async function fillAndSubmit(
    wrapper: Awaited<ReturnType<typeof mountLogin>>['wrapper'],
    login: string,
    password: string,
  ) {
    await inputByLabel(wrapper, LOGIN_LABEL).setValue(login)
    await inputByLabel(wrapper, PASSWORD_LABEL).setValue(password)
    await buttonByText(wrapper, 'Anmelden').trigger('click')
    await settle()
  }

  test('logs in, replaces an existing session and opens the list', async () => {
    // Arrange
    repository.login.mockResolvedValue(authResult('lena', 'ACCESS-2', 'REFRESH-2'))
    const { wrapper, router, store } = await mountLogin()
    store.setSession(authResult('otto', 'ACCESS-1', 'REFRESH-1'))

    // Act
    await fillAndSubmit(wrapper, 'lena', 'anders-456')

    // Assert
    expect(repository.login).toHaveBeenCalledExactlyOnceWith('lena', 'anders-456')
    expect(store.user?.username).toBe('lena')
    expect(store.tokens).toEqual({ access: 'ACCESS-2', refresh: 'REFRESH-2' })
    expect(router.currentRoute.value.path).toBe('/list')
  })

  test('shows one generic message on invalid credentials and allows another attempt', async () => {
    // Arrange
    const error = new InvalidCredentialsError()
    repository.login.mockRejectedValue(error)
    const { wrapper, router, store } = await mountLogin()
    await fillAndSubmit(wrapper, 'otto', 'falsch-1')

    // Act
    await inputByLabel(wrapper, PASSWORD_LABEL).setValue('falsch-2')
    await buttonByText(wrapper, 'Anmelden').trigger('click')
    await settle()

    // Assert
    const alerts = wrapper.findAll('.v-alert')
    expect(alerts).toHaveLength(1)
    expect(alerts[0]?.text()).not.toBe('')
    expect(alerts[0]?.text()).not.toContain(error.message)
    expect(repository.login).toHaveBeenLastCalledWith('otto', 'falsch-2')
    expect(inputByLabel(wrapper, LOGIN_LABEL).element.value).toBe('otto')
    expect(buttonByText(wrapper, 'Anmelden').attributes('disabled')).toBeUndefined()
    expect(wrapper.text()).not.toContain('Lokal fortfahren')
    expect(router.currentRoute.value.path).toBe('/login')
    expect(store.isAuthenticated).toBe(false)
  })
})
