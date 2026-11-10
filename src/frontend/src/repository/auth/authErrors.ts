import type { RegistrationFieldErrors } from './registrationErrorCodes'

export class InvalidCredentialsError extends Error {
  constructor() {
    super('Login credentials were rejected')
    this.name = 'InvalidCredentialsError'
  }
}

export class RegistrationValidationError extends Error {
  readonly fieldErrors: RegistrationFieldErrors

  constructor(fieldErrors: RegistrationFieldErrors) {
    super('Registration data is invalid')
    this.name = 'RegistrationValidationError'
    this.fieldErrors = fieldErrors
  }
}

export class RegistrationLoginFailedError extends Error {
  constructor(options?: { cause?: unknown }) {
    super('Account was created but the automatic login failed', options)
    this.name = 'RegistrationLoginFailedError'
  }
}

export class SessionExpiredError extends Error {
  constructor() {
    super('Session expired, please log in again')
    this.name = 'SessionExpiredError'
  }
}

export class NetworkError extends Error {
  constructor(options?: { cause?: unknown }) {
    super('Network request failed', options)
    this.name = 'NetworkError'
  }
}

export class UnexpectedAuthError extends Error {
  constructor(options?: { cause?: unknown }) {
    super('Unexpected authentication error', options)
    this.name = 'UnexpectedAuthError'
  }
}

export type AuthError =
  | InvalidCredentialsError
  | RegistrationValidationError
  | RegistrationLoginFailedError
  | SessionExpiredError
  | NetworkError
  | UnexpectedAuthError

export function isAuthError(error: unknown): error is AuthError {
  return (
    error instanceof InvalidCredentialsError ||
    error instanceof RegistrationValidationError ||
    error instanceof RegistrationLoginFailedError ||
    error instanceof SessionExpiredError ||
    error instanceof NetworkError ||
    error instanceof UnexpectedAuthError
  )
}
