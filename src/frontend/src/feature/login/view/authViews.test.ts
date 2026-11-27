import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { NetworkError, UnexpectedAuthError } from '@/repository/auth/authErrors'
import type { AuthResult } from '@/repository/auth/repositories'
import {
  buttonByText,
  createFakeAuthRepository,
  fieldMessages,
  inputByLabel,
  mountAuthViews,
  settle,
} from '@/test/authViewHarness'

type FakeAuthRepository = ReturnType<typeof createFakeAuthRepository>
type Mounted = Awaited<ReturnType<typeof mountAuthViews>>

const PASSWORD = 'PASSWORD-MARKER'

// Behaviour that login and register share; each test runs once per view.
const VIEWS = [
  {
    path: '/login',
    button: 'Anmelden',
    fields: { 'E-Mail oder Benutzername': 'otto', Passwort: PASSWORD },
    answer: (repository: FakeAuthRepository, outcome: () => Promise<AuthResult>) =>
      repository.login.mockImplementation(outcome),
    calls: (repository: FakeAuthRepository) => repository.login.mock.calls.length,
  },
  {
    path: '/register',
    button: 'Konto erstellen',
    fields: {
      Benutzername: 'lena',
      'E-Mail': 'lena@example.com',
      Passwort: PASSWORD,
      'Passwort wiederholen': PASSWORD,
    },
    answer: (repository: FakeAuthRepository, outcome: () => Promise<AuthResult>) =>
      repository.register.mockImplementation(outcome),
    calls: (repository: FakeAuthRepository) => repository.register.mock.calls.length,
  },
]

type View = (typeof VIEWS)[number]

function authResult(): AuthResult {
  return {
    user: { id: 1, username: 'otto', email: 'otto@example.com', firstName: '', lastName: '' },
    tokens: { access: 'ACCESS-MARKER', refresh: 'REFRESH-MARKER' },
  }
}

describe('login and register views', () => {
  let repository: FakeAuthRepository

  beforeEach(() => {
    repository = createFakeAuthRepository()
  })

  afterEach(() => {
    document.body.innerHTML = ''
    vi.restoreAllMocks()
  })

  async function mountView(view: View): Promise<Mounted> {
    document.body.innerHTML = ''
    return mountAuthViews(repository, view.path)
  }

  async function fillAndSubmit(view: View, { wrapper }: Mounted): Promise<void> {
    for (const [label, value] of Object.entries(view.fields)) {
      await inputByLabel(wrapper, label).setValue(value)
    }
    await buttonByText(wrapper, view.button).trigger('click')
    await settle()
  }

  test('shows a network message or a general message and stays on the page', async () => {
    // Arrange
    const cases = VIEWS.flatMap((view) => [
      { view, error: new NetworkError({ cause: new Error('CAUSE-MARKER-NET') }) },
      { view, error: new UnexpectedAuthError({ cause: new Error('CAUSE-MARKER-UNEXPECTED') }) },
    ])

    // Act
    const observed = []
    for (const { view, error } of cases) {
      view.answer(repository, () => Promise.reject(error))
      const mounted = await mountView(view)
      await fillAndSubmit(view, mounted)
      const html = mounted.wrapper.html()
      observed.push({
        expectedRoute: view.path,
        route: mounted.router.currentRoute.value.path,
        message: mounted.wrapper.find('.v-alert').text(),
        isNetwork: error instanceof NetworkError,
        leaksBackendText: html.includes(error.message) || html.includes('CAUSE-MARKER'),
      })
    }

    // Assert
    for (const row of observed) {
      expect(row.route).toBe(row.expectedRoute)
      expect(row.leaksBackendText).toBe(false)
      expect(row.message).not.toBe('')
      expect(row.message.includes('Server nicht erreichbar')).toBe(row.isNetwork)
    }
  })

  test('shows a hint at each empty required field and sends no request', async () => {
    // Arrange: both views start with empty fields

    // Act
    const observed = []
    for (const view of VIEWS) {
      const { wrapper } = await mountView(view)
      await buttonByText(wrapper, view.button).trigger('click')
      await settle()
      observed.push({
        hints: Object.keys(view.fields).map((label) => fieldMessages(wrapper, label).length),
        calls: view.calls(repository),
      })
    }

    // Assert
    for (const row of observed) {
      expect(row.hints.every((count) => count === 1)).toBe(true)
      expect(row.calls).toBe(0)
    }
  })

  test('disables the button with a spinner while waiting and sends only one request', async () => {
    // Arrange
    for (const view of VIEWS) {
      view.answer(repository, () => new Promise<AuthResult>(() => {}))
    }

    // Act
    const observed = []
    for (const view of VIEWS) {
      const mounted = await mountView(view)
      await fillAndSubmit(view, mounted)
      await buttonByText(mounted.wrapper, view.button).trigger('click')
      await mounted.wrapper.find('form').trigger('submit')
      await settle()
      observed.push({
        disabled: buttonByText(mounted.wrapper, view.button).attributes('disabled'),
        spinner: mounted.wrapper.find('.v-progress-circular').exists(),
        calls: view.calls(repository),
      })
    }

    // Assert
    for (const row of observed) {
      expect(row.disabled).toBeDefined()
      expect(row.spinner).toBe(true)
      expect(row.calls).toBe(1)
    }
  })

  test('keeps password and tokens out of storage, cookies, store state and console', async () => {
    // Arrange
    const spies = (['log', 'info', 'warn', 'error', 'debug'] as const).map((method) =>
      vi.spyOn(console, method).mockImplementation(() => {}),
    )
    for (const view of VIEWS) {
      view.answer(repository, () => Promise.resolve(authResult()))
    }

    // Act
    const storeStates = []
    for (const view of VIEWS) {
      const mounted = await mountView(view)
      await fillAndSubmit(view, mounted)
      storeStates.push({
        authenticated: mounted.store.isAuthenticated,
        state: JSON.stringify(mounted.store.$state),
      })
    }

    // Assert
    const visible = JSON.stringify([
      { ...localStorage },
      { ...sessionStorage },
      document.cookie,
      spies.flatMap((spy) => spy.mock.calls),
    ])
    for (const marker of [PASSWORD, 'ACCESS-MARKER', 'REFRESH-MARKER']) {
      expect(visible).not.toContain(marker)
    }
    for (const { authenticated, state } of storeStates) {
      expect(authenticated).toBe(true)
      expect(state).not.toContain(PASSWORD)
    }
  })
})
