import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import {
  RegistrationLoginFailedError,
  RegistrationValidationError,
} from '@/repository/auth/authErrors'
import type { AuthResult } from '@/repository/auth/repositories'
import type {
  RegistrationErrorCode,
  RegistrationField,
  RegistrationFieldErrors,
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
    expect(inputs.map((input) => input.attributes('type') === 'password')).toEqual([
      false,
      false,
      true,
      true,
    ])
    expect(wrapper.findAll('.v-tab')).toHaveLength(0)
    expect(link?.attributes('href')).toBe('/login')
    expect(repository.register).toHaveBeenCalledExactlyOnceWith({
      username: 'lena',
      email: 'lena@example.com',
      password: ' Geheim-123 ',
      passwordConfirm: ' Geheim-123 ',
    })
    expect(store.tokens).toEqual({ access: 'ACCESS-1', refresh: 'REFRESH-1' })
    expect(router.currentRoute.value.path).toBe('/list')
  })

  test('shows a translated text at the matching field for every error code', async () => {
    // Arrange
    const cases: RegistrationFieldErrors[] = [
      ...ALL_CODES.map(([code, field]) => ({ [field]: [code] })),
      { username: ['USERNAME_TAKEN'], email: ['EMAIL_TAKEN'] },
    ]
    const fields = Object.keys(FIELD_LABELS) as RegistrationField[]

    // Act
    const observed = []
    for (const errors of cases) {
      document.body.innerHTML = ''
      repository.register.mockRejectedValueOnce(new RegistrationValidationError(errors))
      const { wrapper, router } = await mountRegister()
      await fill(wrapper)
      await submit(wrapper)
      const shown = fields.map((field) => fieldMessages(wrapper, FIELD_LABELS[field]))
      observed.push({ errors, route: router.currentRoute.value.path, shown })
    }

    // Assert
    for (const { errors, route, shown } of observed) {
      expect(route).toBe('/register')
      fields.forEach((field, index) => {
        const codes: string[] = errors[field] ?? []
        expect(shown[index]).toHaveLength(codes.length)
        for (const text of shown[index] ?? []) {
          expect(text).not.toBe('')
          expect(codes).not.toContain(text)
        }
      })
    }
    const singleCodeTexts = observed.slice(0, ALL_CODES.length).flatMap((row) => row.shown.flat())
    expect(new Set(singleCodeTexts).size).toBe(ALL_CODES.length)
  })

  test('sends the user to the login view with the username prefilled when the follow-up login fails', async () => {
    // Arrange
    repository.register.mockRejectedValue(new RegistrationLoginFailedError())
    const { wrapper, router, store } = await mountRegister()

    // Act
    await fill(wrapper, { [USERNAME]: 'otto' })
    await submit(wrapper)

    // Assert
    expect(router.currentRoute.value.path).toBe('/login')
    expect(wrapper.text()).toContain('Konto angelegt, bitte anmelden')
    expect(inputByLabel(wrapper, 'E-Mail oder Benutzername').element.value).toBe('otto')
    expect(inputByLabel(wrapper, 'Passwort').element.value).toBe('')
    expect(store.tokens).toBeNull()
    expect(JSON.stringify(store.$state)).not.toContain('Geheim-123')
  })
})
