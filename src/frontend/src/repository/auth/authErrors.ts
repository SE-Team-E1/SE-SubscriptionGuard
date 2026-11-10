import type { RegistrationFieldErrors } from './registrationErrorCodes'

// Common base so callers and isAuthError do not need to know every concrete error.
export abstract class AuthError extends Error {
  protected constructor(name: string, message: string, options?: { cause?: unknown }) {
    super(message, options)
    this.name = name
  }
}

export class InvalidCredentialsError extends AuthError {
  constructor() {
    super('InvalidCredentialsError', 'Login credentials were rejected')
  }
}

export class RegistrationValidationError extends AuthError {
  readonly fieldErrors: RegistrationFieldErrors

  constructor(fieldErrors: RegistrationFieldErrors) {
    super('RegistrationValidationError', 'Registration data is invalid')
    this.fieldErrors = fieldErrors
  }
}

export class RegistrationLoginFailedError extends AuthError {
  constructor(options?: { cause?: unknown }) {
    super(
      'RegistrationLoginFailedError',
      'Account was created but the automatic login failed',
      options,
    )
  }
}

export class SessionExpiredError extends AuthError {
  constructor() {
    super('SessionExpiredError', 'Session expired, please log in again')
  }
}

export class NetworkError extends AuthError {
  constructor(options?: { cause?: unknown }) {
    super('NetworkError', 'Network request failed', options)
  }
}

export class UnexpectedAuthError extends AuthError {
  constructor(options?: { cause?: unknown }) {
    super('UnexpectedAuthError', 'Unexpected authentication error', options)
  }
}

export function isAuthError(error: unknown): error is AuthError {
  return error instanceof AuthError
}
