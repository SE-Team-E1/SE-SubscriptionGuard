import { inject, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { InvalidCredentialsError } from '@/repository/auth/authErrors'
import { useSessionStore } from '@/stores/session'
import type { AuthSessionService } from '../services/authSessionService'
import { generalErrorMessage, loginMessages } from '../messages'

export default function useLogin() {
  const injected = inject<AuthSessionService>('authSessionService')
  if (injected === undefined) {
    throw new Error('authSessionService is not provided')
  }
  const service: AuthSessionService = injected
  const router = useRouter()

  const login = ref('')
  const password = ref('')
  const fieldErrors = reactive({ login: '', password: '' })
  const formError = ref('')
  const notice = ref('')
  const isSubmitting = ref(false)

  // Set by a registration whose automatic login failed: show the hint, prefill the username.
  const pending = useSessionStore().takePendingLogin()
  if (pending !== null) {
    login.value = pending.username
    notice.value = pending.notice
  }

  async function submit(): Promise<void> {
    if (isSubmitting.value) {
      return
    }
    formError.value = ''
    notice.value = ''
    fieldErrors.login = login.value.trim() === '' ? loginMessages.loginRequired : ''
    fieldErrors.password = password.value === '' ? loginMessages.passwordRequired : ''
    if (fieldErrors.login !== '' || fieldErrors.password !== '') {
      return
    }

    isSubmitting.value = true
    try {
      await service.login(login.value, password.value)
      await router.push('/list')
    } catch (error) {
      formError.value =
        error instanceof InvalidCredentialsError
          ? loginMessages.invalidCredentials
          : generalErrorMessage(error)
    } finally {
      isSubmitting.value = false
    }
  }

  return { login, password, fieldErrors, formError, notice, isSubmitting, submit }
}
