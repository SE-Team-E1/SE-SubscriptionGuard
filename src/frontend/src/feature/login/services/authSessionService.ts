import type { AuthRepository, AuthResult } from '@/repository/auth/repositories'
import type { useSessionStore } from '@/stores/session'

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
}
