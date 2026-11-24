import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import {
  NetworkError,
  RegistrationLoginFailedError,
  RegistrationValidationError,
  UnexpectedAuthError,
} from '@/repository/auth/authErrors'
import type { AuthResult } from '@/repository/auth/repositories'
import type {
  RegistrationErrorCode,
  RegistrationField,
} from '@/repository/auth/registrationErrorCodes'
import {
  buttonByText,
  createFakeAuthRepository,
  fieldMessages,
  inputByLabel,
  mountAuthViews,
  settle,
} from '@/test/authViewHarness'

const USERNAME = 'Benutzername'
const EMAIL = 'E-Mail'
const PASSWORD = 'Passwort'
const PASSWORD_CONFIRM = 'Passwort wiederholen'
const FIELD_LABELS: Record<RegistrationField, string> = {
  username: USERNAME,
  email: EMAIL,
  password: PASSWORD,
  password_confirm: PASSWORD_CONFIRM,
}

const ALL_CODES: [RegistrationErrorCode, RegistrationField][] = [
  ['USERNAME_REQUIRED', 'username'],
  ['USERNAME_TOO_LONG', 'username'],
  ['USERNAME_INVALID_CHARS', 'username'],
  ['USERNAME_CONTAINS_AT', 'username'],
  ['USERNAME_TAKEN', 'username'],
  ['EMAIL_REQUIRED', 'email'],
  ['EMAIL_INVALID', 'email'],
  ['EMAIL_TOO_LONG', 'email'],
  ['EMAIL_TAKEN', 'email'],
  ['PASSWORD_REQUIRED', 'password'],
  ['PASSWORD_TOO_SHORT', 'password'],
  ['PASSWORD_CONFIRM_REQUIRED', 'password_confirm'],
  ['PASSWORD_CONFIRM_TOO_SHORT', 'password_confirm'],
  ['PASSWORD_MISMATCH', 'password_confirm'],
]

const VALUES = {
  [USERNAME]: 'lena',
  [EMAIL]: 'lena@example.com',
  [PASSWORD]: 'Geheim-123',
  [PASSWORD_CONFIRM]: 'Geheim-123',
}

function authResult(): AuthResult {
  return {
    user: { id: 3, username: 'lena', email: 'lena@example.com', firstName: '', lastName: '' },
    tokens: { access: 'ACCESS-1', refresh: 'REFRESH-1' },
  }
}

