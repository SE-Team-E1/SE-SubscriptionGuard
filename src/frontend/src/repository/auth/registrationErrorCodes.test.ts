import { describe, expect, test } from 'vitest'
import { mapRegistrationErrors, type RegistrationField } from './registrationErrorCodes'

const USERNAME_CHARS =
  'Enter a valid username. This value may contain only letters, numbers, and @/./+/-/_ characters.'

// Ausgeschrieben, nicht aus der Implementierung abgeleitet (E-QA-11)
const CASES: [RegistrationField, string, string][] = [
  ['username', 'This field is required.', 'USERNAME_REQUIRED'],
  ['username', 'This field may not be blank.', 'USERNAME_REQUIRED'],
  ['username', 'This field may not be null.', 'USERNAME_REQUIRED'],
  ['username', 'Ensure this field has no more than 150 characters.', 'USERNAME_TOO_LONG'],
  ['username', USERNAME_CHARS, 'USERNAME_INVALID_CHARS'],
  ['username', "Username must not contain '@'.", 'USERNAME_CONTAINS_AT'],
  ['username', 'A user with that username already exists.', 'USERNAME_TAKEN'],
  ['email', 'This field is required.', 'EMAIL_REQUIRED'],
  ['email', 'This field may not be blank.', 'EMAIL_REQUIRED'],
  ['email', 'This field may not be null.', 'EMAIL_REQUIRED'],
  ['email', 'Enter a valid email address.', 'EMAIL_INVALID'],
  ['email', 'Ensure this field has no more than 254 characters.', 'EMAIL_TOO_LONG'],
  ['email', 'A user with this email already exists.', 'EMAIL_TAKEN'],
  ['password', 'This field is required.', 'PASSWORD_REQUIRED'],
  ['password', 'This field may not be blank.', 'PASSWORD_REQUIRED'],
  ['password', 'This field may not be null.', 'PASSWORD_REQUIRED'],
  ['password', 'Ensure this field has at least 8 characters.', 'PASSWORD_TOO_SHORT'],
  ['password_confirm', 'This field is required.', 'PASSWORD_CONFIRM_REQUIRED'],
  ['password_confirm', 'This field may not be blank.', 'PASSWORD_CONFIRM_REQUIRED'],
  ['password_confirm', 'This field may not be null.', 'PASSWORD_CONFIRM_REQUIRED'],
  [
    'password_confirm',
    'Ensure this field has at least 8 characters.',
    'PASSWORD_CONFIRM_TOO_SHORT',
  ],
  ['password_confirm', 'Passwords do not match.', 'PASSWORD_MISMATCH'],
]

describe('mapRegistrationErrors', () => {
  test.each(CASES)('maps %s "%s" to %s', (field, text, code) => {
    // T-10
    // Arrange
    const body = { [field]: [text] }

    // Act
    const result = mapRegistrationErrors(body)

    // Assert
    expect(result).toEqual({ [field]: [code] })
  })

  test('covers all 22 table cases', () => {
    // T-10
    // Arrange: CASES table above

    // Act
    const count = CASES.length

    // Assert
    expect(count).toBe(22)
  })

  test('returns null for an unknown text at a known field', () => {
    // T-11
    // Arrange
    const unknown = { username: ['Something new.'] }
    const mixed = { username: ['A user with that username already exists.', 'Something new.'] }

    // Act
    const resultUnknown = mapRegistrationErrors(unknown)
    const resultMixed = mapRegistrationErrors(mixed)

    // Assert
    expect(resultUnknown).toBeNull()
    expect(resultMixed).toBeNull()
  })

  test('returns null for an unknown field', () => {
    // T-12
    // Arrange
    const unknownAndKnown = { first_name: ['x'], email: ['Enter a valid email address.'] }
    const nonField = { non_field_errors: ['x'] }

    // Act
    const resultMixed = mapRegistrationErrors(unknownAndKnown)
    const resultNonField = mapRegistrationErrors(nonField)

    // Assert
    expect(resultMixed).toBeNull()
    expect(resultNonField).toBeNull()
  })

  test.each([
    ['empty object', {}],
    ['empty list', { username: [] }],
    ['string instead of list', { username: 'A user with that username already exists.' }],
    ['array body', ['x']],
    ['null', null],
    ['string body', 'x'],
  ])('returns null for special form: %s', (_name, body) => {
    // T-22
    // Arrange: body from the test table

    // Act
    const result = mapRegistrationErrors(body)

    // Assert
    expect(result).toBeNull()
  })

  test('keeps backend order and removes duplicates', () => {
    // T-20
    // Arrange
    const body = {
      username: ['Ensure this field has no more than 150 characters.', USERNAME_CHARS],
      password: ['This field is required.', 'This field may not be blank.'],
    }

    // Act
    const result = mapRegistrationErrors(body)

    // Assert
    expect(result).toEqual({
      username: ['USERNAME_TOO_LONG', 'USERNAME_INVALID_CHARS'],
      password: ['PASSWORD_REQUIRED'],
    })
  })

  test('trims the text but stays case-sensitive', () => {
    // T-21
    // Arrange
    const padded = { password_confirm: ['  Passwords do not match. '] }
    const lower = { password_confirm: ['passwords do not match.'] }

    // Act
    const resultPadded = mapRegistrationErrors(padded)
    const resultLower = mapRegistrationErrors(lower)

    // Assert
    expect(resultPadded).toEqual({ password_confirm: ['PASSWORD_MISMATCH'] })
    expect(resultLower).toBeNull()
  })
})
