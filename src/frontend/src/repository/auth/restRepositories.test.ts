import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { RestAuthRepository } from './restRepositories'
import {
  InvalidCredentialsError,
  NetworkError,
  RegistrationLoginFailedError,
  RegistrationValidationError,
  SessionExpiredError,
  UnexpectedAuthError,
  isAuthError,
} from './authErrors'

// ---- Test helpers ----

const SECRET_PASSWORD = 'pw-SECRET-123'
const SECRET_ACCESS = 'ACCESS-SECRET'

const fetchMock = vi.fn()

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function loginOk(overrides: Record<string, unknown> = {}): Response {
  return jsonResponse(200, {
    access: 'ACCESS-1',
    refresh: 'REFRESH-1',
    user: { id: 7, username: 'otto', email: '', first_name: 'Otto', last_name: 'N' },
    ...overrides,
  })
}

function registerOk(): Response {
  return jsonResponse(201, { message: 'User created', access: 'REG-A', refresh: 'REG-R' })
}

const USERNAME_TAKEN_BODY = {
  username: ['A user with that username already exists.'],
  email: ['A user with this email already exists.'],
}

const REGISTRATION = {
  username: 'lena',
  email: 'lena@example.com',
  password: 'passwort123',
  passwordConfirm: 'passwort123',
}

function queue(...results: (Response | Error)[]): void {
  for (const result of results) {
    if (result instanceof Error) {
      fetchMock.mockRejectedValueOnce(result)
    } else {
      fetchMock.mockResolvedValueOnce(result)
    }
  }
}

function callOf(index: number): { url: string; method: string | undefined; body: unknown } {
  const call = fetchMock.mock.calls[index] as [string, RequestInit]
  return { url: call[0], method: call[1].method, body: JSON.parse(call[1].body as string) }
}

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

// Collects message and own fields along the whole cause chain (without stack).
function collectErrorText(error: unknown): string {
  const parts: string[] = []
  let current: unknown = error
  while (current instanceof Error) {
    for (const key of Object.getOwnPropertyNames(current)) {
      if (key === 'stack' || key === 'cause') continue
      const value = (current as unknown as Record<string, unknown>)[key]
      parts.push(typeof value === 'string' ? value : JSON.stringify(value))
    }
    current = current.cause
  }
  return parts.join('\n')
}