describe('RegisterView', () => {
  let repository: ReturnType<typeof createFakeAuthRepository>

  beforeEach(() => {
    repository = createFakeAuthRepository()
  })

  afterEach(() => {
    document.body.innerHTML = ''
    vi.restoreAllMocks()
  })

  async function mountRegister() {
    return mountAuthViews(repository, '/register')
  }

  type Mounted = Awaited<ReturnType<typeof mountRegister>>['wrapper']

  async function fill(
    wrapper: Mounted,
    overrides: Partial<Record<string, string>> = {},
  ): Promise<void> {
    for (const [label, value] of Object.entries({ ...VALUES, ...overrides })) {
      await inputByLabel(wrapper, label).setValue(value)
    }
  }

  async function submit(wrapper: Mounted): Promise<void> {
    await buttonByText(wrapper, 'Konto erstellen').trigger('click')
    await settle()
  }

  test('is a single step with four fields, registers untrimmed passwords and opens the list', async () => {
    // Arrange
    repository.register.mockResolvedValue(authResult())
    const { wrapper, router, store } = await mountRegister()
    const inputs = wrapper.findAll('input')
    const link = wrapper.findAll('a').find((a) => a.text() === 'Bereits ein Konto? Anmelden')

    // Act
    await fill(wrapper, { [PASSWORD]: ' Geheim-123 ', [PASSWORD_CONFIRM]: ' Geheim-123 ' })
    await submit(wrapper)

    // Assert
    expect(inputs).toHaveLength(4)
    expect(inputs.map((input) => input.attributes('type') === 'password')).toEqual([
      false,
      false,
      true,
      true,
    ])
    expect(wrapper.findAll('.v-tab')).toHaveLength(0)
    expect(repository.register).toHaveBeenCalledTimes(1)
    expect(repository.register).toHaveBeenCalledWith({
      username: 'lena',
      email: 'lena@example.com',
      password: ' Geheim-123 ',
      passwordConfirm: ' Geheim-123 ',
    })
    expect(store.tokens).toEqual({ access: 'ACCESS-1', refresh: 'REFRESH-1' })
    expect(store.user?.username).toBe('lena')
    expect(router.currentRoute.value.path).toBe('/list')
    expect(link).toBeDefined()
  })

  test('links to the login page', async () => {
    // Arrange
    const { wrapper, router } = await mountRegister()
    const link = wrapper.findAll('a').find((a) => a.text() === 'Bereits ein Konto? Anmelden')

    // Act
    await link?.trigger('click')
    await settle()

    // Assert
    expect(router.currentRoute.value.path).toBe('/login')
  })

  test('shows the translated text at the matching field for every error code', async () => {
    // Arrange
    const observed: {
      code: string
      route: string
      shown: string[]
      others: number
    }[] = []
    const textsByCode = new Map<string, string>()

    // Act
    for (const [code, field] of ALL_CODES) {
      document.body.innerHTML = ''
      repository.register.mockRejectedValueOnce(
        new RegistrationValidationError({ [field]: [code] }),
      )
      const { wrapper, router } = await mountRegister()
      await fill(wrapper)
      await submit(wrapper)
      const shown = fieldMessages(wrapper, FIELD_LABELS[field])
      const others = Object.entries(FIELD_LABELS)
        .filter(([key]) => key !== field)
        .flatMap(([, label]) => fieldMessages(wrapper, label)).length
      observed.push({ code, route: router.currentRoute.value.path, shown, others })
      textsByCode.set(code, shown[0] ?? '')
    }

    // Assert
    for (const row of observed) {
      expect(row.route).toBe('/register')
      expect(row.shown).toHaveLength(1)
      expect(row.shown[0]).not.toBe('')
      expect(row.shown[0]).not.toBe(row.code)
      expect(row.others).toBe(0)
    }
    expect(new Set(textsByCode.values()).size).toBe(ALL_CODES.length)
  })

  test('shows username and email taken at both fields', async () => {
    // Arrange
    repository.register.mockRejectedValue(
      new RegistrationValidationError({ username: ['USERNAME_TAKEN'], email: ['EMAIL_TAKEN'] }),
    )
    const { wrapper, router } = await mountRegister()

    // Act
    await fill(wrapper)
    await submit(wrapper)

    // Assert
    expect(fieldMessages(wrapper, USERNAME)).toHaveLength(1)
    expect(fieldMessages(wrapper, EMAIL)).toHaveLength(1)
    expect(fieldMessages(wrapper, USERNAME)[0]).not.toBe(fieldMessages(wrapper, EMAIL)[0])
    expect(fieldMessages(wrapper, PASSWORD)).toHaveLength(0)
    expect(router.currentRoute.value.path).toBe('/register')
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
      repository.register.mockRejectedValueOnce(error)
      const { wrapper, router } = await mountRegister()
      await fill(wrapper)
      await submit(wrapper)
      messages.push(wrapper.find('.v-alert').text())
      const html = wrapper.html()
      observed.push({
        route: router.currentRoute.value.path,
        leaksBackendText: html.includes(error.message) || html.includes('CAUSE-MARKER'),
      })
    }

    // Assert
    expect(observed).toEqual([
      { route: '/register', leaksBackendText: false },
      { route: '/register', leaksBackendText: false },
    ])
    expect(messages[0]).toContain('Server nicht erreichbar')
    expect(messages[1]).not.toBe('')
    expect(messages[1]).not.toContain('Server nicht erreichbar')
  })

  test('shows a hint at each empty required field and sends no request', async () => {
    // Arrange
    repository.register.mockRejectedValue(new UnexpectedAuthError())
    const observed: { emptied: string; hints: string[][]; calls: number }[] = []

    // Act
    for (const label of Object.keys(VALUES)) {
      document.body.innerHTML = ''
      repository.register.mockClear()
      const { wrapper } = await mountRegister()
      await fill(wrapper, { [label]: '' })
      await submit(wrapper)
      observed.push({
        emptied: label,
        hints: Object.keys(VALUES).map((other) => fieldMessages(wrapper, other)),
        calls: repository.register.mock.calls.length,
      })
    }
    document.body.innerHTML = ''
    repository.register.mockClear()
    const { wrapper } = await mountRegister()
    await fill(wrapper, {
      [EMAIL]: 'not-an-email',
      [PASSWORD]: 'x',
      [PASSWORD_CONFIRM]: 'y',
    })
    await submit(wrapper)
    const invalidValuesCalls = repository.register.mock.calls.length

    // Assert
    const labels = Object.keys(VALUES)
    for (const row of observed) {
      expect(row.calls).toBe(0)
      row.hints.forEach((hints, index) => {
        expect(hints).toHaveLength(labels[index] === row.emptied ? 1 : 0)
      })
    }
    expect(invalidValuesCalls).toBe(1)
  })

  test('disables the button with a spinner while waiting and sends only one request', async () => {
    // Arrange
    let reject: (error: Error) => void = () => {}
    repository.register.mockReturnValue(
      new Promise<AuthResult>((_resolve, rejectFn) => {
        reject = rejectFn
      }),
    )
    const { wrapper } = await mountRegister()
    await fill(wrapper)

    // Act
    await buttonByText(wrapper, 'Konto erstellen').trigger('click')
    await buttonByText(wrapper, 'Konto erstellen').trigger('click')
    await wrapper.find('form').trigger('submit')
    await settle()
    const whileWaiting = {
      disabled: buttonByText(wrapper, 'Konto erstellen').attributes('disabled'),
      spinner: wrapper.find('.v-progress-circular').exists(),
      calls: repository.register.mock.calls.length,
    }
    reject(new UnexpectedAuthError())
    await settle()

    // Assert
    expect(whileWaiting.disabled).toBeDefined()
    expect(whileWaiting.spinner).toBe(true)
    expect(whileWaiting.calls).toBe(1)
    expect(buttonByText(wrapper, 'Konto erstellen').attributes('disabled')).toBeUndefined()
  })

  test('sends the user to the login view with the username prefilled when the follow-up login fails', async () => {
    // Arrange
    repository.register.mockRejectedValue(new RegistrationLoginFailedError())
    const { wrapper, router, store } = await mountRegister()

    // Act
    await fill(wrapper, {
      [USERNAME]: 'otto',
      [PASSWORD]: 'Geheim-123',
      [PASSWORD_CONFIRM]: 'Geheim-123',
    })
    await submit(wrapper)

    // Assert
    expect(router.currentRoute.value.path).toBe('/login')
    expect(wrapper.text()).toContain('Konto angelegt, bitte anmelden')
    expect(inputByLabel(wrapper, 'E-Mail oder Benutzername').element.value).toBe('otto')
    expect(inputByLabel(wrapper, 'Passwort').element.value).toBe('')
    expect(store.tokens).toBeNull()
    expect(JSON.stringify(store.$state)).not.toContain('Geheim-123')
  })

  test('keeps password and tokens out of storage, cookies, store state and console', async () => {
    // Arrange
    const spies = (['log', 'info', 'warn', 'error', 'debug'] as const).map((method) =>
      vi.spyOn(console, method).mockImplementation(() => {}),
    )
    repository.register.mockResolvedValue({
      ...authResult(),
      tokens: { access: 'ACCESS-MARKER', refresh: 'REFRESH-MARKER' },
    })
    const { wrapper, store } = await mountRegister()

    // Act
    await fill(wrapper, { [PASSWORD]: 'PASSWORD-MARKER', [PASSWORD_CONFIRM]: 'PASSWORD-MARKER' })
    await submit(wrapper)

    // Assert
    const visible = JSON.stringify([
      { ...localStorage },
      { ...sessionStorage },
      document.cookie,
      spies.flatMap((spy) => spy.mock.calls),
    ])
    for (const marker of ['PASSWORD-MARKER', 'ACCESS-MARKER', 'REFRESH-MARKER']) {
      expect(visible).not.toContain(marker)
    }
    expect(JSON.stringify(store.$state)).not.toContain('PASSWORD-MARKER')
    expect(store.isAuthenticated).toBe(true)
  })
})
