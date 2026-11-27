import type { RegistrationErrorCode } from '@/repository/auth/registrationErrorCodes'
import { NetworkError } from '@/repository/auth/authErrors'

export const loginMessages = {
  loginRequired: 'Bitte E-Mail oder Benutzernamen eingeben.',
  passwordRequired: 'Bitte Passwort eingeben.',
  invalidCredentials: 'Anmeldung fehlgeschlagen. E-Mail/Benutzername oder Passwort ist falsch.',
}

export const registrationMessages = {
  usernameRequired: 'Bitte einen Benutzernamen eingeben.',
  emailRequired: 'Bitte eine E-Mail-Adresse eingeben.',
  passwordRequired: 'Bitte ein Passwort eingeben.',
  passwordConfirmRequired: 'Bitte das Passwort wiederholen.',
}

export const generalMessages = {
  networkError: 'Server nicht erreichbar. Bitte prüfe deine Verbindung und versuche es erneut.',
  unexpectedError: 'Etwas ist schiefgelaufen. Bitte versuche es später erneut.',
  accountCreatedPleaseLogin: 'Konto angelegt, bitte anmelden.',
}

export const registrationErrorMessages: Record<RegistrationErrorCode, string> = {
  USERNAME_REQUIRED: 'Bitte einen Benutzernamen eingeben.',
  USERNAME_TOO_LONG: 'Der Benutzername darf höchstens 150 Zeichen lang sein.',
  USERNAME_INVALID_CHARS: 'Der Benutzername darf nur Buchstaben, Ziffern und . + - _ enthalten.',
  USERNAME_CONTAINS_AT: 'Der Benutzername darf kein @ enthalten.',
  USERNAME_TAKEN: 'Dieser Benutzername ist bereits vergeben.',
  EMAIL_REQUIRED: 'Bitte eine E-Mail-Adresse eingeben.',
  EMAIL_INVALID: 'Bitte eine gültige E-Mail-Adresse eingeben.',
  EMAIL_TOO_LONG: 'Die E-Mail-Adresse darf höchstens 254 Zeichen lang sein.',
  EMAIL_TAKEN: 'Für diese E-Mail-Adresse gibt es bereits ein Konto.',
  PASSWORD_REQUIRED: 'Bitte ein Passwort eingeben.',
  PASSWORD_TOO_SHORT: 'Das Passwort muss mindestens 8 Zeichen lang sein.',
  PASSWORD_CONFIRM_REQUIRED: 'Bitte das Passwort wiederholen.',
  PASSWORD_CONFIRM_TOO_SHORT: 'Die Wiederholung muss mindestens 8 Zeichen lang sein.',
  PASSWORD_MISMATCH: 'Die Passwörter stimmen nicht überein.',
}

// Maps repository errors to texts for the views, never passing backend texts through.
export function generalErrorMessage(error: unknown): string {
  return error instanceof NetworkError
    ? generalMessages.networkError
    : generalMessages.unexpectedError
}
