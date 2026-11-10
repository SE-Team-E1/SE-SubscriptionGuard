import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { MockedAuthRepository } from './mockedRepositories'
import {
  InvalidCredentialsError,
  RegistrationValidationError,
  SessionExpiredError,
  UnexpectedAuthError,
  isAuthError,
} from './authErrors'
import type { RegistrationInput } from './repositories'

const BASE: RegistrationInput = {
  username: 'lena',
  email: 'lena@example.com',
  password: 'passwort123',
  passwordConfirm: 'passwort123',
}

const fetchSpy = vi.fn()

async function expectAuthError<T extends Error>(
  promise: Promise<unknown>,
  type: new (...args: never[]) => T,
): Promise<T> {
  const error: unknown = await promise.then(
    () => {
      throw new Error('Expected the operation to reject')
    },
    (e: unknown) => e,
  )
  expect(isAuthError(error)).toBe(true)
  expect(error).toBeInstanceOf(type)
  return error as T
}

describe('MockedAuthRepository', () => {
  let repo: MockedAuthRepository

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchSpy)
    fetchSpy.mockReset()
    localStorage.clear()
    sessionStorage.clear()
    repo = new MockedAuthRepository()
  })

  afterEach(() => {
    // T-39: no network access in any mock test
    expect(fetchSpy).not.toHaveBeenCalled()
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  describe('login', () => {
    test('logs in the demo user by e-mail ignoring case', async () => {
      // T-27
      // Arrange: fresh mock from beforeEach

      // Act
      const result = await repo.login('OTTO@Example.com', 'passwort123')

      // Assert
      expect(result.user.username).toBe('otto')
      expect(result.user.email).toBe('otto@example.com')
      expect(typeof result.user.id).toBe('number')
      expect(result.tokens.access).not.toBe('')
      expect(result.tokens.refresh).not.toBe('')
    })

    test.each([
      ['wrong password', 'otto', 'falsch'],
      ['unknown user', 'niemand', 'passwort123'],
    ])('throws InvalidCredentialsError for %s', async (_name, login, password) => {
      // T-28
      // Arrange: fresh mock from beforeEach

      // Act
      const promise = repo.login(login, password)

      // Assert
      await expectAuthError(promise, InvalidCredentialsError)
    })

    test('logs in by username ignoring case', async () => {
      // T-34
      // Arrange: fresh mock from beforeEach

      // Act
      const result = await repo.login('OTTO', 'passwort123')

      // Assert
      expect(result.user.username).toBe('otto')
    })

    test('trims the login before checking', async () => {
      // T-48
      // Arrange: fresh mock from beforeEach

      // Act
      const result = await repo.login('  otto  ', 'passwort123')

      // Assert
      expect(result.user.username).toBe('otto')
    })

    test.each([
      ['empty login', '', 'passwort123'],
      ['empty password', 'otto', ''],
    ])('throws UnexpectedAuthError for %s', async (_name, login, password) => {
      // T-49
      // Arrange: fresh mock from beforeEach

      // Act
      const promise = repo.login(login, password)

      // Assert
      await expectAuthError(promise, UnexpectedAuthError)
    })
  })

  describe('register', () => {
    test.each([
      ['username taken (case-insensitive)', { username: 'Otto' }, 'username', 'USERNAME_TAKEN'],
      ['username with @', { username: 'a@b' }, 'username', 'USERNAME_CONTAINS_AT'],
      ['email taken', { email: 'otto@example.com' }, 'email', 'EMAIL_TAKEN'],
      [
        'password too short',
        { password: 'kurz123', passwordConfirm: 'kurz123' },
        'password',
        'PASSWORD_TOO_SHORT',
      ],
      [
        'password mismatch',
        { passwordConfirm: 'passwort124' },
        'password_confirm',
        'PASSWORD_MISMATCH',
      ],
    ] as const)('rejects %s', async (_name, change, field, code) => {
      // T-29
      // Arrange
      const input = { ...BASE, ...change }

      // Act
      const promise = repo.register(input)

      // Assert
      const error = await expectAuthError(promise, RegistrationValidationError)
      expect(error.fieldErrors[field]).toContain(code)
    })

    test('registers and allows a later login with the same user id', async () => {
      // T-30
      // Arrange: fresh mock from beforeEach

      // Act
      const registered = await repo.register(BASE)
      const loggedIn = await repo.login('lena', 'passwort123')

      // Assert
      expect(registered.user.username).toBe('lena')
      expect(loggedIn.user.id).toBe(registered.user.id)
    })

    test('rejects an e-mail that is taken with different case', async () => {
      // T-37
      // Arrange
      const input = { ...BASE, email: 'OTTO@Example.com' }

      // Act
      const promise = repo.register(input)

      // Assert
      const error = await expectAuthError(promise, RegistrationValidationError)
      expect(error.fieldErrors.email).toEqual(['EMAIL_TAKEN'])
    })

    test.each([
      ['kurz123', 'kurz123'],
      ['kurz123', 'kurz124'],
    ])('collects all field errors without a mismatch (%s / %s)', async (password, confirm) => {
      // T-38
      // Arrange
      const input = {
        username: 'Otto',
        email: 'otto@example.com',
        password,
        passwordConfirm: confirm,
      }

      // Act
      const promise = repo.register(input)

      // Assert
      const error = await expectAuthError(promise, RegistrationValidationError)
      expect(error.fieldErrors.username).toContain('USERNAME_TAKEN')
      expect(error.fieldErrors.email).toContain('EMAIL_TAKEN')
      expect(error.fieldErrors.password).toContain('PASSWORD_TOO_SHORT')
      expect(error.fieldErrors.password_confirm).toBeUndefined()
    })

    test.each([
      ['username', { username: '' }, 'username', 'USERNAME_REQUIRED'],
      ['email', { email: '' }, 'email', 'EMAIL_REQUIRED'],
      ['email pattern', { email: 'kein-at' }, 'email', 'EMAIL_INVALID'],
      ['password', { password: '' }, 'password', 'PASSWORD_REQUIRED'],
      ['confirm', { passwordConfirm: '' }, 'password_confirm', 'PASSWORD_CONFIRM_REQUIRED'],
    ] as const)('reports required/invalid %s', async (_name, change, field, code) => {
      // T-33
      // Arrange
      const input = { ...BASE, ...change }

      // Act
      const promise = repo.register(input)

      // Assert
      const error = await expectAuthError(promise, RegistrationValidationError)
      expect(error.fieldErrors[field]).toContain(code)
    })

    test('keeps state per instance', async () => {
      // T-35
      // Arrange
      const other = new MockedAuthRepository()
      await repo.register(BASE)

      // Act
      const promise = other.login('lena', 'passwort123')

      // Assert
      await expectAuthError(promise, InvalidCredentialsError)
    })

    test('trims registration input', async () => {
      // T-52
      // Arrange
      const input = {
        username: ' lena ',
        email: ' lena@example.com ',
        password: ' passwort123 ',
        passwordConfirm: ' passwort123 ',
      }

      // Act
      const registered = await repo.register(input)
      const loggedIn = await repo.login('lena', 'passwort123')

      // Assert
      expect(registered.user.username).toBe('lena')
      expect(registered.user.email).toBe('lena@example.com')
      expect(loggedIn.user.id).toBe(registered.user.id)
    })
  })

  describe('refresh', () => {
    test('rejects foreign tokens and rotates issued ones', async () => {
      // T-31
      // Arrange
      const first = (await repo.login('otto', 'passwort123')).tokens

      // Act
      const foreign = repo.refresh('fremd')
      const second = await repo.refresh(first.refresh)
      const third = await repo.refresh(second.refresh)

      // Assert
      await expectAuthError(foreign, SessionExpiredError)
      expect(second.access).not.toBe('')
      expect(second.refresh).not.toBe('')
      expect(second.access).not.toBe(first.access)
      expect(second.refresh).not.toBe(first.refresh)
      expect(third.refresh).not.toBe(second.refresh)
    })

    test('rejects an access token', async () => {
      // T-36
      // Arrange
      const tokens = (await repo.login('otto', 'passwort123')).tokens

      // Act
      const promise = repo.refresh(tokens.access)

      // Assert
      await expectAuthError(promise, SessionExpiredError)
    })

    test.each([[''], ['   ']])('throws SessionExpiredError for "%s"', async (token) => {
      // T-47
      // Arrange: fresh mock from beforeEach

      // Act
      const promise = repo.refresh(token)

      // Assert
      await expectAuthError(promise, SessionExpiredError)
    })
  })

  describe('privacy', () => {
    test('writes no secrets to the console and leaves storage untouched', async () => {
      // T-32
      // Arrange
      const spies = (['log', 'info', 'warn', 'error', 'debug'] as const).map((m) =>
        vi.spyOn(console, m).mockImplementation(() => {}),
      )

      // Act
      const result = await repo.login('otto', 'passwort123')
      await repo.refresh(result.tokens.refresh)
      await repo.login('otto', 'falsch').catch(() => undefined)
      await repo.register(BASE)

      // Assert
      const logged = JSON.stringify(spies.flatMap((spy) => spy.mock.calls))
      expect(logged).not.toContain('passwort123')
      expect(logged).not.toContain(result.tokens.access)
      expect(logged).not.toContain(result.tokens.refresh)
      expect(localStorage.length).toBe(0)
      expect(sessionStorage.length).toBe(0)
      expect(document.cookie).toBe('')
    })
  })
})
