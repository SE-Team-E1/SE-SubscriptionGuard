import type { AuthTokens, User } from '@/domain/userModel'
import type { AuthRepository, AuthResult, RegistrationInput } from './repositories'
import {
  InvalidCredentialsError,
  RegistrationValidationError,
  SessionExpiredError,
  UnexpectedAuthError,
} from './authErrors'
import type { RegistrationFieldErrors } from './registrationErrorCodes'

interface StoredUser extends User {
  password: string
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export class MockedAuthRepository implements AuthRepository {
  private readonly users: StoredUser[] = [
    {
      id: 1,
      username: 'otto',
      email: 'otto@example.com',
      firstName: '',
      lastName: '',
      password: 'passwort123',
    },
  ]
  private nextId = 2
  private tokenCounter = 0
  private readonly issuedRefreshTokens = new Set<string>()

  async login(login: string, password: string): Promise<AuthResult> {
    const identifier = login.trim().toLowerCase()
    const secret = password.trim()
    if (identifier === '' || secret === '') {
      throw new UnexpectedAuthError()
    }

    const byEmail = identifier.includes('@')
    const stored = this.users.find((u) =>
      byEmail ? u.email.toLowerCase() === identifier : u.username.toLowerCase() === identifier,
    )
    if (stored === undefined || stored.password !== secret) {
      throw new InvalidCredentialsError()
    }
    return { user: this.toUser(stored), tokens: this.issueTokens() }
  }

  async register(input: RegistrationInput): Promise<AuthResult> {
    const username = input.username.trim()
    const email = input.email.trim()
    const password = input.password.trim()
    const passwordConfirm = input.passwordConfirm.trim()

    const errors: RegistrationFieldErrors = {}
    if (username === '') {
      errors.username = ['USERNAME_REQUIRED']
    } else if (username.includes('@')) {
      errors.username = ['USERNAME_CONTAINS_AT']
    } else if (this.users.some((u) => u.username.toLowerCase() === username.toLowerCase())) {
      errors.username = ['USERNAME_TAKEN']
    }

    if (email === '') {
      errors.email = ['EMAIL_REQUIRED']
    } else if (!EMAIL_PATTERN.test(email)) {
      errors.email = ['EMAIL_INVALID']
    } else if (this.users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
      errors.email = ['EMAIL_TAKEN']
    }

    if (password === '') {
      errors.password = ['PASSWORD_REQUIRED']
    } else if (password.length < 8) {
      errors.password = ['PASSWORD_TOO_SHORT']
    }

    if (passwordConfirm === '') {
      errors.password_confirm = ['PASSWORD_CONFIRM_REQUIRED']
    }

    if (Object.keys(errors).length === 0 && password !== passwordConfirm) {
      errors.password_confirm = ['PASSWORD_MISMATCH']
    }

    if (Object.keys(errors).length > 0) {
      throw new RegistrationValidationError(errors)
    }

    this.users.push({
      id: this.nextId++,
      username,
      email: email.toLowerCase(),
      firstName: '',
      lastName: '',
      password,
    })
    return this.login(username, password)
  }

  async refresh(refreshToken: string): Promise<AuthTokens> {
    const token = refreshToken.trim()
    if (token === '' || !this.issuedRefreshTokens.has(token)) {
      throw new SessionExpiredError()
    }
    return this.issueTokens()
  }

  private issueTokens(): AuthTokens {
    this.tokenCounter += 1
    const tokens = {
      access: `mock-access-${this.tokenCounter}`,
      refresh: `mock-refresh-${this.tokenCounter}`,
    }
    this.issuedRefreshTokens.add(tokens.refresh)
    return tokens
  }

  private toUser(stored: StoredUser): User {
    return {
      id: stored.id,
      username: stored.username,
      email: stored.email,
      firstName: stored.firstName,
      lastName: stored.lastName,
    }
  }
}
