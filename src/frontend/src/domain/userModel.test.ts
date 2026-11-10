import { describe, expect, test } from 'vitest'
import type { AuthTokens, User } from './userModel'

describe('userModel', () => {
  test('User and AuthTokens have exactly the backend-aligned fields', () => {
    // T-41
    // Arrange
    const user: User = { id: 7, username: 'otto', email: '', firstName: 'Otto', lastName: 'N' }
    const tokens: AuthTokens = { access: 'a', refresh: 'r' }

    // @ts-expect-error a User must not carry a token
    const withToken: User = { ...user, token: 'x' }
    // @ts-expect-error id is a number, not a string
    const stringId: User = { ...user, id: '7' }

    // Act
    const keys = Object.keys(user).sort()

    // Assert
    expect(keys).toEqual(['email', 'firstName', 'id', 'lastName', 'username'])
    expect(Object.keys(tokens).sort()).toEqual(['access', 'refresh'])
    expect(withToken).toBeDefined()
    expect(stringId).toBeDefined()
  })
})
