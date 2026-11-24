import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import {
  InvalidCredentialsError,
  NetworkError,
  UnexpectedAuthError,
} from '@/repository/auth/authErrors'
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

  test('logs in, keeps tokens and user in the store and replaces them on the next login', async () => {
    // Arrange
    repository.login
      .mockResolvedValueOnce(authResult('otto', 'ACCESS-1', 'REFRESH-1'))
      .mockResolvedValueOnce(authResult('lena', 'ACCESS-2', 'REFRESH-2'))
    const { wrapper, router, store } = await mountLogin()
    expect(wrapper.text()).toContain(LOGIN_LABEL)

    // Act
    await fillAndSubmit(wrapper, 'otto', 'geheim-123')
    const firstSession = { user: store.user, tokens: store.tokens }
    await router.push('/login')
    await settle()
    await fillAndSubmit(wrapper, 'lena', 'anders-456')

    // Assert
    expect(repository.login).toHaveBeenCalledTimes(2)
    expect(repository.login).toHaveBeenNthCalledWith(1, 'otto', 'geheim-123')
    expect(firstSession.tokens).toEqual({ access: 'ACCESS-1', refresh: 'REFRESH-1' })
    expect(firstSession.user?.username).toBe('otto')
    expect(store.user?.username).toBe('lena')
    expect(store.tokens).toEqual({ access: 'ACCESS-2', refresh: 'REFRESH-2' })
    expect(router.currentRoute.value.path).toBe('/list')
  })

  test('shows one generic message on invalid credentials and allows another attempt', async () => {
    // Arrange
    const error = new InvalidCredentialsError()
    repository.login.mockRejectedValue(error)
    const { wrapper, router, store } = await mountLogin()

    // Act
    await fillAndSubmit(wrapper, 'otto', 'falsch-1')
    const alertAfterFirst = wrapper.find('.v-alert').text()
    await inputByLabel(wrapper, PASSWORD_LABEL).setValue('falsch-2')
    await buttonByText(wrapper, 'Anmelden').trigger('click')
    await settle()

    // Assert
    expect(router.currentRoute.value.path).toBe('/login')
    expect(alertAfterFirst).not.toBe('')
    expect(alertAfterFirst).not.toContain(error.message)
    expect(wrapper.findAll('.v-alert')).toHaveLength(1)
    expect(inputByLabel(wrapper, LOGIN_LABEL).element.value).toBe('otto')
    expect(inputByLabel(wrapper, PASSWORD_LABEL).element.value).toBe('falsch-2')
    expect(buttonByText(wrapper, 'Anmelden').attributes('disabled')).toBeUndefined()
    expect(repository.login).toHaveBeenCalledTimes(2)
    expect(repository.login).toHaveBeenLastCalledWith('otto', 'falsch-2')
    expect(store.isAuthenticated).toBe(false)
    expect(store.user).toBeNull()
  })

  test('shows a network message or a general message and stays on the page', async () => {
    // Arrange
    const errors = [
      new NetworkError({ cause: new Error('CAUSE-MARKER-NET') }),
      new UnexpectedAuthError({ cause: new Error('CAUSE-MARKER-UNEXPECTED') }),
    ]
    const messages: string[] = []
    const observed: { route: string; leaksBackendText: boolean }[] = []

    // Act
    for (const error of errors) {
      document.body.innerHTML = ''
      repository.login.mockRejectedValueOnce(error)
      const { wrapper, router } = await mountLogin()
      await fillAndSubmit(wrapper, 'otto', 'geheim-123')
      messages.push(wrapper.find('.v-alert').text())
      const html = wrapper.html()
      observed.push({
        route: router.currentRoute.value.path,
        leaksBackendText: html.includes(error.message) || html.includes('CAUSE-MARKER'),
      })
    }

    // Assert
    expect(observed).toEqual([
      { route: '/login', leaksBackendText: false },
      { route: '/login', leaksBackendText: false },
    ])
    expect(messages[0]).toContain('Server nicht erreichbar')
    expect(messages[1]).not.toBe('')
    expect(messages[1]).not.toContain('Server nicht erreichbar')
  })

  test('shows a hint at each empty required field and sends no request', async () => {
    // Arrange
    const { wrapper, router } = await mountLogin()

    // Act
    await buttonByText(wrapper, 'Anmelden').trigger('click')
    await settle()
    const hintsWhenBothEmpty = wrapper.findAll('.v-messages__message').length
    await inputByLabel(wrapper, LOGIN_LABEL).setValue('otto')
    await buttonByText(wrapper, 'Anmelden').trigger('click')
    await settle()

    // Assert
    expect(hintsWhenBothEmpty).toBe(2)
    expect(wrapper.findAll('.v-messages__message')).toHaveLength(1)
    expect(repository.login).not.toHaveBeenCalled()
    expect(router.currentRoute.value.path).toBe('/login')
  })

  test('offers no local continuation button', async () => {
    // Arrange & Act
    const { wrapper } = await mountLogin()

    // Assert
    expect(wrapper.text()).not.toContain('Lokal fortfahren')
  })

  test('disables the button with a spinner while waiting and sends only one request', async () => {
    // Arrange
    let reject: (error: Error) => void = () => {}
    repository.login.mockReturnValue(
      new Promise<AuthResult>((_resolve, rejectFn) => {
        reject = rejectFn
      }),
    )
    const { wrapper } = await mountLogin()

    // Act
    await inputByLabel(wrapper, LOGIN_LABEL).setValue('otto')
    await inputByLabel(wrapper, PASSWORD_LABEL).setValue('geheim-123')
    await buttonByText(wrapper, 'Anmelden').trigger('click')
    await buttonByText(wrapper, 'Anmelden').trigger('click')
    await wrapper.find('form').trigger('submit')
    await settle()
    const whileWaiting = {
      disabled: buttonByText(wrapper, 'Anmelden').attributes('disabled'),
      spinner: wrapper.find('.v-progress-circular').exists(),
      calls: repository.login.mock.calls.length,
    }
    reject(new UnexpectedAuthError())
    await settle()

    // Assert
    expect(whileWaiting.disabled).toBeDefined()
    expect(whileWaiting.spinner).toBe(true)
    expect(whileWaiting.calls).toBe(1)
    expect(buttonByText(wrapper, 'Anmelden').attributes('disabled')).toBeUndefined()
  })

  test('keeps password and tokens out of storage, cookies, store state and console', async () => {
    // Arrange
    const spies = (['log', 'info', 'warn', 'error', 'debug'] as const).map((method) =>
      vi.spyOn(console, method).mockImplementation(() => {}),
    )
    repository.login.mockResolvedValue(authResult('otto', 'ACCESS-MARKER', 'REFRESH-MARKER'))
    const { wrapper, store } = await mountLogin()

    // Act
    await fillAndSubmit(wrapper, 'otto', 'PASSWORD-MARKER')

    // Assert
    const markers = ['PASSWORD-MARKER', 'ACCESS-MARKER', 'REFRESH-MARKER']
    const visible = JSON.stringify([
      { ...localStorage },
      { ...sessionStorage },
      document.cookie,
      spies.flatMap((spy) => spy.mock.calls),
    ])
    for (const marker of markers) {
      expect(visible).not.toContain(marker)
    }
    expect(JSON.stringify(store.$state)).not.toContain('PASSWORD-MARKER')
    expect(store.isAuthenticated).toBe(true)
  })
})
