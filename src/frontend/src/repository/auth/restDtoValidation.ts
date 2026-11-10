import typia from 'typia'
import type { RestLoginResponseDTO } from './dto/loginDto'
import type { RestRefreshResponseDTO } from './dto/refreshDto'

// Login Dto Validation
export const parseRestLoginResponseDTO = (input: unknown): RestLoginResponseDTO =>
  typia.assert<RestLoginResponseDTO>(input)

// Refresh Dto Validation
export const parseRestRefreshResponseDTO = (input: unknown): RestRefreshResponseDTO =>
  typia.assert<RestRefreshResponseDTO>(input)
