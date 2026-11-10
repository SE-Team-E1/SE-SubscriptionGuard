import { beforeEach, describe, expect, test } from 'vitest'
import { MockedAuthRepository } from './mockedRepositories'
import {
  InvalidCredentialsError,
  RegistrationValidationError,
  SessionExpiredError,
} from './authErrors'
import type { RegistrationInput } from './repositories'

const BASE: RegistrationInput = {
  username: 'lena',
  email: 'lena@example.com',
  password: 'passwort123',
  passwordConfirm: 'passwort123',
}

describe('MockedAuthRepository', () => {
  let repo: MockedAuthRepository

  beforeEach(() => {
    repo = new MockedAuthRepository()
  })

  test('logs in the demo user', async () => {
    // Arrange: fresh mock from beforeEach

    // Act
    const result = await repo.login('otto@example.com', 'passwort123')

    // Assert
    expect(result.user.username).toBe('otto')
    expect(result.tokens.access).not.toBe('')
    expect(result.tokens.refresh).not.toBe('')
  })

  test('throws InvalidCredentialsError for a wrong password', async () => {
    // Arrange: fresh mock from beforeEach

    // Act
    const promise = repo.login('otto', 'falsch')

    // Assert
    await expect(promise).rejects.toBeInstanceOf(InvalidCredentialsError)
  })

  test('registers a user who can log in afterwards', async () => {
    // Arrange: fresh mock from beforeEach

    // Act
    const registered = await repo.register(BASE)
    const loggedIn = await repo.login('lena', 'passwort123')

    // Assert
    expect(registered.user.username).toBe('lena')
    expect(loggedIn.user.id).toBe(registered.user.id)
  })

  test('rejects a taken username', async () => {
    // Arrange
    const input = { ...BASE, username: 'otto' }

    // Act
    const promise = repo.register(input)

    // Assert
    const error: unknown = await promise.catch((e: unknown) => e)
    expect(error).toBeInstanceOf(RegistrationValidationError)
    expect((error as RegistrationValidationError).fieldErrors.username).toContain('USERNAME_TAKEN')
  })

  test('rotates issued refresh tokens and rejects foreign ones', async () => {
    // Arrange
    const first = (await repo.login('otto', 'passwort123')).tokens

    // Act
    const second = await repo.refresh(first.refresh)
    const foreign = repo.refresh('fremd')

    // Assert
    expect(second.refresh).not.toBe(first.refresh)
    await expect(foreign).rejects.toBeInstanceOf(SessionExpiredError)
  })
})
