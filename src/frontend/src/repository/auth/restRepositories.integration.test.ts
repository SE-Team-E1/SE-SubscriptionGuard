import { afterAll, beforeAll, describe, expect, test, vi } from 'vitest'
import { RestAuthRepository } from './restRepositories'
import { InvalidCredentialsError } from './authErrors'
import { RestSubscriptionRepository } from '@/repository/subscriptions/restRepositories'

// Opt-in: runs only against a live backend, e.g.
//   SG_INTEGRATION_API_URL=http://localhost:8001 npm run test:integration
// The app tsconfig has no Node types, so process is typed locally.
const env = (globalThis as { process?: { env: Record<string, string | undefined> } }).process?.env
const baseUrl = env?.SG_INTEGRATION_API_URL

// A fresh user per run, so the test can be repeated without resetting the database.
const runId = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
const USERNAME = `it${runId}`
const EMAIL = `${USERNAME}@example.com`
const PASSWORD = 'Integration-123'

describe.skipIf(!baseUrl)('auth against the running backend', () => {
  const repo = new RestAuthRepository()

  beforeAll(() => {
    // The repositories use relative URLs, so point them at the backend.
    const realFetch = globalThis.fetch
    vi.stubGlobal('fetch', (input: RequestInfo | URL, init?: RequestInit) =>
      realFetch(typeof input === 'string' ? new URL(input, baseUrl).toString() : input, init),
    )
  })

  afterAll(() => {
    vi.unstubAllGlobals()
  })

  test('registers a new user and logs in right away', async () => {
    // Arrange
    const input = {
      username: USERNAME,
      email: EMAIL,
      password: PASSWORD,
      passwordConfirm: PASSWORD,
    }

    // Act
    const result = await repo.register(input)

    // Assert
    expect(result.user.username).toBe(USERNAME)
    expect(result.tokens.access).not.toBe('')
    expect(result.tokens.refresh).not.toBe('')
  })

  test('logs in with the email and with the username', async () => {
    // Act
    const byEmail = await repo.login(EMAIL, PASSWORD)
    const byUsername = await repo.login(USERNAME, PASSWORD)

    // Assert
    expect(byEmail.user.username).toBe(USERNAME)
    expect(byUsername.user.username).toBe(USERNAME)
  })

  test('rejects a wrong password', async () => {
    // Act & Assert
    await expect(repo.login(USERNAME, 'Falsch-123456')).rejects.toBeInstanceOf(
      InvalidCredentialsError,
    )
  })

  test('refreshes to a new token pair', async () => {
    // Arrange
    const { tokens } = await repo.login(USERNAME, PASSWORD)

    // Act
    const refreshed = await repo.refresh(tokens.refresh)

    // Assert
    expect(refreshed.access).not.toBe('')
    expect(refreshed.refresh).not.toBe('')
    expect(refreshed.access).not.toBe(tokens.access)
  })

  test('serves the subscriptions with a token and rejects the request without one', async () => {
    // Arrange
    const { tokens } = await repo.login(USERNAME, PASSWORD)

    // Act
    const withToken = await fetch('/api/subscriptions/?format=json', {
      headers: { Authorization: `Bearer ${tokens.access}` },
    })
    const withoutToken = await fetch('/api/subscriptions/?format=json')
    const list = await new RestSubscriptionRepository(() => tokens.access).findAll()

    // Assert
    expect(withToken.status).toBe(200)
    expect(withoutToken.status).toBe(401)
    expect(list).toEqual([])
  })
})