describe('RestAuthRepository', () => {
  let repo: RestAuthRepository

  beforeEach(() => {
    fetchMock.mockReset()
    vi.stubGlobal('fetch', fetchMock)
    repo = new RestAuthRepository()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  describe('login', () => {
    test('sends the login request and maps the user', async () => {
      // Arrange
      queue(loginOk())

      // Act
      const result = await repo.login('otto', 'passwort123')

      // Assert
      expect(fetchMock).toHaveBeenCalledTimes(1)
      const call = callOf(0)
      expect(call.url).toBe('/api/auth/login/')
      expect(call.method).toBe('POST')
      expect(call.body).toEqual({ login: 'otto', password: 'passwort123' })
      expect(result).toEqual({
        user: { id: 7, username: 'otto', email: '', firstName: 'Otto', lastName: 'N' },
        tokens: { access: 'ACCESS-1', refresh: 'REFRESH-1' },
      })
    })

    test('throws InvalidCredentialsError on 401', async () => {
      // Arrange
      queue(jsonResponse(401, { error: 'Invalid credentials' }))

      // Act
      const promise = repo.login('otto', 'falsch')

      // Assert
      await expectAuthError(promise, InvalidCredentialsError)
    })

    test('throws UnexpectedAuthError for an invalid 200 body', async () => {
      // Arrange
      queue(jsonResponse(200, { access: 'A', user: {} }))

      // Act
      const promise = repo.login('otto', 'passwort123')

      // Assert
      await expectAuthError(promise, UnexpectedAuthError)
    })
  })

  describe('register', () => {
    test('registers and then logs in with the trimmed credentials', async () => {
      // Arrange
      queue(registerOk(), loginOk({ access: 'ACCESS-L', refresh: 'REFRESH-L' }))

      // Act
      const result = await repo.register({
        username: ' lena ',
        email: ' lena@example.com ',
        password: ' passwort123 ',
        passwordConfirm: ' passwort123 ',
      })

      // Assert
      expect(fetchMock).toHaveBeenCalledTimes(2)
      expect(callOf(0).url).toBe('/api/auth/register/')
      expect(callOf(0).body).toEqual({
        username: 'lena',
        email: 'lena@example.com',
        password: 'passwort123',
        password_confirm: 'passwort123',
      })
      expect(callOf(1).url).toBe('/api/auth/login/')
      expect(callOf(1).body).toEqual({ login: 'lena', password: 'passwort123' })
      expect(result.tokens).toEqual({ access: 'ACCESS-L', refresh: 'REFRESH-L' })
    })

    test('throws RegistrationLoginFailedError when the follow-up login fails', async () => {
      // Arrange
      queue(registerOk(), jsonResponse(500, {}))

      // Act
      const promise = repo.register(REGISTRATION)

      // Assert
      await expectAuthError(promise, RegistrationLoginFailedError)
    })

    test('maps a 400 to RegistrationValidationError with codes only', async () => {
      // Arrange
      queue(jsonResponse(400, USERNAME_TAKEN_BODY))

      // Act
      const promise = repo.register(REGISTRATION)

      // Assert
      const error = await expectAuthError(promise, RegistrationValidationError)
      expect(error.fieldErrors).toEqual({ username: ['USERNAME_TAKEN'], email: ['EMAIL_TAKEN'] })
      expect(fetchMock).toHaveBeenCalledTimes(1)
    })

    test('throws UnexpectedAuthError for an unmappable 400', async () => {
      // Arrange
      queue(jsonResponse(400, { username: ['Something new.'] }))

      // Act
      const promise = repo.register(REGISTRATION)

      // Assert
      await expectAuthError(promise, UnexpectedAuthError)
    })
  })

  describe('refresh', () => {
    test('sends the refresh token and returns the new pair', async () => {
      // Arrange
      queue(jsonResponse(200, { access: 'A2', refresh: 'R2' }))

      // Act
      const result = await repo.refresh('R1')

      // Assert
      expect(callOf(0).url).toBe('/api/auth/refresh/')
      expect(callOf(0).body).toEqual({ refresh: 'R1' })
      expect(result).toEqual({ access: 'A2', refresh: 'R2' })
    })

    test('throws SessionExpiredError on 401', async () => {
      // Arrange
      queue(jsonResponse(401, { detail: 'Token is invalid or expired', code: 'token_not_valid' }))

      // Act
      const promise = repo.refresh('R1')

      // Assert
      await expectAuthError(promise, SessionExpiredError)
    })

    test('throws SessionExpiredError for a blank token without a request', async () => {
      // Arrange: fetch spy from beforeEach

      // Act
      const promise = repo.refresh('   ')

      // Assert
      await expectAuthError(promise, SessionExpiredError)
      expect(fetchMock).not.toHaveBeenCalled()
    })
  })

  describe('shared behavior', () => {
    const operations: [string, (repo: RestAuthRepository) => Promise<unknown>][] = [
      ['login', (r) => r.login('otto', 'passwort123')],
      ['register', (r) => r.register(REGISTRATION)],
      ['refresh', (r) => r.refresh('R1')],
    ]

    test('throws NetworkError when fetch rejects', async () => {
      for (const [, run] of operations) {
        // Arrange
        fetchMock.mockReset()
        queue(new TypeError('Failed to fetch'))

        // Act
        const promise = run(repo)

        // Assert
        await expectAuthError(promise, NetworkError)
      }
    })

    test('throws UnexpectedAuthError without the backend text on 500', async () => {
      for (const [, run] of operations) {
        // Arrange
        fetchMock.mockReset()
        queue(jsonResponse(500, { detail: 'Server exploded' }))

        // Act
        const promise = run(repo)

        // Assert
        const error = await expectAuthError(promise, UnexpectedAuthError)
        expect(collectErrorText(error)).not.toContain('Server exploded')
      }
    })

    test('leaks no secrets to console or errors', async () => {
      // Arrange
      const spies = (['log', 'info', 'warn', 'error', 'debug'] as const).map((method) =>
        vi.spyOn(console, method).mockImplementation(() => {}),
      )
      queue(
        jsonResponse(401, { error: 'Invalid credentials' }),
        loginOk({
          access: SECRET_ACCESS,
          user: { id: 'SECRET-ID', username: 'otto', email: '', first_name: '', last_name: '' },
        }),
      )

      // Act
      const errors = [
        await repo.login('otto', SECRET_PASSWORD).catch((e: unknown) => e),
        await repo.login('otto', SECRET_PASSWORD).catch((e: unknown) => e),
      ]

      // Assert
      const text =
        JSON.stringify(spies.flatMap((spy) => spy.mock.calls)) +
        errors.map(collectErrorText).join('\n')
      for (const secret of [SECRET_PASSWORD, SECRET_ACCESS, 'SECRET-ID']) {
        expect(text).not.toContain(secret)
      }
    })
  })
})
