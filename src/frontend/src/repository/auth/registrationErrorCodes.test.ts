import { describe, expect, test } from 'vitest'
import { mapRegistrationErrors, type RegistrationField } from './registrationErrorCodes'

// Ausgeschrieben, nicht aus der Implementierung abgeleitet
const CASES: [RegistrationField, string, string][] = [
  ['username', 'This field is required.', 'USERNAME_REQUIRED'],
  ['username', 'This field may not be blank.', 'USERNAME_REQUIRED'],
  ['username', 'This field may not be null.', 'USERNAME_REQUIRED'],
  ['username', 'Ensure this field has no more than 150 characters.', 'USERNAME_TOO_LONG'],
  [
    'username',
    'Enter a valid username. This value may contain only letters, numbers, and @/./+/-/_ characters.',
    'USERNAME_INVALID_CHARS',
  ],
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
  test('maps every known backend message to its code', () => {
    for (const [field, text, code] of CASES) {
      // Arrange
      const body = { [field]: [text] }

      // Act
      const result = mapRegistrationErrors(body)

      // Assert
      expect(result, `${field}: ${text}`).toEqual({ [field]: [code] })
    }
  })

  test('returns null for unknown texts, unknown fields and malformed bodies', () => {
    // Arrange
    const bodies: unknown[] = [
      { username: ['Something new.'] },
      { non_field_errors: ['x'] },
      {},
      null,
    ]

    // Act
    const results = bodies.map((body) => mapRegistrationErrors(body))

    // Assert
    expect(results).toEqual([null, null, null, null])
  })
})
