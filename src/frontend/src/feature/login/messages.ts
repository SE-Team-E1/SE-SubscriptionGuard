import { NetworkError } from '@/repository/auth/authErrors'

export const loginMessages = {
  loginRequired: 'Bitte E-Mail oder Benutzernamen eingeben.',
  passwordRequired: 'Bitte Passwort eingeben.',
  invalidCredentials: 'Anmeldung fehlgeschlagen. E-Mail/Benutzername oder Passwort ist falsch.',
}

export const generalMessages = {
  networkError: 'Server nicht erreichbar. Bitte prüfe deine Verbindung und versuche es erneut.',
  unexpectedError: 'Etwas ist schiefgelaufen. Bitte versuche es später erneut.',
}

// Maps repository errors to texts for the views, never passing backend texts through.
export function generalErrorMessage(error: unknown): string {
  return error instanceof NetworkError
    ? generalMessages.networkError
    : generalMessages.unexpectedError
}
