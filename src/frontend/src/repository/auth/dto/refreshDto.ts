import { tags } from 'typia'

export interface RestRefreshRequestDTO {
  refresh: string
}

export interface RestRefreshResponseDTO {
  access: string & tags.MinLength<1>
  refresh: string & tags.MinLength<1>
}
