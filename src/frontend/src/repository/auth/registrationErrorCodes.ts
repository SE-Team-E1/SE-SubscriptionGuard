export type RegistrationField = 'username' | 'email' | 'password' | 'password_confirm'

export type RegistrationErrorCode =
  | 'USERNAME_REQUIRED'
  | 'USERNAME_TOO_LONG'
  | 'USERNAME_INVALID_CHARS'
  | 'USERNAME_CONTAINS_AT'
  | 'USERNAME_TAKEN'
  | 'EMAIL_REQUIRED'
  | 'EMAIL_INVALID'
  | 'EMAIL_TOO_LONG'
  | 'EMAIL_TAKEN'
  | 'PASSWORD_REQUIRED'
  | 'PASSWORD_TOO_SHORT'
  | 'PASSWORD_CONFIRM_REQUIRED'
  | 'PASSWORD_CONFIRM_TOO_SHORT'
  | 'PASSWORD_MISMATCH'

export type RegistrationFieldErrors = Partial<Record<RegistrationField, RegistrationErrorCode[]>>

const REQUIRED_TEXTS = [
  'This field is required.',
  'This field may not be blank.',
  'This field may not be null.',
]

function withRequired(
  code: RegistrationErrorCode,
  others: Record<string, RegistrationErrorCode>,
): Record<string, RegistrationErrorCode> {
  const table: Record<string, RegistrationErrorCode> = { ...others }
  for (const text of REQUIRED_TEXTS) {
    table[text] = code
  }
  return table
}

// Backend text (DRF defaults and serializers.py) -> error code, per field.
const CODE_TABLE: Record<RegistrationField, Record<string, RegistrationErrorCode>> = {
  username: withRequired('USERNAME_REQUIRED', {
    'Ensure this field has no more than 150 characters.': 'USERNAME_TOO_LONG',
    'Enter a valid username. This value may contain only letters, numbers, and @/./+/-/_ characters.':
      'USERNAME_INVALID_CHARS',
    "Username must not contain '@'.": 'USERNAME_CONTAINS_AT',
    'A user with that username already exists.': 'USERNAME_TAKEN',
  }),
  email: withRequired('EMAIL_REQUIRED', {
    'Enter a valid email address.': 'EMAIL_INVALID',
    'Ensure this field has no more than 254 characters.': 'EMAIL_TOO_LONG',
    'A user with this email already exists.': 'EMAIL_TAKEN',
  }),
  password: withRequired('PASSWORD_REQUIRED', {
    'Ensure this field has at least 8 characters.': 'PASSWORD_TOO_SHORT',
  }),
  password_confirm: withRequired('PASSWORD_CONFIRM_REQUIRED', {
    'Ensure this field has at least 8 characters.': 'PASSWORD_CONFIRM_TOO_SHORT',
    'Passwords do not match.': 'PASSWORD_MISMATCH',
  }),
}

const FIELDS = Object.keys(CODE_TABLE) as RegistrationField[]

function isRegistrationField(key: string): key is RegistrationField {
  return (FIELDS as string[]).includes(key)
}

/**
 * Maps a registration 400 body to field error codes.
 * Strict: returns null unless every key is a known field and every text is a known message.
 */
export function mapRegistrationErrors(body: unknown): RegistrationFieldErrors | null {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    return null
  }
  const entries = Object.entries(body)
  if (entries.length === 0) {
    return null
  }

  const result: RegistrationFieldErrors = {}
  for (const [key, value] of entries) {
    if (!isRegistrationField(key)) {
      return null
    }
    if (!Array.isArray(value) || value.length === 0) {
      return null
    }
    const table = CODE_TABLE[key]
    const codes: RegistrationErrorCode[] = []
    for (const text of value as unknown[]) {
      if (typeof text !== 'string') {
        return null
      }
      const trimmed = text.trim()
      const code = Object.hasOwn(table, trimmed) ? table[trimmed] : undefined
      if (code === undefined) {
        return null
      }
      if (!codes.includes(code)) {
        codes.push(code)
      }
    }
    result[key] = codes
  }
  return result
}
