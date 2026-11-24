import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import {
  RestCategoryRepository,
  RestProviderRepository,
  RestSubscriptionRepository,
} from './restRepositories'

const ACCESS_TOKEN = 'ACCESS-TOKEN-1'

const fetchMock = vi.fn<typeof fetch>()

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function requestOf(index: number): { url: string; headers: Headers } {
  const call = fetchMock.mock.calls[index]
  if (call === undefined) {
    throw new Error(`Expected fetch call ${index}`)
  }
  return { url: String(call[0]), headers: new Headers(call[1]?.headers) }
}

describe('REST subscription repositories', () => {
  beforeEach(() => {
    fetchMock.mockReset()
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  test('send the bearer token to the subscription, provider and category endpoints', async () => {
    // Arrange
    fetchMock.mockImplementation(() => Promise.resolve(jsonResponse(200, [])))
    const getAccessToken = () => ACCESS_TOKEN

    // Act
    await new RestSubscriptionRepository(getAccessToken).findAll()
    await new RestProviderRepository(getAccessToken).findAll()
    await new RestCategoryRepository(getAccessToken).findAll()

    // Assert
    expect(fetchMock).toHaveBeenCalledTimes(3)
    const urls = [0, 1, 2].map((i) => requestOf(i).url)
    expect(urls[0]).toContain('/api/subscriptions/')
    expect(urls[1]).toContain('/api/providers/')
    expect(urls[2]).toContain('/api/categories/')
    for (const i of [0, 1, 2]) {
      expect(requestOf(i).headers.get('Authorization')).toBe(`Bearer ${ACCESS_TOKEN}`)
    }
  })

  test('read the token on every request, so a new login takes effect', async () => {
    // Arrange
    fetchMock.mockImplementation(() => Promise.resolve(jsonResponse(200, [])))
    let token: string | undefined = 'FIRST'
    const repo = new RestSubscriptionRepository(() => token)

    // Act
    await repo.findAll()
    token = 'SECOND'
    await repo.findAll()

    // Assert
    expect(requestOf(0).headers.get('Authorization')).toBe('Bearer FIRST')
    expect(requestOf(1).headers.get('Authorization')).toBe('Bearer SECOND')
  })

  test('send no authorization header without a token', async () => {
    // Arrange
    fetchMock.mockImplementation(() => Promise.resolve(jsonResponse(200, [])))

    // Act
    await new RestSubscriptionRepository(() => undefined).findAll()

    // Assert
    expect(requestOf(0).headers.has('Authorization')).toBe(false)
  })

  test('fail with a cause on 401 and do not retry', async () => {
    // Arrange
    fetchMock.mockImplementation(() => Promise.resolve(jsonResponse(401, { detail: 'nope' })))
    const repo = new RestSubscriptionRepository(() => ACCESS_TOKEN)

    // Act
    const error: unknown = await repo.findAll().catch((e: unknown) => e)

    // Assert
    expect(error).toBeInstanceOf(Error)
    expect((error as Error).cause).toBeInstanceOf(Error)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})
