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

// ---- Test helpers (lokal, E-34) ----

const SECRET_PASSWORD = 'pw-SECRET-123'
const SECRET_ACCESS = 'ACCESS-SECRET'
const SECRET_REFRESH = 'REFRESH-SECRET'

const fetchMock = vi.fn()

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function textResponse(status: number, body: string): Response {
  return new Response(status === 204 ? null : body, { status })
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

function refreshOk(): Response {
  return jsonResponse(200, { access: 'A2', refresh: 'R2' })
}

const USERNAME_TAKEN_BODY = {
  username: ['A user with that username already exists.'],
  email: ['A user with this email already exists.'],
}

function queue(...results: (Response | Error | object)[]): void {
  for (const result of results) {
    if (result instanceof Error) {
      fetchMock.mockRejectedValueOnce(result)
    } else {
      fetchMock.mockResolvedValueOnce(result)
    }
  }
}

function callOf(index: number): {
  url: string
  method: string | undefined
  headers: Record<string, string>
  body: unknown
} {
  const call = fetchMock.mock.calls[index] as [string, RequestInit]
  return {
    url: call[0],
    method: call[1].method,
    headers: call[1].headers as Record<string, string>,
    body: JSON.parse(call[1].body as string),
  }
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
  const seen = new Set<unknown>()
  let current: unknown = error
  while (current instanceof Error && !seen.has(current)) {
    seen.add(current)
    for (const key of Object.getOwnPropertyNames(current)) {
      if (key === 'stack' || key === 'cause') continue
      const value = (current as unknown as Record<string, unknown>)[key]
      parts.push(typeof value === 'string' ? value : JSON.stringify(value))
    }
    current = current.cause
  }
  return parts.join('\n')
}

function clearCookies(): void {
  for (const cookie of document.cookie.split(';')) {
    const name = cookie.split('=')[0]?.trim()
    if (name) document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT`
  }
}

describe('RestAuthRepository', () => {
  let repo: RestAuthRepository

  beforeEach(() => {
    fetchMock.mockReset()
    vi.stubGlobal('fetch', fetchMock)
    localStorage.clear()
    sessionStorage.clear()
    clearCookies()
    repo = new RestAuthRepository()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  describe('login', () => {
    test('sends the login request and maps the user (typia smoke test)', async () => {
      // T-1
      // Arrange
      queue(loginOk())

      // Act
      const result = await repo.login('otto', 'passwort123')

      // Assert
      expect(fetchMock).toHaveBeenCalledTimes(1)
      const call = callOf(0)
      expect(call.url).toBe('/api/auth/login/')
      expect(call.method).toBe('POST')
      expect(call.headers['Content-Type']).toBe('application/json')
      expect(call.body).toEqual({ login: 'otto', password: 'passwort123' })
      expect(result).toEqual({
        user: { id: 7, username: 'otto', email: '', firstName: 'Otto', lastName: 'N' },
        tokens: { access: 'ACCESS-1', refresh: 'REFRESH-1' },
      })
    })

    test('throws InvalidCredentialsError on 401', async () => {
      // T-2
      // Arrange
      queue(jsonResponse(401, { error: 'Invalid credentials' }))

      // Act
      const promise = repo.login('otto', 'falsch')

      // Assert
      const error = await expectAuthError(promise, InvalidCredentialsError)
      expect(error).not.toBeInstanceOf(NetworkError)
      expect(error).not.toBeInstanceOf(UnexpectedAuthError)
    })

    test.each([
      ['200 without refresh', () => jsonResponse(200, { access: 'A', user: {} })],
      ['200 with html text body', () => textResponse(200, '<html>oops</html>')],
    ])('throws UnexpectedAuthError for %s', async (_name, response) => {
      // T-4
      // Arrange
      queue(response())

      // Act
      const promise = repo.login('otto', 'passwort123')

      // Assert
      await expectAuthError(promise, UnexpectedAuthError)
    })

    test.each([
      ['empty login', '', 'x', ''],
      ['blank login', '   ', 'x', ''],
    ])('sends %s trimmed and does not short-circuit', async (_name, login, password, sent) => {
      // T-6
      // Arrange
      queue(jsonResponse(400, { login: ['This field may not be blank.'] }))

      // Act
      const promise = repo.login(login, password)

      // Assert
      const error = await expectAuthError(promise, UnexpectedAuthError)
      expect(error).not.toBeInstanceOf(InvalidCredentialsError)
      expect(fetchMock).toHaveBeenCalledTimes(1)
      expect(callOf(0).body).toEqual({ login: sent, password: 'x' })
    })

    test('tolerates and drops additional user fields', async () => {
      // T-19
      // Arrange
      queue(
        loginOk({
          user: {
            id: 7,
            username: 'otto',
            email: '',
            first_name: 'Otto',
            last_name: 'N',
            is_staff: true,
            last_login: '2026-01-01T00:00:00Z',
          },
        }),
      )

      // Act
      const result = await repo.login('otto', 'passwort123')

      // Assert
      expect(Object.keys(result.user).sort()).toEqual([
        'email',
        'firstName',
        'id',
        'lastName',
        'username',
      ])
    })

    test.each([
      ['empty access', () => loginOk({ access: '' })],
      ['missing user', () => jsonResponse(200, { access: 'A', refresh: 'R' })],
      [
        'missing user.email',
        () => loginOk({ user: { id: 7, username: 'otto', first_name: 'Otto', last_name: 'N' } }),
      ],
    ])('throws UnexpectedAuthError for 200 with %s', async (_name, response) => {
      // T-24
      // Arrange
      queue(response())

      // Act
      const promise = repo.login('otto', 'passwort123')

      // Assert
      await expectAuthError(promise, UnexpectedAuthError)
    })

    test('maps 401 without JSON body to InvalidCredentialsError', async () => {
      // T-25 (a)
      // Arrange
      queue(textResponse(401, 'nope'))

      // Act
      const promise = repo.login('otto', 'falsch')

      // Assert
      await expectAuthError(promise, InvalidCredentialsError)
    })

    test('throws a sanitized cause when the user id has the wrong type', async () => {
      // T-44
      // Arrange
      queue(
        loginOk({
          user: {
            id: 'SECRET-ID-7',
            username: 'otto',
            email: '',
            first_name: 'Otto',
            last_name: 'N',
          },
        }),
      )

      // Act
      const promise = repo.login('otto', 'passwort123')

      // Assert
      const error = await expectAuthError(promise, UnexpectedAuthError)
      const cause = error.cause as Error
      expect(cause.message).toContain('user.id')
      expect(cause.message).toContain('number')
      expect(collectErrorText(error)).not.toContain('SECRET-ID-7')
      expect(cause.name).not.toBe('TypeGuardError')
      expect(cause.cause).toBeUndefined()
    })

    test('throws UnexpectedAuthError for 201 on login', async () => {
      // T-42 (a)
      // Arrange
      queue(jsonResponse(201, {}))

      // Act
      const promise = repo.login('otto', 'passwort123')

      // Assert
      await expectAuthError(promise, UnexpectedAuthError)
    })

    test('wraps unknown internal errors without the original', async () => {
      // T-50
      // Arrange
      const broken = {
        get status(): number {
          throw new Error(`internal ${SECRET_ACCESS} ${SECRET_PASSWORD}`)
        },
      }
      queue(broken)

      // Act
      const promise = repo.login('otto', SECRET_PASSWORD)

      // Assert
      const error = await expectAuthError(promise, UnexpectedAuthError)
      expect((error.cause as Error).message).toBe('Unexpected internal error')
      expect(error.cause).toBeInstanceOf(Error)
      expect((error.cause as Error).cause).toBeUndefined()
      const text = collectErrorText(error)
      expect(text).not.toContain(SECRET_ACCESS)
      expect(text).not.toContain(SECRET_PASSWORD)
    })
  })

  describe('register', () => {
    const input = {
      username: 'Lena',
      email: 'lena@example.com',
      password: 'passwort123',
      passwordConfirm: 'passwort123',
    }

    test('registers and then logs in with the trimmed credentials', async () => {
      // T-7
      // Arrange
      queue(registerOk(), loginOk({ access: 'ACCESS-L', refresh: 'REFRESH-L' }))

      // Act
      const result = await repo.register(input)

      // Assert
      expect(fetchMock).toHaveBeenCalledTimes(2)
      expect(callOf(0).url).toBe('/api/auth/register/')
      expect(callOf(0).body).toEqual({
        username: 'Lena',
        email: 'lena@example.com',
        password: 'passwort123',
        password_confirm: 'passwort123',
      })
      expect(callOf(1).url).toBe('/api/auth/login/')
      expect(callOf(1).body).toEqual({ login: 'Lena', password: 'passwort123' })
      expect(result.tokens).toEqual({ access: 'ACCESS-L', refresh: 'REFRESH-L' })
    })

    test.each([
      ['500', () => textResponse(500, 'boom')],
      ['401', () => jsonResponse(401, { error: 'Invalid credentials' })],
      ['fetch rejection', () => new TypeError('Failed to fetch')],
    ])('throws RegistrationLoginFailedError when the follow-up login fails (%s)', async (_n, f) => {
      // T-8
      // Arrange
      queue(registerOk(), f())

      // Act
      const promise = repo.register(input)

      // Assert
      await expectAuthError(promise, RegistrationLoginFailedError)
    })

    test('maps a 400 to RegistrationValidationError with codes only', async () => {
      // T-9
      // Arrange
      queue(jsonResponse(400, USERNAME_TAKEN_BODY))

      // Act
      const promise = repo.register(input)

      // Assert
      const error = await expectAuthError(promise, RegistrationValidationError)
      expect(error.fieldErrors).toEqual({ username: ['USERNAME_TAKEN'], email: ['EMAIL_TAKEN'] })
      expect(collectErrorText(error)).not.toContain('already exists')
      expect(fetchMock).toHaveBeenCalledTimes(1)
    })

    test('ignores a non-JSON 201 body', async () => {
      // T-23
      // Arrange
      queue(textResponse(201, 'created'), loginOk())

      // Act
      const result = await repo.register(input)

      // Assert
      expect(result.user.username).toBe('otto')
    })

    test('throws RegistrationLoginFailedError when the follow-up login has no refresh', async () => {
      // T-26
      // Arrange
      queue(registerOk(), jsonResponse(200, { access: 'A', user: {} }))

      // Act
      const promise = repo.register(input)

      // Assert
      await expectAuthError(promise, RegistrationLoginFailedError)
    })

    test.each([
      ['unknown text', { username: ['Something new.'] }],
      ['unknown field', { non_field_errors: ['x'] }],
    ])('throws UnexpectedAuthError for an unmappable 400 (%s)', async (_name, body) => {
      // T-45
      // Arrange
      queue(jsonResponse(400, body))

      // Act
      const promise = repo.register(input)

      // Assert
      const error = await expectAuthError(promise, UnexpectedAuthError)
      expect((error.cause as Error).message).toBe('HTTP 400: unmappable registration errors')
      expect(fetchMock).toHaveBeenCalledTimes(1)
    })

    test.each([
      ['array body', () => jsonResponse(400, ['x'])],
      ['non-JSON body', () => textResponse(400, '<html>')],
    ])('throws UnexpectedAuthError for a 400 with %s', async (_name, response) => {
      // T-46
      // Arrange
      queue(response())

      // Act
      const promise = repo.register(input)

      // Assert
      await expectAuthError(promise, UnexpectedAuthError)
    })

    test('throws UnexpectedAuthError for 200 on register without a follow-up login', async () => {
      // T-42 (c)
      // Arrange
      queue(jsonResponse(200, {}))

      // Act
      const promise = repo.register(input)

      // Assert
      await expectAuthError(promise, UnexpectedAuthError)
      expect(fetchMock).toHaveBeenCalledTimes(1)
    })
  })

  describe('refresh', () => {
    test('sends the refresh token and returns the new pair', async () => {
      // T-13
      // Arrange
      queue(refreshOk())

      // Act
      const result = await repo.refresh('R1')

      // Assert
      expect(fetchMock).toHaveBeenCalledTimes(1)
      const call = callOf(0)
      expect(call.url).toBe('/api/auth/refresh/')
      expect(call.method).toBe('POST')
      expect(call.body).toEqual({ refresh: 'R1' })
      expect(result).toEqual({ access: 'A2', refresh: 'R2' })
    })

    test('throws SessionExpiredError on 401', async () => {
      // T-14
      // Arrange
      queue(jsonResponse(401, { detail: 'Token is invalid or expired', code: 'token_not_valid' }))

      // Act
      const promise = repo.refresh('R1')

      // Assert
      await expectAuthError(promise, SessionExpiredError)
    })

    test.each([
      ['200 without refresh', () => jsonResponse(200, { access: 'A2' })],
      ['400', () => jsonResponse(400, { refresh: ['This field is required.'] })],
    ])('throws UnexpectedAuthError for %s', async (_name, response) => {
      // T-15
      // Arrange
      queue(response())

      // Act
      const promise = repo.refresh('R1')

      // Assert
      await expectAuthError(promise, UnexpectedAuthError)
    })

    test('maps 401 with an empty JSON body to SessionExpiredError', async () => {
      // T-25 (b)
      // Arrange
      queue(jsonResponse(401, {}))

      // Act
      const promise = repo.refresh('R1')

      // Assert
      await expectAuthError(promise, SessionExpiredError)
    })

    test('throws UnexpectedAuthError for 204 on refresh', async () => {
      // T-42 (b)
      // Arrange
      queue(textResponse(204, ''))

      // Act
      const promise = repo.refresh('R1')

      // Assert
      await expectAuthError(promise, UnexpectedAuthError)
    })

    test.each([[''], ['   ']])(
      'throws SessionExpiredError for "%s" without a request',
      async (t) => {
        // T-43
        // Arrange: fetch spy from beforeEach

        // Act
        const promise = repo.refresh(t)

        // Assert
        await expectAuthError(promise, SessionExpiredError)
        expect(fetchMock).not.toHaveBeenCalled()
      },
    )
  })

  describe('shared behavior', () => {
    test('throws NetworkError when fetch rejects', async () => {
      // T-3
      // Arrange
      const failure = new TypeError('Failed to fetch')
      const operations: [string, () => Promise<unknown>][] = [
        ['login', () => repo.login('otto', 'passwort123')],
        [
          'register',
          () =>
            repo.register({
              username: 'lena',
              email: 'lena@example.com',
              password: 'passwort123',
              passwordConfirm: 'passwort123',
            }),
        ],
        ['refresh', () => repo.refresh('R1')],
      ]

      for (const [name, run] of operations) {
        fetchMock.mockReset()
        queue(failure)

        // Act
        const promise = run()

        // Assert
        const error = await expectAuthError(promise, NetworkError)
        expect(error.cause).toBe(failure)
        if (name === 'register') expect(fetchMock).toHaveBeenCalledTimes(1)
      }
    })

    test('throws UnexpectedAuthError without the backend text on 500', async () => {
      // T-5
      // Arrange
      const operations: [string, () => Promise<unknown>][] = [
        ['login', () => repo.login('otto', 'passwort123')],
        [
          'register',
          () =>
            repo.register({
              username: 'lena',
              email: 'lena@example.com',
              password: 'passwort123',
              passwordConfirm: 'passwort123',
            }),
        ],
        ['refresh', () => repo.refresh('R1')],
      ]

      for (const [name, run] of operations) {
        fetchMock.mockReset()
        queue(jsonResponse(500, { detail: 'Server exploded' }))

        // Act
        const promise = run()

        // Assert
        const error = await expectAuthError(promise, UnexpectedAuthError)
        expect(error.message).not.toContain('Server exploded')
        expect(collectErrorText(error)).not.toContain('Server exploded')
        if (name === 'register') expect(fetchMock).toHaveBeenCalledTimes(1)
      }
    })
  })

  describe('security', () => {
    test('sends no Authorization header', async () => {
      // T-16
      // Arrange
      queue(loginOk(), registerOk(), loginOk(), refreshOk())

      // Act
      await repo.login('otto', 'passwort123')
      await repo.register({
        username: 'lena',
        email: 'lena@example.com',
        password: 'passwort123',
        passwordConfirm: 'passwort123',
      })
      await repo.refresh('R1')

      // Assert
      expect(fetchMock).toHaveBeenCalledTimes(4)
      for (let i = 0; i < 4; i++) {
        const names = Object.keys(callOf(i).headers).map((h) => h.toLowerCase())
        expect(names).not.toContain('authorization')
      }
    })

    const secretCases: [string, () => Promise<unknown>][] = [
      [
        'login 401',
        () => {
          queue(jsonResponse(401, { error: 'Invalid credentials' }))
          return repo.login('otto', SECRET_PASSWORD)
        },
      ],
      [
        'login 200 with invalid user.id',
        () => {
          queue(
            loginOk({
              access: SECRET_ACCESS,
              refresh: SECRET_REFRESH,
              user: { id: '7', username: 'otto', email: '', first_name: '', last_name: '' },
            }),
          )
          return repo.login('otto', SECRET_PASSWORD)
        },
      ],
      [
        'login 500',
        () => {
          queue(jsonResponse(500, { detail: 'Server exploded' }))
          return repo.login('otto', SECRET_PASSWORD)
        },
      ],
      [
        'login without JSON',
        () => {
          queue(textResponse(200, '<html>oops</html>'))
          return repo.login('otto', SECRET_PASSWORD)
        },
      ],
      [
        'register 400',
        () => {
          queue(jsonResponse(400, USERNAME_TAKEN_BODY))
          return repo.register({
            username: 'lena',
            email: 'lena@example.com',
            password: SECRET_PASSWORD,
            passwordConfirm: SECRET_PASSWORD,
          })
        },
      ],
      [
        'register 201 and follow-up login 500',
        () => {
          queue(registerOk(), jsonResponse(500, { detail: 'Server exploded' }))
          return repo.register({
            username: 'lena',
            email: 'lena@example.com',
            password: SECRET_PASSWORD,
            passwordConfirm: SECRET_PASSWORD,
          })
        },
      ],
      [
        'register 201 and follow-up login 200 without refresh',
        () => {
          queue(registerOk(), jsonResponse(200, { access: SECRET_ACCESS, user: {} }))
          return repo.register({
            username: 'lena',
            email: 'lena@example.com',
            password: SECRET_PASSWORD,
            passwordConfirm: SECRET_PASSWORD,
          })
        },
      ],
      [
        'refresh 401',
        () => {
          queue(jsonResponse(401, { detail: 'Token is invalid or expired' }))
          return repo.refresh(SECRET_REFRESH)
        },
      ],
      [
        'refresh 200 with only access',
        () => {
          queue(jsonResponse(200, { access: SECRET_ACCESS }))
          return repo.refresh(SECRET_REFRESH)
        },
      ],
      [
        'fetch rejects',
        () => {
          queue(new TypeError('Failed to fetch'))
          return repo.login('otto', SECRET_PASSWORD)
        },
      ],
      ['refresh with blank token', () => repo.refresh('   ')],
      [
        'login 200 with padded credentials',
        () => {
          queue(loginOk())
          return repo.login(' otto ', ` ${SECRET_PASSWORD} `)
        },
      ],
    ]

    test.each(secretCases)('leaks no secrets to console or errors: %s', async (name, run) => {
      // T-17
      // Arrange
      const spies = (['log', 'info', 'warn', 'error', 'debug'] as const).map((method) =>
        vi.spyOn(console, method).mockImplementation(() => {}),
      )
      const secrets = [SECRET_PASSWORD, SECRET_ACCESS, SECRET_REFRESH]

      // Act
      const outcome = await run().then(
        () => null,
        (e: unknown) => e,
      )

      // Assert
      const logged = JSON.stringify(spies.flatMap((spy) => spy.mock.calls))
      for (const secret of secrets) {
        expect(logged).not.toContain(secret)
      }
      if (name === 'login 200 with padded credentials') {
        expect(outcome).toBeNull()
      } else {
        expect(isAuthError(outcome)).toBe(true)
        const text = collectErrorText(outcome)
        for (const secret of secrets) {
          expect(text).not.toContain(secret)
        }
      }
    })

    test('leaves storage and cookies untouched', async () => {
      // T-18
      // Arrange
      queue(loginOk(), registerOk(), loginOk(), refreshOk())

      // Act
      await repo.login('otto', 'passwort123')
      await repo.register({
        username: 'lena',
        email: 'lena@example.com',
        password: 'passwort123',
        passwordConfirm: 'passwort123',
      })
      await repo.refresh('R1')

      // Assert
      expect(localStorage.length).toBe(0)
      expect(sessionStorage.length).toBe(0)
      expect(document.cookie).toBe('')
    })

    test('trims all inputs before sending', async () => {
      // T-51
      // Arrange
      queue(registerOk(), loginOk(), loginOk(), refreshOk())

      // Act
      const registered = await repo.register({
        username: ' lena ',
        email: ' lena@example.com ',
        password: ' passwort123 ',
        passwordConfirm: ' passwort123 ',
      })
      const loggedIn = await repo.login('  otto  ', ' pw ')
      const refreshed = await repo.refresh('  R1  ')

      // Assert
      expect(callOf(0).body).toEqual({
        username: 'lena',
        email: 'lena@example.com',
        password: 'passwort123',
        password_confirm: 'passwort123',
      })
      expect(callOf(1).body).toEqual({ login: 'lena', password: 'passwort123' })
      expect(callOf(2).body).toEqual({ login: 'otto', password: 'pw' })
      expect(callOf(3).body).toEqual({ refresh: 'R1' })
      expect(registered.tokens.access).toBe('ACCESS-1')
      expect(loggedIn.tokens.refresh).toBe('REFRESH-1')
      expect(refreshed).toEqual({ access: 'A2', refresh: 'R2' })
    })
  })
})
