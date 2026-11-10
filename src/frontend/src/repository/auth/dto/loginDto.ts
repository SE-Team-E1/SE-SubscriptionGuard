import { tags } from 'typia'

export interface RestLoginRequestDTO {
  login: string
  password: string
}

export interface RestUserDTO {
  id: number
  username: string
  email: string
  first_name: string
  last_name: string
}

export interface RestLoginResponseDTO {
  access: string & tags.MinLength<1>
  refresh: string & tags.MinLength<1>
  user: RestUserDTO
}
