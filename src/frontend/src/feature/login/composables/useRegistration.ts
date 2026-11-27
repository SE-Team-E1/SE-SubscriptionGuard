import { inject, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  RegistrationLoginFailedError,
  RegistrationValidationError,
} from '@/repository/auth/authErrors'
import type {
  RegistrationErrorCode,
  RegistrationField,
} from '@/repository/auth/registrationErrorCodes'
import type { AuthSessionService } from '../services/authSessionService'
import { generalErrorMessage, registrationErrorMessages, registrationMessages } from '../messages'

type FieldErrors = Record<RegistrationField, string[]>

function emptyFieldErrors(): FieldErrors {
  return { username: [], email: [], password: [], password_confirm: [] }
}

function toMessages(codes: RegistrationErrorCode[] | undefined): string[] {
  return (codes ?? []).map((code) => registrationErrorMessages[code])
}

export default function useRegistration() {
  const injected = inject<AuthSessionService>('authSessionService')
  if (injected === undefined) {
    throw new Error('authSessionService is not provided')
  }
  const service: AuthSessionService = injected
  const router = useRouter()

  const username = ref('')
  const email = ref('')
  const password = ref('')
  const passwordConfirm = ref('')
  const fieldErrors = reactive<FieldErrors>(emptyFieldErrors())
  const formError = ref('')
  const isSubmitting = ref(false)

  function setFieldErrors(errors: FieldErrors): void {
    Object.assign(fieldErrors, errors)
  }

  // Only empty required fields are checked here, everything else is decided by the backend.
  function checkRequired(): boolean {
    const errors = emptyFieldErrors()
    if (username.value.trim() === '') errors.username = [registrationMessages.usernameRequired]
    if (email.value.trim() === '') errors.email = [registrationMessages.emailRequired]
    if (password.value === '') errors.password = [registrationMessages.passwordRequired]
    if (passwordConfirm.value === '') {
      errors.password_confirm = [registrationMessages.passwordConfirmRequired]
    }
    setFieldErrors(errors)
    return Object.values(errors).every((messages) => messages.length === 0)
  }

  async function submit(): Promise<void> {
    if (isSubmitting.value) {
      return
    }
    formError.value = ''
    if (!checkRequired()) {
      return
    }

    isSubmitting.value = true
    try {
      await service.register({
        username: username.value,
        email: email.value,
        password: password.value,
        passwordConfirm: passwordConfirm.value,
      })
      await router.push('/list')
    } catch (error) {
      if (error instanceof RegistrationValidationError) {
        setFieldErrors({
          username: toMessages(error.fieldErrors.username),
          email: toMessages(error.fieldErrors.email),
          password: toMessages(error.fieldErrors.password),
          password_confirm: toMessages(error.fieldErrors.password_confirm),
        })
      } else if (error instanceof RegistrationLoginFailedError) {
        await router.push('/login')
      } else {
        formError.value = generalErrorMessage(error)
      }
    } finally {
      isSubmitting.value = false
    }
  }

  return {
    username,
    email,
    password,
    passwordConfirm,
    fieldErrors,
    formError,
    isSubmitting,
    submit,
  }
}
