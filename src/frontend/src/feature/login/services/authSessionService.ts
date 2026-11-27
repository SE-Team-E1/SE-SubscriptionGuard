import type { AuthRepository, AuthResult, RegistrationInput } from '@/repository/auth/repositories'
import { RegistrationLoginFailedError } from '@/repository/auth/authErrors'
import type { useSessionStore } from '@/stores/session'
import { generalMessages } from '../messages'

type SessionStore = ReturnType<typeof useSessionStore>

// Application service between the login composables and the auth repository.
// Errors are passed through unchanged, the views translate them into texts.
export class AuthSessionService {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly session: SessionStore,
  ) {}

  async login(login: string, password: string): Promise<AuthResult> {
    const result = await this.authRepository.login(login, password)
    this.session.setSession(result)
    return result
  }

  async register(input: RegistrationInput): Promise<AuthResult> {
    try {
      const result = await this.authRepository.register(input)
      this.session.setSession(result)
      return result
    } catch (error) {
      if (error instanceof RegistrationLoginFailedError) {
        this.session.setPendingLogin({
          notice: generalMessages.accountCreatedPleaseLogin,
          username: input.username.trim(),
        })
      }
      throw error
    }
  }
}
