import type { AuthTokens, User } from '@/domain/userModel'

export interface RegistrationInput {
  username: string
  email: string
  password: string
  passwordConfirm: string
}

export interface AuthResult {
  user: User
  tokens: AuthTokens
}

export interface AuthRepository {
  login(login: string, password: string): Promise<AuthResult>
  register(input: RegistrationInput): Promise<AuthResult>
  refresh(refreshToken: string): Promise<AuthTokens>
}
