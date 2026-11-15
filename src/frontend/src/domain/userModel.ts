export interface User {
  id: number
  username: string
  email: string
  firstName: string
  lastName: string
}

export interface AuthTokens {
  access: string
  refresh: string
}
