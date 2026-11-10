import { TypeGuardError } from 'typia'
import type { AuthTokens } from '@/domain/userModel'
import type { AuthRepository, AuthResult, RegistrationInput } from './repositories'
import {
  InvalidCredentialsError,
  NetworkError,
  RegistrationLoginFailedError,
  RegistrationValidationError,
  SessionExpiredError,
  UnexpectedAuthError,
  isAuthError,
} from './authErrors'
import type { RestLoginRequestDTO } from './dto/loginDto'
import type { RestRegisterRequestDTO } from './dto/registerDto'
import type { RestRefreshRequestDTO } from './dto/refreshDto'
import { parseRestLoginResponseDTO, parseRestRefreshResponseDTO } from './restDtoValidation'
import { mapUserDTOToUser } from './mapper/userMapper'
import { mapRegistrationErrors } from './registrationErrorCodes'

const LOGIN_URL = '/api/auth/login/'
const REGISTER_URL = '/api/auth/register/'
const REFRESH_URL = '/api/auth/refresh/'

async function post(url: string, body: unknown): Promise<Response> {
  try {
    return await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })
  } catch (cause) {
    throw new NetworkError({ cause })
  }
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json()
  } catch (cause) {
    if (cause instanceof SyntaxError) {
      throw new UnexpectedAuthError({ cause })
    }
    throw cause
  }
}

function unexpectedStatus(status: number): UnexpectedAuthError {
  return new UnexpectedAuthError({ cause: new Error(`HTTP ${status}`) })
}

// Only path and expected type, never the offending value.
function validate<T>(parse: (input: unknown) => T, input: unknown): T {
  try {
    return parse(input)
  } catch (error) {
    if (error instanceof TypeGuardError) {
      throw new UnexpectedAuthError({
        cause: new Error(`Invalid response at ${error.path}, expected ${error.expected}`),
      })
    }
    throw error
  }
}

function normalize(error: unknown): Error {
  if (isAuthError(error)) {
    return error
  }
  return new UnexpectedAuthError({ cause: new Error('Unexpected internal error') })
}

export class RestAuthRepository implements AuthRepository {
  async login(login: string, password: string): Promise<AuthResult> {
    try {
      const request: RestLoginRequestDTO = { login: login.trim(), password: password.trim() }
      const response = await post(LOGIN_URL, request)

      if (response.status === 401) {
        throw new InvalidCredentialsError()
      }
      if (response.status !== 200) {
        throw unexpectedStatus(response.status)
      }

      const dto = validate(parseRestLoginResponseDTO, await readJson(response))
      return {
        user: mapUserDTOToUser(dto.user),
        tokens: { access: dto.access, refresh: dto.refresh },
      }
    } catch (error) {
      throw normalize(error)
    }
  }

  async register(input: RegistrationInput): Promise<AuthResult> {
    const username = input.username.trim()
    const password = input.password.trim()
    try {
      const request: RestRegisterRequestDTO = {
        username,
        email: input.email.trim(),
        password,
        password_confirm: input.passwordConfirm.trim(),
      }
      const response = await post(REGISTER_URL, request)

      if (response.status === 400) {
        const fieldErrors = mapRegistrationErrors(await readJson(response))
        if (fieldErrors === null) {
          throw new UnexpectedAuthError({
            cause: new Error('HTTP 400: unmappable registration errors'),
          })
        }
        throw new RegistrationValidationError(fieldErrors)
      }
      if (response.status !== 201) {
        throw unexpectedStatus(response.status)
      }
    } catch (error) {
      throw normalize(error)
    }

    try {
      return await this.login(username, password)
    } catch (cause) {
      throw new RegistrationLoginFailedError({ cause })
    }
  }

  async refresh(refreshToken: string): Promise<AuthTokens> {
    try {
      const token = refreshToken.trim()
      if (token === '') {
        throw new SessionExpiredError()
      }

      const request: RestRefreshRequestDTO = { refresh: token }
      const response = await post(REFRESH_URL, request)

      if (response.status === 401) {
        throw new SessionExpiredError()
      }
      if (response.status !== 200) {
        throw unexpectedStatus(response.status)
      }

      const dto = validate(parseRestRefreshResponseDTO, await readJson(response))
      return { access: dto.access, refresh: dto.refresh }
    } catch (error) {
      throw normalize(error)
    }
  }
}
