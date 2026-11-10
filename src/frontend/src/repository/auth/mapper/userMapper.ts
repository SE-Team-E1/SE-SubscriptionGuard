import type { User } from '@/domain/userModel'
import type { RestUserDTO } from '../dto/loginDto'

export function mapUserDTOToUser(dto: RestUserDTO): User {
  return {
    id: dto.id,
    username: dto.username,
    email: dto.email,
    firstName: dto.first_name,
    lastName: dto.last_name,
  }
}
